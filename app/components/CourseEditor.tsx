"use client";

import React, { useState, useEffect } from 'react';
import { useCourseStore } from '../lib/courseStore';
import { saveCourseMetadata, parseDirectory, CourseMetadata } from '../lib/fileSystem';
import { X, ArrowUp, ArrowDown, Save, GripVertical } from 'lucide-react';
import { CourseModule } from '../lib/types';

export default function CourseEditor({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { activeCourseHandle, modules, setModules, setIsLoading } = useCourseStore();
  const [localModules, setLocalModules] = useState<CourseModule[]>([]);
  const [draggedItem, setDraggedItem] = useState<{ moduleId: string, itemId: string } | null>(null);

  // Clone modules when opening
  useEffect(() => {
    if (isOpen) {
      setLocalModules(JSON.parse(JSON.stringify(modules)));
    }
  }, [isOpen, modules]);

  const handleTitleChange = (moduleId: string, newTitle: string) => {
    setLocalModules(prev => prev.map(m => m.id === moduleId ? { ...m, title: newTitle } : m));
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === localModules.length - 1) return;

    setLocalModules(prev => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const moveItem = (sourceModuleId: string, itemId: string, targetModuleId: string) => {
    if (sourceModuleId === targetModuleId) return;

    setLocalModules(prev => {
      const copy = JSON.parse(JSON.stringify(prev)) as CourseModule[];
      const sourceModule = copy.find(m => m.id === sourceModuleId);
      const targetModule = copy.find(m => m.id === targetModuleId);
      
      if (!sourceModule || !targetModule) return prev;

      const itemIndex = sourceModule.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return prev;

      const [item] = sourceModule.items.splice(itemIndex, 1);
      targetModule.items.push(item);
      
      return copy;
    });
  };

  const handleDrop = (sourceModuleId: string, sourceItemId: string, targetModuleId: string, targetItemId: string | null) => {
    setLocalModules(prev => {
      const copy = JSON.parse(JSON.stringify(prev)) as CourseModule[];
      const sourceModule = copy.find(m => m.id === sourceModuleId);
      const targetModule = copy.find(m => m.id === targetModuleId);
      
      if (!sourceModule || !targetModule) return prev;

      const sourceItemIndex = sourceModule.items.findIndex(i => i.id === sourceItemId);
      if (sourceItemIndex === -1) return prev;
      
      // If dropping on itself, do nothing
      if (sourceModuleId === targetModuleId && sourceItemId === targetItemId) {
        return prev;
      }

      const [item] = sourceModule.items.splice(sourceItemIndex, 1);
      
      if (targetItemId === null) {
        // Dropped on empty module
        targetModule.items.push(item);
      } else {
        let targetItemIndex = targetModule.items.findIndex(i => i.id === targetItemId);
        if (targetItemIndex === -1) targetItemIndex = targetModule.items.length;
        targetModule.items.splice(targetItemIndex, 0, item);
      }
      
      return copy;
    });
  };

  const handleSave = async () => {
    if (!activeCourseHandle) return;

    try {
      setIsLoading(true);

      // Verify readwrite permission (just in case they opened an old course)
      // @ts-ignore
      if (await activeCourseHandle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
        alert("We need permission to save the new layout to your folder. Please grant it in the next prompt.");
        // @ts-ignore
        const perm = await activeCourseHandle.requestPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
          throw new Error("Permission denied");
        }
      }

      // Build metadata
      const newMetadata: CourseMetadata = {
        modules: localModules.map(m => ({
          id: m.id,
          title: m.title,
          items: m.items.map(i => i.id)
        }))
      };

      await saveCourseMetadata(activeCourseHandle, newMetadata);
      
      // Reload modules
      const updatedModules = await parseDirectory(activeCourseHandle);
      setModules(updatedModules);
      
      onClose();
    } catch (e) {
      console.error("Failed to save", e);
      alert("Failed to save changes. Make sure you grant write permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 overflow-hidden font-sans">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl max-h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 px-6 border-b border-gray-800 bg-gray-950">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Course Layout</h2>
            <p className="text-sm text-gray-400 mt-1">Rename modules, reorder them, and move videos between modules.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 space-y-6">
          {localModules.map((mod, modIdx) => (
            <div key={mod.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-sm">
              
              {/* Module Header Editor */}
              <div className="p-4 bg-gray-950/40 border-b border-gray-700/50 flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => moveModule(modIdx, 'up')}
                    disabled={modIdx === 0}
                    className="text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button 
                    onClick={() => moveModule(modIdx, 'down')}
                    disabled={modIdx === localModules.length - 1}
                    className="text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
                
                <div className="flex-1">
                  <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 block">Module Title</label>
                  <input 
                    value={mod.title}
                    onChange={(e) => handleTitleChange(mod.id, e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white font-semibold w-full focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Items List */}
              <div 
                className="divide-y divide-gray-700/50"
                onDragOver={(e) => {
                  if (mod.items.length === 0) e.preventDefault();
                }}
                onDrop={(e) => {
                  if (mod.items.length === 0 && draggedItem) {
                    e.preventDefault();
                    handleDrop(draggedItem.moduleId, draggedItem.itemId, mod.id, null);
                    setDraggedItem(null);
                  }
                }}
              >
                {mod.items.map((item) => (
                  <div 
                    key={item.id} 
                    draggable
                    onDragStart={(e) => {
                      setDraggedItem({ moduleId: mod.id, itemId: item.id });
                      // required for Firefox
                      e.dataTransfer.effectAllowed = "move";
                      if (e.dataTransfer) {
                         e.dataTransfer.setData('text/plain', item.id);
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!draggedItem) return;
                      handleDrop(draggedItem.moduleId, draggedItem.itemId, mod.id, item.id);
                      setDraggedItem(null);
                    }}
                    onDragEnd={() => setDraggedItem(null)}
                    className={`flex items-center gap-2 sm:gap-4 p-3 px-3 sm:px-5 hover:bg-gray-700/30 transition-colors group cursor-grab active:cursor-grabbing ${draggedItem?.itemId === item.id ? 'opacity-40 bg-blue-900/20' : ''}`}
                  >
                    <GripVertical size={16} className="text-gray-600 group-hover:text-gray-400 shrink-0" />
                    
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm text-gray-300 truncate">{item.name}</p>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <span className="hidden sm:inline text-xs text-gray-500">Move to:</span>
                      <select 
                        value={mod.id}
                        onChange={(e) => moveItem(mod.id, item.id, e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded px-1.5 sm:px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-20 sm:w-auto sm:max-w-[150px] truncate"
                      >
                        {localModules.map(m => (
                          <option key={m.id} value={m.id}>{m.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {mod.items.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500 italic">
                    No items in this module. Drop items here.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-gray-800 bg-gray-950 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
