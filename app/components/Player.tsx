"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useCourseStore } from '../lib/courseStore';
import { FileText, Loader2, Settings, MessageSquarePlus, MonitorPlay, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw } from 'lucide-react';

export default function Player() {
  const { modules, selectedItemId, setSelectedItemId, updateProgress, markCompleted, playbackSpeed, setPlaybackSpeed, addNote } = useCourseStore();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteTimestamp, setNoteTimestamp] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Custom Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Find selected item
  let selectedItem = null;
  let nextItemId = null;
  
  for (let mIndex = 0; mIndex < modules.length; mIndex++) {
    const mod = modules[mIndex];
    for (let iIndex = 0; iIndex < mod.items.length; iIndex++) {
      if (mod.items[iIndex].id === selectedItemId) {
        selectedItem = mod.items[iIndex];
        if (iIndex + 1 < mod.items.length) {
          nextItemId = mod.items[iIndex + 1].id;
        } else if (mIndex + 1 < modules.length && modules[mIndex + 1].items.length > 0) {
          nextItemId = modules[mIndex + 1].items[0].id;
        }
        break;
      }
    }
    if (selectedItem) break;
  }

  useEffect(() => {
    if (!selectedItem) {
      setObjectUrl(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const loadFile = async () => {
      try {
        // @ts-ignore
        const file = await selectedItem.handle.getFile();
        const url = URL.createObjectURL(file);
        if (isMounted) {
          setObjectUrl(url);
          setIsLoading(false);
          if (selectedItem.type === 'pdf') {
            markCompleted(selectedItem.id);
          }
        }
      } catch (err) {
        console.error("Failed to load file", err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadFile();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedItem?.id]); 

  // Handle video tracking, speed, and events
  useEffect(() => {
    if (!selectedItem || selectedItem.type !== 'video' || !videoRef.current) return;
    
    const video = videoRef.current;
    video.playbackRate = playbackSpeed;
    
    const handleTimeUpdate = () => {
      if (video.duration && !isNaN(video.duration)) {
        updateProgress(selectedItem.id, video.currentTime, video.duration);
      }
    };

    const handleEnded = () => {
      if (nextItemId) {
        setTimeout(() => setSelectedItemId(nextItemId), 3000);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [selectedItem?.id, objectUrl, updateProgress, playbackSpeed, nextItemId, setSelectedItemId]);

  // Restore playback position and handle seek event
  useEffect(() => {
    if (!selectedItem || selectedItem.type !== 'video' || !videoRef.current) return;
    
    const video = videoRef.current;
    
    const handleLoadedMetadata = () => {
      const store = useCourseStore.getState();
      const progress = store.progress[store.activeCourseId || '']?.[selectedItem.id];
      if (progress && progress.currentTime > 0 && progress.currentTime < video.duration - 2) {
        video.currentTime = progress.currentTime;
      }
    };
    
    const handleCustomSeek = (e: any) => {
      if (e.detail && typeof e.detail.time === 'number') {
        video.currentTime = e.detail.time;
        video.play().catch(() => {});
      }
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    window.addEventListener('seek-to', handleCustomSeek);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      window.removeEventListener('seek-to', handleCustomSeek);
    };
  }, [selectedItem?.id, objectUrl]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const video = videoRef.current;
      
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (video.paused) video.play();
          else video.pause();
          break;
        case 'arrowright':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case 'arrowleft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case '>':
        case '.':
          if (e.shiftKey) {
            e.preventDefault();
            setPlaybackSpeed(Math.min(2.5, playbackSpeed + 0.25));
          }
          break;
        case '<':
        case ',':
          if (e.shiftKey) {
            e.preventDefault();
            setPlaybackSpeed(Math.max(0.25, playbackSpeed - 0.25));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackSpeed, setPlaybackSpeed]);

  const handleTogglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {}
  };

  const handleStartNote = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setNoteTimestamp(videoRef.current.currentTime);
    setShowNoteInput(true);
    setNoteText('');
  };

  const handleSaveNote = () => {
    if (!noteText.trim() || !selectedItem) return;
    addNote({
      id: Date.now().toString(),
      videoId: selectedItem.id,
      text: noteText.trim(),
      timestamp: noteTimestamp,
      createdAt: Date.now()
    });
    setShowNoteInput(false);
    videoRef.current?.play();
  };

  // Custom Controls Functions
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const vol = parseFloat(e.target.value);
    videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const skipForward = () => {
    if (videoRef.current) videoRef.current.currentTime += 10;
  };

  const skipBackward = () => {
    if (videoRef.current) videoRef.current.currentTime -= 10;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!selectedItem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black/95 text-gray-500">
        <div className="w-24 h-24 mb-6 rounded-full bg-gray-900 flex items-center justify-center border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <FileText size={32} className="text-gray-600" />
        </div>
        <h2 className="text-xl font-medium text-gray-400">Select an item from the sidebar</h2>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex flex-col bg-black h-full relative group overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <div className="flex-1 flex items-center justify-center bg-black relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <Loader2 className="animate-spin text-cyan-500" size={48} />
          </div>
        )}

        {objectUrl && selectedItem.type === 'video' && (
          <video
            ref={videoRef}
            src={objectUrl}
            autoPlay
            controls={false}
            className="w-full h-full object-contain cursor-pointer"
            controlsList="nodownload"
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onVolumeChange={() => {
              setVolume(videoRef.current?.volume || 1);
              setIsMuted(videoRef.current?.muted || false);
            }}
          />
        )}

        {objectUrl && selectedItem.type === 'pdf' && (
          <iframe
            src={objectUrl}
            className="w-full h-full bg-white"
            title={selectedItem.name}
          />
        )}
      </div>

      {/* Custom Controls Overlay for Video */}
      {selectedItem.type === 'video' && (
        <div className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-500 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'} pointer-events-none`}>
          
          {/* Top Header Gradient */}
          <div className="p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto flex justify-between items-start">
            <h2 className="text-white text-2xl font-medium drop-shadow-md truncate max-w-2xl">
              {selectedItem.name.replace(/^(\d+\.\d+\s*-?\s*)/, '').replace(/\.(mp4|pdf)$/i, '')}
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={handleStartNote}
                className="bg-black/40 hover:bg-cyan-600/80 text-white backdrop-blur-md px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-white/10 transition-colors shadow-lg"
              >
                <MessageSquarePlus size={16} /> Add Note
              </button>
            </div>
          </div>

          {/* Center Controls (Play/Pause, Rewind, Forward) */}
          <div className={`flex items-center justify-center gap-8 md:gap-16 flex-1 pointer-events-none transition-all duration-300 ${showControls || !isPlaying ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}>
            
            <button 
              onClick={(e) => { e.stopPropagation(); skipBackward(); }}
              className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:scale-110 transition-all pointer-events-auto group relative"
              title="Rewind 10s"
            >
              <RotateCcw size={28} className="text-white group-hover:text-cyan-400" />
              <span className="absolute text-[10px] font-bold text-white group-hover:text-cyan-400 mt-1">10</span>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-24 h-24 bg-cyan-500/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:scale-110 hover:bg-cyan-500/30 transition-all pointer-events-auto group"
            >
              {isPlaying ? (
                <Pause size={40} className="text-cyan-50 group-hover:text-white transition-colors" />
              ) : (
                <Play size={40} className="text-cyan-50 translate-x-1 group-hover:text-white transition-colors" />
              )}
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); skipForward(); }}
              className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:scale-110 transition-all pointer-events-auto group relative"
              title="Forward 10s"
            >
              <RotateCw size={28} className="text-white group-hover:text-cyan-400" />
              <span className="absolute text-[10px] font-bold text-white group-hover:text-cyan-400 mt-1">10</span>
            </button>

          </div>

          {/* Bottom Control Bar */}
          <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-4 px-6 pointer-events-auto">
            {/* Scrubber */}
            <div className="group flex items-center cursor-pointer relative h-6 w-full mb-2">
              <input 
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
              <div className="w-full h-1.5 bg-gray-600/50 rounded-full overflow-visible relative group-hover:h-2 transition-all">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full shadow border-2 border-cyan-400 scale-0 group-hover:scale-100 transition-transform"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 text-gray-200">
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="hover:text-cyan-400 transition-colors">
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button onClick={skipBackward} className="hover:text-cyan-400 transition-colors opacity-80 hover:opacity-100">
                  <SkipBack size={20} />
                </button>
                <button onClick={skipForward} className="hover:text-cyan-400 transition-colors opacity-80 hover:opacity-100">
                  <SkipForward size={20} />
                </button>
                
                <div className="flex items-center gap-2 group/volume relative ml-2">
                  <button onClick={toggleMute} className="hover:text-cyan-400 transition-colors">
                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 flex items-center">
                    <input 
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 ml-2 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                  <span className="text-xs font-medium w-9 tabular-nums text-gray-400 hidden group-hover/volume:block">
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-sm font-medium tabular-nums text-gray-300 mr-2">
                  {formatTime(currentTime)} <span className="text-gray-500 mx-1">/</span> {formatTime(duration)}
                </div>

                <div className="relative group/speed">
                  <button className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 opacity-80 hover:opacity-100 text-sm font-medium">
                    <Settings size={18} />
                    {playbackSpeed}x
                  </button>
                  <div className="absolute bottom-full right-0 mb-4 bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-lg p-1 opacity-0 invisible group-hover/speed:opacity-100 group-hover/speed:visible transition-all flex flex-col gap-1 w-24 z-30">
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speed => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-3 py-1.5 rounded-md text-sm text-left transition-colors ${playbackSpeed === speed ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-300 hover:bg-gray-800'}`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleTogglePiP} className="hover:text-cyan-400 transition-colors opacity-80 hover:opacity-100" title="Picture-in-Picture">
                  <MonitorPlay size={18} />
                </button>
                
                <button onClick={toggleFullscreen} className="hover:text-cyan-400 transition-colors opacity-80 hover:opacity-100">
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Input Modal */}
      {showNoteInput && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 shadow-2xl transform transition-all">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center justify-between">
              Add Note 
              <span className="text-sm font-normal text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                at {formatTime(noteTimestamp)}
              </span>
            </h3>
            <textarea
              autoFocus
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Type your note here..."
              className="w-full h-32 bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 resize-none mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveNote();
                }
              }}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowNoteInput(false);
                  videoRef.current?.play();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNote}
                className="px-4 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
