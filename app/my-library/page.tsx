"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCourseStore } from '../lib/courseStore';
import { parseDirectory } from '../lib/fileSystem';
import { getSavedCourses, saveCourse, removeCourse } from '../lib/idb';
import { Course } from '../lib/types';
import { FolderOpen, PlaySquare, Trash2, BookOpen, Clock, Play, Shield } from 'lucide-react';
import { formatTime } from '../lib/utils';

export default function MyLibrary() {
  const router = useRouter();
  const { 
    isLoading, 
    setIsLoading,
    progress
  } = useCourseStore();

  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  // Load saved courses on mount
  useEffect(() => {
    getSavedCourses().then(courses => {
      setSavedCourses(courses);
      setDbLoading(false);
    });
  }, []);

  const handleAddCourse = async () => {
    try {
      setIsLoading(true);
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();
      
      alert("To allow you to fully customize your layout, LocalStream needs permission to save a small configuration file inside your folder. Please click 'Save Changes' or 'Allow' on the next prompt.");
      
      // Request readwrite for the new course
      // @ts-ignore
      if (await dirHandle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
        // @ts-ignore
        const permission = await dirHandle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          throw new Error("Permission denied. We cannot manage your course layout.");
        }
      }

      const newCourse: Course = {
        id: dirHandle.name + '-' + Date.now().toString(), // Simple unique ID
        name: dirHandle.name,
        handle: dirHandle,
        addedAt: Date.now()
      };
      
      await saveCourse(newCourse);
      
      // We also auto-generate and save the JSON right now
      await parseDirectory(dirHandle, true);
      
      setSavedCourses(await getSavedCourses());
      setIsLoading(false);
    } catch (err) {
      console.error("Error selecting folder", err);
      setIsLoading(false);
    }
  };

  const handleOpenCourse = (course: Course) => {
    router.push(`/watch/${course.id}`);
  };

  const handleDeleteCourse = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation(); // prevent opening the course
    if (confirm("Are you sure you want to remove this course? Your progress will be kept in storage, but the link will be removed.")) {
      await removeCourse(courseId);
      setSavedCourses(await getSavedCourses());
    }
  };

  const getGradient = (id: string) => {
    const gradients = [
      "from-blue-600 to-indigo-900",
      "from-emerald-500 to-teal-900",
      "from-rose-500 to-pink-900",
      "from-amber-500 to-orange-900",
      "from-purple-500 to-fuchsia-900",
      "from-cyan-500 to-blue-900"
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
    return gradients[hash % gradients.length];
  };

  return (
    <main className="min-h-screen bg-[#050505] font-sans relative overflow-x-hidden text-white">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"></div>
      
      <div className="max-w-7xl mx-auto px-6 sm:px-10 h-full relative z-10 flex flex-col">
        
        {/* Sleek Navigation Bar */}
        <header className="flex items-center justify-between py-6 mb-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)] group-hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all">
              <PlaySquare size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              LocalStream
            </h1>
          </Link>
          
          <button
            onClick={handleAddCourse}
            disabled={isLoading}
            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md font-medium py-2 px-5 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 border border-white/10 hover:border-white/20"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FolderOpen size={16} />}
            <span className="hidden sm:inline">Add Local Folder</span>
            <span className="sm:hidden">Add</span>
          </button>
        </header>

        {/* Global Privacy Banner */}
        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-cyan-400/90 bg-cyan-900/20 py-3 px-4 rounded-xl border border-cyan-500/20 shadow-lg shadow-cyan-900/10">
          <Shield size={18} className="text-cyan-400" />
          <span><strong>100% Local & Private.</strong> Your files never leave your device and are never uploaded to the internet.</span>
        </div>

        {dbLoading ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : savedCourses.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-900/20 backdrop-blur-3xl rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden my-8 min-h-[500px]">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl flex items-center justify-center mb-6 border border-gray-700/50 shadow-inner">
              <BookOpen size={40} className="text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Your library is empty</h2>
            <p className="text-gray-400 max-w-md mb-8 text-lg">
              Select a local folder containing your video courses or web series to start watching immediately.
            </p>
            <button
              onClick={handleAddCourse}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3.5 px-8 rounded-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(34,211,238,0.3)]"
            >
              <FolderOpen size={20} />
              Browse Folders
            </button>
          </div>
        ) : (
          <div className="flex-1 pb-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Your Library</h2>
              <span className="bg-white/10 px-3 py-1 rounded-full text-sm font-medium text-gray-300">
                {savedCourses.length} {savedCourses.length === 1 ? 'Course' : 'Courses'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedCourses.map(course => {
                const courseProgress = progress[course.id] || {};
                let watched = 0;
                let total = 0;
                Object.values(courseProgress).forEach(p => {
                  if (p.duration > 0) {
                    watched += (p.currentTime || 0);
                    total += p.duration;
                  }
                });
                const percent = total > 0 ? (watched / total) * 100 : 0;

                return (
                  <div 
                    key={course.id}
                    onClick={() => handleOpenCourse(course)}
                    className="bg-[#0f0f11] border border-white/5 rounded-2xl cursor-pointer hover:border-white/20 transition-all group flex flex-col overflow-hidden relative shadow-xl hover:shadow-2xl hover:-translate-y-1.5"
                  >
                    {/* Vibrant Cover Art generated from ID */}
                    <div className={`h-40 bg-gradient-to-br ${getGradient(course.id)} relative p-6 flex flex-col justify-between overflow-hidden border-b border-black/20`}>
                      {/* Decorative elements */}
                      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/30 rounded-full blur-xl"></div>
                      
                      <div className="flex justify-between items-start relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white shadow-lg border border-white/20 transition-transform group-hover:scale-110">
                          <Play size={20} className="ml-1" />
                        </div>
                        
                        <button 
                          onClick={(e) => handleDeleteCourse(e, course.id)}
                          className="text-white/70 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md"
                          title="Remove from Library"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-lg font-semibold mb-2 line-clamp-2 leading-snug group-hover:text-cyan-400 transition-colors">{course.name}</h3>
                      
                      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2 font-medium mt-auto pt-2">
                        <Clock size={14} className="text-gray-600" />
                        {total > 0 ? `${formatTime(watched)} / ${formatTime(total)}` : "Not started yet"}
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <div className="flex justify-between text-xs mb-2 font-semibold">
                          <span className="text-gray-500 uppercase tracking-wider">Progress</span>
                          <span className={percent > 0 ? "text-cyan-400" : "text-gray-600"}>{percent.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
