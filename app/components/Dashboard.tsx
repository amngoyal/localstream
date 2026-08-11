"use client";

import React, { useState } from 'react';
import { useCourseStore } from '../lib/courseStore';
import { formatTime } from '../lib/utils';
import { Clock, Play, CheckCircle, ArrowLeft, Edit2 } from 'lucide-react';
import CourseEditor from './CourseEditor';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const { modules, progress, activeCourseId, setActiveCourseId } = useCourseStore();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  let totalDuration = 0;
  let watchedDuration = 0;
  let totalItems = 0;
  let completedItems = 0;

  // Calculate totals based on store state
  modules.forEach(mod => {
    mod.items.forEach(item => {
      if (item.type === 'pdf') return;
      totalItems++;
      const itemProgress = progress[activeCourseId || '']?.[item.id];
      
      if (itemProgress) {
        if (itemProgress.duration > 0) {
          totalDuration += itemProgress.duration;
          watchedDuration += itemProgress.currentTime || 0;
        }
        if (itemProgress.completed) {
          completedItems++;
        }
      }
    });
  });

  const progressPercent = totalDuration > 0 ? (watchedDuration / totalDuration) * 100 : 0;
  const timeRemaining = Math.max(0, totalDuration - watchedDuration);

  return (
    <div className="bg-gray-900 border-b border-gray-800 p-3 sm:p-4 px-3 sm:px-6 flex items-center justify-between text-white shrink-0 gap-2 overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        <button 
          onClick={() => {
            setActiveCourseId(null, null); // clear store
            router.push('/my-library');
          }}
          className="text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors pr-2 border-r border-gray-800/50"
          title="Back to Library"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              LocalStream
            </h1>
            <button 
              onClick={() => setIsEditorOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-md text-xs font-medium transition-colors border border-gray-700"
            >
              <Edit2 size={12} /> <span className="hidden sm:inline">Edit Layout</span>
            </button>
          </div>
          <p className="hidden sm:block text-xs text-gray-500 font-medium tracking-wide uppercase mt-0.5">Local Environment</p>
        </div>
        
        <div className="h-8 w-px bg-gray-800 mx-2 hidden sm:block"></div>
        
        <div className="hidden sm:flex gap-6">
          <StatCard 
            icon={<Clock size={16} className="text-blue-400" />}
            label="Watched"
            value={formatTime(watchedDuration)}
          />
          <StatCard 
            icon={<Play size={16} className="text-purple-400" />}
            label="Remaining"
            value={formatTime(timeRemaining)}
          />
          <StatCard 
            icon={<CheckCircle size={16} className="text-green-400" />}
            label="Completed"
            value={`${completedItems} / ${totalItems}`}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 w-32 sm:w-64 shrink-0">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400 font-medium">Overall Progress</span>
            <span className="text-white font-bold">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
      <CourseEditor isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-0.5">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-sm font-semibold text-white">
        {value}
      </div>
    </div>
  );
}
