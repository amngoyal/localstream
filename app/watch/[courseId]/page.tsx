"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCourseStore } from '../../lib/courseStore';
import { parseDirectory, extractDurationsInBackground } from '../../lib/fileSystem';
import { getSavedCourses } from '../../lib/idb';
import Sidebar from '../../components/Sidebar';
import Player from '../../components/Player';
import Dashboard from '../../components/Dashboard';

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = decodeURIComponent(params.courseId as string);
  
  const { 
    activeCourseId,
    setActiveCourseId,
    setModules, 
    setIsLoading,
    setSelectedItemId
  } = useCourseStore();

  const [hasPermission, setHasPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeCourse = async () => {
      try {
        setIsInitializing(true);
        const courses = await getSavedCourses();
        const course = courses.find(c => c.id === courseId);
        
        if (!course || !course.handle) {
          setError("Course not found in your library.");
          setIsInitializing(false);
          return;
        }

        // Verify permission implicitly first
        // @ts-ignore
        const permStatus = await course.handle.queryPermission({ mode: 'read' });
        if (permStatus === 'granted') {
          await loadCourse(course.handle);
        } else {
          // Need to ask for permission via a user interaction
          setHasPermission(false);
          setIsInitializing(false);
        }
      } catch (e) {
        console.error(e);
        setError("An error occurred loading the course.");
        setIsInitializing(false);
      }
    };

    if (courseId) {
      initializeCourse();
    }
  }, [courseId]);

  const loadCourse = async (handle: any) => {
    try {
      setIsLoading(true);
      setActiveCourseId(courseId, handle);
      const modules = await parseDirectory(handle);
      setModules(modules);
      
      const state = useCourseStore.getState();
      if (!state.selectedItemId && modules.length > 0) {
        let itemToSelect: string | null = state.lastOpenedItemIds?.[courseId] || null;
        
        // Verify the item still exists in the modules, otherwise fallback to first
        if (!itemToSelect || !modules.some(m => m.items.some(i => i.id === itemToSelect))) {
            itemToSelect = modules[0].items.length > 0 ? modules[0].items[0].id : null;
        }

        if (itemToSelect) {
          setSelectedItemId(itemToSelect);
        }
      }
      
      setHasPermission(true);
      setIsInitializing(false);
      extractDurationsInBackground(modules);
    } catch (e) {
       setError("Failed to load course contents.");
       setIsInitializing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    try {
      const courses = await getSavedCourses();
      const course = courses.find(c => c.id === courseId);
      if (!course) return;

      // @ts-ignore
      const permission = await course.handle.requestPermission({ mode: 'read' });
      if (permission === 'granted') {
        await loadCourse(course.handle);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (error) {
    return (
      <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center font-sans">
         <div className="w-20 h-20 bg-red-900/30 rounded-2xl flex items-center justify-center mb-6 border border-red-800/50">
           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
         </div>
         <h1 className="text-2xl font-bold mb-4">{error}</h1>
         <p className="text-gray-400 max-w-md mx-auto mb-8">
           Since LocalStream runs 100% locally, your courses are saved in your browser's local storage. If you are in Incognito mode or a different browser, you'll need to go back and add the folder again.
         </p>
         <button onClick={() => router.push('/my-library')} className="px-6 py-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">Back to Library</button>
      </div>
    )
  }

  if (isInitializing) {
     return (
       <div className="h-screen w-screen bg-black flex flex-col items-center justify-center font-sans">
         <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
         <p className="text-gray-500 font-medium">Loading Course...</p>
       </div>
     )
  }

  if (!hasPermission) {
    return (
      <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center font-sans">
         <div className="w-20 h-20 bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 border border-blue-800/50">
           <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
         </div>
         <h1 className="text-3xl font-bold mb-4">Permission Required</h1>
         <p className="text-gray-400 mb-8 max-w-md">Your browser requires permission to access the local folder for this course. This is a security feature to protect your files.</p>
         <div className="flex items-center gap-4">
           <button onClick={() => router.push('/my-library')} className="px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors font-medium">Cancel</button>
           <button onClick={requestPermission} className="px-8 py-3 bg-blue-600 rounded-xl hover:bg-blue-500 font-semibold shadow-lg shadow-blue-600/20 transition-all">Grant Access</button>
         </div>
      </div>
    )
  }

  // Active course loaded
  return (
    <main className="h-screen w-screen flex flex-col bg-black overflow-hidden font-sans">
      <Dashboard />
      <div className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden">
        <Sidebar />
        <Player />
      </div>
    </main>
  );
}
