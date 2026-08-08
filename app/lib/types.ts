export interface CourseFile {
  handle: FileSystemFileHandle;
  path: string;
  name: string;
  type: 'video' | 'pdf' | 'unknown';
  size: number;
}

export interface CourseItem extends CourseFile {
  id: string; 
  duration?: number; 
}

export interface CourseModule {
  id: string;
  title: string;
  items: CourseItem[];
}

export interface CourseProgress {
  [itemId: string]: {
    progress: number; 
    duration: number; 
    currentTime: number; 
    completed: boolean;
  };
}

export interface Course {
  id: string;
  name: string;
  handle?: FileSystemDirectoryHandle;
  addedAt: number;
}

export interface Note {
  id: string;
  videoId: string;
  text: string;
  timestamp: number;
  createdAt: number;
}

export type AllCourseProgress = {
  [courseId: string]: CourseProgress;
};

export type AllNotes = {
  [courseId: string]: Note[];
};
