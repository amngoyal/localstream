"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useCourseStore } from '../lib/courseStore';
import { formatTime } from '../lib/utils';
import { CheckCircle2, Circle, FileText, PlayCircle, ChevronDown, ChevronRight, Search, List, Edit3, Trash2 } from 'lucide-react';

export default function Sidebar() {
  const { activeCourseId, modules, selectedItemId, setSelectedItemId, progress, notes, removeNote, sidebarWidth, setSidebarWidth } = useCourseStore();
  
  const [isResizing, setIsResizing] = useState(false);
  
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (selectedItemId) {
      const activeModule = modules.find(m => m.items.some(i => i.id === selectedItemId));
      if (activeModule) {
        initial[activeModule.id] = true;
      }
    } else if (modules.length > 0) {
      initial[modules[0].id] = true;
    }
    return initial;
  });

  React.useEffect(() => {
    if (selectedItemId) {
      const activeModule = modules.find(m => m.items.some(i => i.id === selectedItemId));
      if (activeModule) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setExpandedModules(prev => {
          if (!prev[activeModule.id]) {
            return { ...prev, [activeModule.id]: true };
          }
          return prev;
        });
      }
      setTimeout(() => {
        // Need to escape special characters like spaces, dots, slashes for document.getElementById if they aren't standard
        // But getElementById just works with exactly the id string.
        const el = document.getElementById(`sidebar-item-${selectedItemId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }, [selectedItemId, modules]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'notes'>('content');

  const toggleModule = (id: string) => {
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const courseNotes = activeCourseId ? (notes[activeCourseId] || []) : [];
  
  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    
    const query = searchQuery.toLowerCase();
    return modules.map(mod => ({
      ...mod,
      items: mod.items.filter(item => item.name.toLowerCase().includes(query))
    })).filter(mod => mod.items.length > 0 || mod.title.toLowerCase().includes(query));
  }, [modules, searchQuery]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      let newWidth = e.clientX;
      if (newWidth < 250) newWidth = 250;
      if (newWidth > window.innerWidth * 0.6) newWidth = window.innerWidth * 0.6;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <div 
      className="h-full bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden text-gray-300 font-sans relative shrink-0 w-full flex-1 md:flex-none md:w-[var(--sidebar-width)]"
      style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
    >
      
      {/* Resizer Handle */}
      <div 
        className="hidden md:block absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500 transition-colors z-50 group"
        onMouseDown={handleMouseDown}
      >
        <div className={`absolute top-1/2 -translate-y-1/2 -left-1.5 w-4 h-12 bg-gray-700/80 backdrop-blur border border-gray-600 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 ${isResizing ? 'opacity-100 bg-blue-500 border-blue-400' : ''} transition-opacity shadow-lg`}>
           <div className="w-0.5 h-4 bg-gray-400/80 rounded-full flex gap-0.5">
             <div className="w-px h-full bg-gray-300"></div>
             <div className="w-px h-full bg-gray-300"></div>
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-gray-950/50 relative">
        <button 
          onClick={() => setActiveTab('content')}
          className={`flex-1 p-3 flex items-center justify-center gap-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'content' ? 'border-blue-500 text-white bg-gray-900' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}
        >
          <List size={16} /> Content
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className={`flex-1 p-3 flex items-center justify-center gap-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'notes' ? 'border-blue-500 text-white bg-gray-900' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}`}
        >
          <Edit3 size={16} /> Notes ({courseNotes.length})
        </button>
      </div>
      
      {activeTab === 'content' && (
        <>
          <div className="p-3 border-b border-gray-800 bg-gray-900">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Expand all on search
                  if (e.target.value.trim()) {
                    const expanded: Record<string, boolean> = {};
                    modules.forEach(m => expanded[m.id] = true);
                    setExpandedModules(expanded);
                  }
                }}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="p-3 space-y-4">
              {filteredModules.map((module) => {
                const moduleProgress = progress[activeCourseId || ''] || {};
                const moduleDuration = module.items.reduce((acc, item) => acc + (moduleProgress[item.id]?.duration || 0), 0);
                const videoItems = module.items.filter(item => item.type !== 'pdf');
                const isModuleCompleted = videoItems.length > 0 && videoItems.every(item => moduleProgress[item.id]?.completed);

                return (
                  <div key={module.id} className="bg-gray-800/30 rounded-xl overflow-hidden border border-gray-800/50">
                    <button 
                      onClick={() => toggleModule(module.id)}
                      className="w-full flex items-center px-3 py-1 gap-2 bg-gray-800/80 hover:bg-gray-700/80 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="text-gray-400 shrink-0">
                          {expandedModules[module.id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          {isModuleCompleted && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                          <h3 className="font-medium text-white truncate">{module.title}</h3>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium bg-gray-900/40 px-2 py-1 rounded border border-gray-800 flex flex-col items-end shrink-0">
                        <span>{module.items.length} {module.items.length === 1 ? 'item' : 'items'}</span>
                        {moduleDuration > 0 && (
                          <span className="text-gray-500 mt-0.5">{formatTime(moduleDuration)}</span>
                        )}
                      </div>
                    </button>
                    
                    {expandedModules[module.id] && (
                      <div className="divide-y divide-gray-800/50">
                        {module.items.map((item) => {
                          const isSelected = selectedItemId === item.id;
                          const itemProgress = moduleProgress[item.id];
                          const isCompleted = itemProgress?.completed;
                          const progressPercent = itemProgress && itemProgress.duration > 0 
                            ? (itemProgress.currentTime / itemProgress.duration) * 100 
                            : 0;
                          
                          return (
                            <button
                              key={item.id}
                              id={`sidebar-item-${item.id}`}
                              onClick={() => setSelectedItemId(item.id)}
                              className={`w-full flex items-start p-3 gap-3 transition-all text-left relative group overflow-hidden
                                ${isSelected ? 'bg-blue-600/10' : 'hover:bg-gray-800/50'}
                              `}
                            >
                              {isSelected && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-md"></div>
                              )}
                              
                              <div className="flex-shrink-0 mt-0.5">
                                {item.type === 'video' ? (
                                  isCompleted ? (
                                    <CheckCircle2 size={18} className="text-green-500" />
                                  ) : (
                                    <PlayCircle size={18} className="text-gray-500 group-hover:text-gray-400" />
                                  )
                                ) : (
                                  <FileText size={18} className="text-red-400 group-hover:text-red-300" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-tight line-clamp-2 ${isSelected ? 'text-blue-400 font-medium' : 'text-gray-300'}`}>
                                  {item.name}
                                </p>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    {item.type === 'video' ? <PlayCircle size={12} /> : <FileText size={12} />}
                                    <span>{item.type === 'video' ? 'Video' : 'PDF'}</span>
                                  </div>
                                  
                                  {item.type === 'video' && itemProgress?.duration && itemProgress.duration > 0 ? (
                                    <div className="text-xs text-gray-500">
                                      {formatTime(itemProgress.duration)}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              
                              {item.type === 'video' && progressPercent > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-800">
                                  <div 
                                    className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'} transition-all duration-300`} 
                                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                                  />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {filteredModules.length === 0 && (
                <div className="text-center p-8 text-gray-500 text-sm">
                  {searchQuery ? 'No matching lessons found.' : 'No course content loaded.'}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'notes' && (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {courseNotes.length === 0 ? (
            <div className="text-center text-gray-500 text-sm mt-8">
              No notes taken yet. Use the player controls to add a timestamped note.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Sort notes by timestamp roughly, or just display them */}
              {courseNotes.map(note => {
                // Find item name
                let itemName = 'Unknown Video';
                modules.forEach(m => {
                  const found = m.items.find(i => i.id === note.videoId);
                  if (found) itemName = found.name;
                });

                return (
                  <div key={note.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700/50 group">
                    <div className="flex justify-between items-start mb-2">
                      <button 
                        onClick={() => {
                          setSelectedItemId(note.videoId);
                          // We need a way to tell the player to seek to note.timestamp.
                          // For simplicity, we can dispatch a custom event on window.
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('seek-to', { detail: { time: note.timestamp } }));
                          }, 100);
                        }}
                        className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-blue-500/30 transition-colors"
                      >
                        <PlayCircle size={10} /> {formatTime(note.timestamp)}
                      </button>
                      
                      <button 
                        onClick={() => removeNote(note.id)}
                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mb-1 line-clamp-1">{itemName}</p>
                    <p className="text-sm text-gray-200">{note.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
