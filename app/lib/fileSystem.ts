import { CourseModule, CourseItem, CourseFile } from './types';
import { useCourseStore } from './courseStore';

export interface CourseMetadata {
  modules: {
    id: string;
    title: string;
    items: string[];
  }[];
}

const MODULE_REGEX = /^(\d+)\.\d+/;

export const saveCourseMetadata = async (
  dirHandle: FileSystemDirectoryHandle,
  metadata: CourseMetadata
) => {
  try {
    // Request readwrite permission if not granted
    // @ts-ignore
    if (await dirHandle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
      // @ts-ignore
      const permission = await dirHandle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        throw new Error("Permission denied to write metadata");
      }
    }
    
    // @ts-ignore
    const fileHandle = await dirHandle.getFileHandle('course-metadata.json', { create: true });
    // @ts-ignore
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(metadata, null, 2));
    await writable.close();
  } catch (err) {
    console.error("Failed to save course metadata:", err);
    throw err;
  }
};

// Get duration of a video file silently
export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(0);
    };

    video.src = URL.createObjectURL(file);
  });
};

export const parseDirectory = async (dirHandle: FileSystemDirectoryHandle, autoSave: boolean = false): Promise<CourseModule[]> => {
  const allFiles: CourseFile[] = [];
  
  // Try to load metadata
  let metadata: CourseMetadata | null = null;
  try {
    // @ts-ignore
    const fileHandle = await dirHandle.getFileHandle('course-metadata.json');
    // @ts-ignore
    const file = await fileHandle.getFile();
    const text = await file.text();
    metadata = JSON.parse(text);
  } catch (err) {
    // File doesn't exist or isn't readable
  }

  // Recursive function to walk directories
  async function walk(handle: FileSystemDirectoryHandle, currentPath: string = '') {
    for await (const entry of (handle as any).values()) {
      if (entry.kind === 'file') {
        const name = entry.name.toLowerCase();
        let type: CourseFile['type'] = 'unknown';
        if (name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.mkv')) type = 'video';
        else if (name.endsWith('.pdf')) type = 'pdf';

        if (type !== 'unknown') {
          // Note: Getting size requires await entry.getFile(), but doing it for all files
          // immediately can be slow. We'll skip size here for speed.
          allFiles.push({
            handle: entry,
            path: currentPath ? `${currentPath}/${entry.name}` : entry.name,
            name: entry.name,
            type,
            size: 0, 
          });
        }
      } else if (entry.kind === 'directory') {
        // Ignore hidden folders
        if (!entry.name.startsWith('.')) {
          await walk(entry, currentPath ? `${currentPath}/${entry.name}` : entry.name);
        }
      }
    }
  }

  await walk(dirHandle);

  const fileMap = new Map<string, CourseItem>();
  allFiles.forEach(f => {
    fileMap.set(f.path, { ...f, id: f.path });
  });

  let modules: CourseModule[] = [];

  if (metadata && metadata.modules) {
    // Strictly follow metadata
    metadata.modules.forEach(metaMod => {
      const items: CourseItem[] = [];
      metaMod.items.forEach(itemId => {
        if (fileMap.has(itemId)) {
          items.push(fileMap.get(itemId)!);
          fileMap.delete(itemId); // mark as used
        }
      });
      
      modules.push({
        id: metaMod.id,
        title: metaMod.title,
        items
      });
    });

    // Put unused files in a generic module
    if (fileMap.size > 0) {
      const unusedItems = Array.from(fileMap.values());
      unusedItems.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
      modules.push({
        id: 'new-files',
        title: 'Uncategorized Files',
        items: unusedItems
      });
    }
  } else {
    // Auto-generate modules based on paths
    const moduleMap = new Map<string, CourseItem[]>();

    for (const file of allFiles) {
      let moduleName = 'General';
      const pathParts = file.path.split('/');
      
      if (pathParts.length > 1) {
        moduleName = pathParts[0];
      } else {
        const match = file.name.match(MODULE_REGEX);
        if (match) {
          moduleName = `Module ${match[1]}`;
        }
      }

      const item: CourseItem = {
        ...file,
        id: file.path, 
      };

      if (!moduleMap.has(moduleName)) {
        moduleMap.set(moduleName, []);
      }
      moduleMap.get(moduleName)!.push(item);
    }

    // Convert map to array and sort
    modules = Array.from(moduleMap.entries()).map(([title, items]) => {
      items.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
      return {
        id: title,
        title: title,
        items,
      };
    });

    // Sort modules naturally
    modules.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));

    if (autoSave) {
      // Save it back to the directory
      const newMetadata: CourseMetadata = {
        modules: modules.map(m => ({
          id: m.id,
          title: m.title,
          items: m.items.map(i => i.id)
        }))
      };
      // Fire and forget, or await. We can await to be safe.
      try {
        await saveCourseMetadata(dirHandle, newMetadata);
      } catch (e) {
        console.error("Could not auto-save generated metadata:", e);
      }
    }
  }

  return modules;
};

export const extractDurationsInBackground = async (modules: CourseModule[]) => {
  const store = useCourseStore.getState();
  
  for (const mod of modules) {
    for (const item of mod.items) {
      if (item.type === 'video') {
        // Check if we already have duration in progress store
        const existingDuration = store.progress[item.id]?.duration;
        if (!existingDuration || existingDuration === 0) {
          try {
            const file = await (item.handle as any).getFile();
            const duration = await getVideoDuration(file);
            store.updateDuration(item.id, duration);
          } catch (e) {
            console.error(`Failed to get duration for ${item.name}`, e);
          }
        }
      }
    }
  }
};
