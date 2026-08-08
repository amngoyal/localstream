"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { PlaySquare, FolderOpen, Shield, Clock, Zap, ArrowRight, Code, Play } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans selection:bg-blue-500/30 text-gray-200 overflow-x-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <PlaySquare size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">LocalStream</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="https://github.com/amngoyal/localstream" target="_blank" rel="noopener noreferrer" className="hidden sm:flex text-gray-400 hover:text-white transition-colors items-center gap-2 text-sm font-medium">
            <Code size={18} />
            <span>Star on GitHub</span>
          </a>
          <button 
            onClick={() => router.push('/my-library')}
            className="px-5 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
          >
            Open App
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1]">
            Turn downloaded videos into a <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              premium streaming platform.
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          Stop struggling with scattered video files and unorganized folders. LocalStream transforms your raw local media into a gorgeous, Netflix-like streaming interface right in your browser. <strong>100% Free. No sign-ups.</strong>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button 
            onClick={() => router.push('/my-library')}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] hover:-translate-y-1"
          >
            <FolderOpen size={20} />
            Open My Library
            <ArrowRight size={18} className="ml-1 opacity-80" />
          </button>
        </motion.div>

        {/* Hero Mockup UI */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-24 relative max-w-5xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-2 sm:p-4 shadow-2xl backdrop-blur-sm overflow-hidden">
             <div className="aspect-[16/9] w-full rounded-xl bg-black border border-gray-800 flex items-center justify-center relative overflow-hidden">
                {/* Mock Player UI */}
                <div className="absolute inset-0 bg-gray-900 flex overflow-hidden rounded-xl">
                  {/* Sidebar */}
                  <div className="w-64 h-full bg-gray-900 border-r border-gray-700 hidden md:flex flex-col">
                     <div className="p-4 border-b border-gray-700 flex gap-2">
                       <div className="w-1/2 h-8 bg-blue-600/20 border border-blue-500/30 rounded flex items-center justify-center">
                         <div className="w-1/2 h-2 bg-blue-400 rounded-full"></div>
                       </div>
                       <div className="w-1/2 h-8 bg-gray-800 rounded flex items-center justify-center">
                         <div className="w-1/2 h-2 bg-gray-600 rounded-full"></div>
                       </div>
                     </div>
                     <div className="p-4 space-y-5 flex-1">
                       {[1,2,3,4].map((i) => (
                         <div key={i} className="space-y-2">
                           <div className="w-2/3 h-3 bg-gray-700 rounded-full"></div>
                           <div className={`w-full h-14 rounded-lg flex items-center px-3 gap-3 ${i === 1 ? 'bg-blue-600/10 border border-blue-500/30' : 'bg-gray-800'}`}>
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center ${i === 1 ? 'bg-blue-500/20' : 'bg-gray-700'}`}>
                               <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-blue-400' : 'bg-gray-500'}`}></div>
                             </div>
                             <div className="flex-1 space-y-2">
                               <div className={`w-3/4 h-2 rounded-full ${i === 1 ? 'bg-blue-300' : 'bg-gray-500'}`}></div>
                               <div className="w-1/2 h-1.5 bg-gray-600 rounded-full"></div>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                  </div>
                  
                  {/* Main Video Area */}
                  <div className="flex-1 h-full flex flex-col relative bg-black">
                     <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black pb-16">
                        <img src="/hero-video-bg.png" className="absolute inset-0 w-full h-full object-cover object-center opacity-80" alt="Video content" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
                        
                        {/* CSS Play Button Overlay */}
                        <div className="relative z-20 w-20 h-20 rounded-full border-2 border-cyan-400/50 bg-cyan-950/40 backdrop-blur-sm flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                           <Play className="w-8 h-8 text-cyan-300 ml-1" fill="currentColor" />
                        </div>
                     </div>

                     {/* Bottom Controls */}
                     <div className="h-16 bg-gray-900/90 backdrop-blur-md border-t border-gray-700/50 flex items-center px-6 gap-4 z-10 absolute bottom-0 inset-x-0">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <PlaySquare size={14} className="text-white" />
                        </div>
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden flex">
                          <div className="w-1/3 h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full relative">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"></div>
                          </div>
                        </div>
                        <div className="w-16 h-3 bg-gray-700 rounded-full"></div>
                     </div>
                  </div>
                </div>
             </div>
          </div>
        </motion.div>
      </main>

      {/* The Struggle Section */}
      <section className="relative z-10 py-12 bg-[#0a0a0a]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto px-6 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">The struggle with local media is real.</h2>
          <p className="text-xl text-gray-400 leading-relaxed mb-12">
            You download a course or web series, only to find yourself fighting with basic media players. You forget which episode you were on. You lose your spot in a 2-hour tutorial. Your folders are a mess of poorly named video files.
          </p>
          <div className="inline-block bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-6 py-3 rounded-full font-medium text-lg shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            LocalStream gives you a Netflix-like interface for your local files.
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-16 bg-gray-950 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything you need to learn offline</h2>
            <p className="text-gray-400">Powered by modern web technologies, entirely in your browser.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield size={24} className="text-green-400" />}
              title="100% Local & Private"
              description="Your files never leave your computer. We use the File System Access API to stream videos directly from your local folders."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Clock size={24} className="text-blue-400" />}
              title="Persistent Tracking"
              description="Automatically tracks your watch progress across sessions. Never lose your spot in a 2-hour tutorial again."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Zap size={24} className="text-yellow-400" />}
              title="Portable Metadata"
              description="Layout changes, notes, and module names are saved right inside your folder. Move the folder to another PC, and your structure goes with it."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative z-10 py-16 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-gray-400">Zero setup. No accounts. Pure magic.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <motion.div 
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-900 via-indigo-500 to-blue-900 z-0 origin-left"
            ></motion.div>

            <StepCard 
              number="1"
              title="Select a Folder"
              description="Point LocalStream to any local folder on your computer that contains video files."
              delay={0.1}
            />
            <StepCard 
              number="2"
              title="Grant Access"
              description="Your browser securely reads the files locally without uploading a single byte to the internet."
              delay={0.3}
            />
            <StepCard 
              number="3"
              title="Start Watching"
              description="Enjoy a premium streaming interface with automatic progress tracking and custom layouts."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-900 bg-[#0a0a0a] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PlaySquare size={20} className="text-gray-500" />
            <span className="text-gray-500 font-medium">LocalStream</span>
          </div>
          <p className="text-gray-600 text-sm">Made by a developer, for developers. 100% Free and Open Source.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay = 0 }: { icon: React.ReactNode, title: string, description: string, delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl hover:bg-gray-900 transition-colors"
    >
      <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function StepCard({ number, title, description, delay = 0 }: { number: string, title: string, description: string, delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="relative z-10 flex flex-col items-center text-center bg-[#0a0a0a] px-4 py-6"
    >
      <div className="w-20 h-20 bg-gray-900 border-2 border-gray-800 rounded-full flex items-center justify-center text-2xl font-bold text-blue-400 mb-6 shadow-xl relative z-10">
        {number}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}
