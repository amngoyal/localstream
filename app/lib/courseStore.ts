import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CourseModule, AllCourseProgress, AllNotes, Note } from './types';

interface CourseState {
  activeCourseId: string | null;
  activeCourseHandle: FileSystemDirectoryHandle | null;
  modules: CourseModule[];
  selectedItemId: string | null;
  progress: AllCourseProgress;
  notes: AllNotes;
  lastOpenedItemIds: Record<string, string>;
  playbackSpeed: number;
  sidebarWidth: number;
  isLoading: boolean;
  setActiveCourseId: (id: string | null, handle?: FileSystemDirectoryHandle | null) => void;
  setModules: (modules: CourseModule[]) => void;
  setSelectedItemId: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setSidebarWidth: (width: number) => void;
  
  updateProgress: (itemId: string, current: number, total: number) => void;
  markCompleted: (itemId: string) => void;
  updateDuration: (itemId: string, duration: number) => void;
  
  addNote: (note: Note) => void;
  removeNote: (noteId: string) => void;
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set) => ({
      activeCourseId: null,
      activeCourseHandle: null,
      modules: [],
      selectedItemId: null,
      progress: {},
      notes: {},
      lastOpenedItemIds: {},
      playbackSpeed: 1,
      sidebarWidth: 320, // Default w-80
      isLoading: false,

      setActiveCourseId: (id, handle = null) => set({ activeCourseId: id, activeCourseHandle: handle, selectedItemId: null, modules: [] }),
      setModules: (modules) => set({ modules }),
      setSelectedItemId: (id) => set((state) => ({ 
        selectedItemId: id,
        lastOpenedItemIds: state.activeCourseId && id ? { ...(state.lastOpenedItemIds || {}), [state.activeCourseId]: id } : (state.lastOpenedItemIds || {})
      })),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      
      updateProgress: (itemId, current, total) =>
        set((state) => {
          if (!state.activeCourseId) return state;
          
          const courseProgress = state.progress[state.activeCourseId] || {};
          const prev = courseProgress[itemId] || { completed: false, duration: 0 };
          
          return {
            progress: {
              ...state.progress,
              [state.activeCourseId]: {
                ...courseProgress,
                [itemId]: {
                  ...prev,
                  currentTime: current,
                  duration: total > 0 ? total : prev.duration,
                  progress: total > 0 ? current / total : 0,
                  completed: prev.completed || (total > 0 && current / total > 0.95),
                },
              },
            },
          };
        }),
        
      markCompleted: (itemId) =>
        set((state) => {
          if (!state.activeCourseId) return state;
          
          const courseProgress = state.progress[state.activeCourseId] || {};
          const prev = courseProgress[itemId] || { currentTime: 0, duration: 0, progress: 1 };
          
          return {
            progress: {
              ...state.progress,
              [state.activeCourseId]: {
                ...courseProgress,
                [itemId]: {
                  ...prev,
                  completed: true,
                  progress: 1,
                },
              },
            },
          };
        }),

      updateDuration: (itemId, duration) => 
        set((state) => {
          if (!state.activeCourseId) return state;
          
          const courseProgress = state.progress[state.activeCourseId] || {};
          const prev = courseProgress[itemId] || { currentTime: 0, progress: 0, completed: false };
          
          return {
            progress: {
              ...state.progress,
              [state.activeCourseId]: {
                ...courseProgress,
                [itemId]: {
                  ...prev,
                  duration,
                  progress: duration > 0 ? prev.currentTime / duration : 0,
                },
              }
            }
          }
        }),

      addNote: (note) =>
        set((state) => {
          if (!state.activeCourseId) return state;
          const courseNotes = state.notes[state.activeCourseId] || [];
          return {
            notes: {
              ...state.notes,
              [state.activeCourseId]: [...courseNotes, note],
            },
          };
        }),

      removeNote: (noteId) =>
        set((state) => {
          if (!state.activeCourseId) return state;
          const courseNotes = state.notes[state.activeCourseId] || [];
          return {
            notes: {
              ...state.notes,
              [state.activeCourseId]: courseNotes.filter(n => n.id !== noteId),
            },
          };
        }),
    }),
    {
      name: 'course-player-storage-v2',
      partialize: (state) => ({ 
        progress: state.progress,
        notes: state.notes,
        lastOpenedItemIds: state.lastOpenedItemIds || {},
        playbackSpeed: state.playbackSpeed,
        sidebarWidth: state.sidebarWidth
      }),
    }
  )
);
