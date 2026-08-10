"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useCourseStore } from '../lib/courseStore';
import { FileText, Loader2, Settings, MessageSquarePlus, MonitorPlay, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Minimize, ArrowLeft, RotateCcw, RotateCw, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { CourseItem } from '../lib/types';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  
  // Custom PDF State
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [isUpNextDismissed, setIsUpNextDismissed] = useState(false);

  // Find selected item
  let selectedItem: CourseItem | null = null;
  let currentModuleIndex = -1;
  let currentItemIndex = -1;
  
  for (let mIndex = 0; mIndex < modules.length; mIndex++) {
    const mod = modules[mIndex];
    for (let iIndex = 0; iIndex < mod.items.length; iIndex++) {
      if (mod.items[iIndex].id === selectedItemId) {
        selectedItem = mod.items[iIndex];
        currentModuleIndex = mIndex;
        currentItemIndex = iIndex;
        break;
      }
    }
    if (selectedItem) break;
  }

  const getRelativeItem = (direction: 1 | -1, skipPdf: boolean = false): { id: string, name: string } | null => {
    if (currentModuleIndex === -1 || currentItemIndex === -1) return null;
    
    let mIdx = currentModuleIndex;
    let iIdx = currentItemIndex + direction;
    
    while (mIdx >= 0 && mIdx < modules.length) {
      if (direction === 1) {
        while (iIdx < modules[mIdx].items.length) {
          const item = modules[mIdx].items[iIdx];
          if (!skipPdf || item.type === 'video') return { id: item.id, name: item.name };
          iIdx++;
        }
        mIdx++;
        iIdx = 0;
      } else {
        while (iIdx >= 0) {
          const item = modules[mIdx].items[iIdx];
          if (!skipPdf || item.type === 'video') return { id: item.id, name: item.name };
          iIdx--;
        }
        mIdx--;
        if (mIdx >= 0) {
          iIdx = modules[mIdx].items.length - 1;
        }
      }
    }
    return null;
  };

  const nextItem = getRelativeItem(1, false);
  const prevItem = getRelativeItem(-1, false);
  const nextVideo = getRelativeItem(1, true);

  useEffect(() => {
    setIsUpNextDismissed(false);
    setNumPages(null);
    setPageNumber(1);
    setPdfScale(1.0);
    if (!selectedItem) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setObjectUrl(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const loadFile = async () => {
      try {
        const file = await selectedItem!.handle.getFile();
        const url = URL.createObjectURL(file);
        if (isMounted) {
          setObjectUrl(url);
          setIsLoading(false);
          if (selectedItem!.type === 'pdf') {
            markCompleted(selectedItem!.id);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem, markCompleted]); 

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
      if (nextVideo) {
        setTimeout(() => setSelectedItemId(nextVideo.id), 3000);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [selectedItem, objectUrl, updateProgress, playbackSpeed, nextVideo, setSelectedItemId]);

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
    
    const handleCustomSeek = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.time === 'number') {
        video.currentTime = customEvent.detail.time;
        video.play().catch(() => {});
      }
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    window.addEventListener('seek-to', handleCustomSeek);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      window.removeEventListener('seek-to', handleCustomSeek);
    };
  }, [selectedItem, objectUrl]);

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

  // Listen for fullscreenchange to handle ESC key exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
    } catch {}
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

  if (selectedItem.type === 'pdf') {
    return (
      <div 
        ref={containerRef}
        className="w-full h-full flex-1 shrink-0 flex flex-col bg-gray-950 relative"
      >
        <div className="p-3 bg-gray-900 flex justify-between items-center shadow-md z-10 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {isFullscreen && (
              <button 
                onClick={toggleFullscreen} 
                className="text-white hover:text-cyan-400 transition-colors p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg"
                title="Exit Fullscreen"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-white text-base sm:text-lg font-medium truncate max-w-[200px] sm:max-w-2xl">
              {selectedItem.name.replace(/^(\d+\.\d+\s*-?\s*)/, '').replace(/\.(mp4|pdf)$/i, '')}
            </h2>
          </div>
          
          {/* New PDF Controls */}
          {numPages && (
            <div className="flex items-center gap-2 bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-800 hidden sm:flex">
              <span className="text-gray-300 text-sm font-medium pr-2 border-r border-gray-800 tabular-nums">
                {numPages} {numPages === 1 ? 'Page' : 'Pages'}
              </span>
              <button 
                onClick={() => setPdfScale(Math.max(0.5, pdfScale - 0.25))}
                className="text-gray-400 hover:text-cyan-400 transition-colors ml-1"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-gray-300 text-sm font-medium w-12 text-center tabular-nums">
                {Math.round(pdfScale * 100)}%
              </span>
              <button 
                onClick={() => setPdfScale(Math.min(3.0, pdfScale + 0.25))}
                className="text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button 
              onClick={() => prevItem && setSelectedItemId(prevItem.id)}
              disabled={!prevItem}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-sm font-medium ${prevItem ? 'border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-cyan-400' : 'border-transparent text-gray-600 opacity-50 cursor-not-allowed'}`}
            >
              <SkipBack size={16} /> <span className="hidden sm:inline">Prev</span>
            </button>
            <button 
              onClick={() => nextItem && setSelectedItemId(nextItem.id)}
              disabled={!nextItem}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-sm font-medium ${nextItem ? 'border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-cyan-400' : 'border-transparent text-gray-600 opacity-50 cursor-not-allowed'}`}
            >
              <span className="hidden sm:inline">Next</span> <SkipForward size={16} />
            </button>
            <div className="w-px h-5 bg-gray-700 mx-1"></div>
            <button onClick={toggleFullscreen} className="text-gray-400 hover:text-cyan-400 transition-colors p-1.5 hover:bg-gray-800 rounded-lg">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>

        <div className="flex-1 w-full relative bg-gray-950/50 overflow-auto py-8">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
              <Loader2 className="animate-spin text-cyan-500" size={48} />
            </div>
          )}
          {objectUrl && (
            <Document
              file={objectUrl}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                setIsLoading(false);
              }}
              loading={
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-cyan-500" size={48} />
                </div>
              }
              className="flex flex-col items-center pb-8"
            >
              {Array.from(new Array(numPages || 0), (el, index) => (
                <div key={`page_${index + 1}`} className="mb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden">
                  <Page 
                    pageNumber={index + 1} 
                    scale={pdfScale}
                    className="bg-white"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </div>
              ))}
            </Document>
          )}
        </div>
      </div>
    );
  }

  const showUpNextPopup = !isUpNextDismissed && selectedItem.type === 'video' && duration > 0 && duration - currentTime <= 60 && nextVideo;

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex-1 shrink-0 flex flex-col bg-black relative group overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <div className="flex-1 flex items-center justify-center bg-black relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
            <Loader2 className="animate-spin text-cyan-500" size={48} />
          </div>
        )}

        {objectUrl && (
          <video
            ref={videoRef}
            src={objectUrl}
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
      </div>

      {/* Up Next Popup */}
      {showUpNextPopup && (
        <div className="absolute bottom-24 right-6 z-40 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4 shadow-2xl flex flex-col gap-2 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
          <button 
            onClick={() => setIsUpNextDismissed(true)}
            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Up Next</p>
          <p className="text-white font-medium line-clamp-1" title={nextVideo.name}>{nextVideo.name}</p>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => setSelectedItemId(nextVideo.id)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors flex-1 shadow-[0_0_15px_rgba(8,145,178,0.4)]"
            >
              Play Now
            </button>
          </div>
        </div>
      )}

      {/* Custom Controls Overlay for Video */}
      <div className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-500 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'} pointer-events-none z-10`}>
        
        {/* Top Header Gradient */}
        <div className="p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto flex justify-between items-start">
          <div className="flex items-center gap-3">
            {isFullscreen && (
              <button 
                onClick={toggleFullscreen} 
                className="text-white hover:text-cyan-400 transition-colors p-2 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md border border-white/10"
                title="Exit Fullscreen"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-white text-lg sm:text-2xl font-medium drop-shadow-md truncate max-w-[200px] sm:max-w-2xl">
              {selectedItem.name.replace(/^(\d+\.\d+\s*-?\s*)/, '').replace(/\.(mp4|pdf)$/i, '')}
            </h2>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleStartNote}
              className="bg-black/40 hover:bg-cyan-600/80 text-white backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 border border-white/10 transition-colors shadow-lg"
            >
              <MessageSquarePlus size={16} /> <span className="hidden sm:inline">Add Note</span>
            </button>
          </div>
        </div>

        {/* Center Controls (Play/Pause, 10s Rewind, 10s Forward) */}
        <div className={`flex items-center justify-center gap-6 sm:gap-12 md:gap-16 flex-1 pointer-events-none transition-all duration-300 ${showControls || !isPlaying ? 'scale-100 opacity-100' : 'scale-110 opacity-0'}`}>
          
          <button 
            onClick={(e) => { e.stopPropagation(); skipBackward(); }}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:scale-110 transition-all pointer-events-auto group relative"
            title="Rewind 10s"
          >
            <RotateCcw className="text-white group-hover:text-cyan-400 w-5 h-5 sm:w-6 sm:h-6" />
            <span className="absolute text-[8px] sm:text-[9px] font-bold text-white group-hover:text-cyan-400 mt-1">10</span>
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-cyan-500/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.3)] hover:scale-110 hover:bg-cyan-500/30 transition-all pointer-events-auto group"
          >
            {isPlaying ? (
              <Pause className="text-cyan-50 group-hover:text-white transition-colors w-8 h-8 sm:w-10 sm:h-10" />
            ) : (
              <Play className="text-cyan-50 translate-x-1 group-hover:text-white transition-colors w-8 h-8 sm:w-10 sm:h-10" />
            )}
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); skipForward(); }}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:scale-110 transition-all pointer-events-auto group relative"
            title="Forward 10s"
          >
            <RotateCw className="text-white group-hover:text-cyan-400 w-5 h-5 sm:w-6 sm:h-6" />
            <span className="absolute text-[8px] sm:text-[9px] font-bold text-white group-hover:text-cyan-400 mt-1">10</span>
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
              {/* Bottom bar prev/next item */}
              <button 
                onClick={() => prevItem && setSelectedItemId(prevItem.id)}
                disabled={!prevItem}
                className={`transition-colors flex items-center justify-center ${prevItem ? 'hover:text-cyan-400 opacity-80 hover:opacity-100' : 'opacity-40 cursor-not-allowed'}`}
                title="Previous Item"
              >
                <SkipBack size={20} />
              </button>
              <button 
                onClick={() => nextItem && setSelectedItemId(nextItem.id)}
                disabled={!nextItem}
                className={`transition-colors flex items-center justify-center ${nextItem ? 'hover:text-cyan-400 opacity-80 hover:opacity-100' : 'opacity-40 cursor-not-allowed'}`}
                title="Next Item"
              >
                <SkipForward size={20} />
              </button>
              
              <div className="hidden sm:flex items-center gap-2 group/volume relative ml-2">
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

      {/* Note Input Modal */}
      {showNoteInput && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 z-50">
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
