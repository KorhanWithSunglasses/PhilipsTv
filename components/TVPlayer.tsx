'use client';

import { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

import type Player from 'video.js/dist/types/player';

interface TVPlayerProps {
  src: string;
  isLive?: boolean;
  minimal?: boolean;
  channelName?: string;
  title?: string;
  category?: string;
  startTime?: string | null; // ISO Date String
}

export default function TVPlayer({ 
    src, 
    isLive = true, 
    minimal = false,
    channelName = 'Yükleniyor...',
    title = '',
    category = 'Just Chatting',
    startTime = null
}: TVPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [qualities, setQualities] = useState<{ id: string; height: number; bitrate: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [showSettings, setShowSettings] = useState(false);

  // Time State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isBehindLive, setIsBehindLive] = useState(false); // Yeni state: Canlıdan geride miyiz?
  const [liveLatency, setLiveLatency] = useState(0); // Canlıdan ne kadar gerideyiz (saniye)

  const [bufferDuration, setBufferDuration] = useState(0); // Toplam geriye sarılabilir süre
  const [elapsedStreamTime, setElapsedStreamTime] = useState(0); // Yayının toplam geçen süresi

  // Debug State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Initialize Player
  useEffect(() => {
    if (!videoRef.current) return;
    if (!src) return; // Kaynak yoksa başlatma

    if (playerRef.current) {
        const player = playerRef.current;
        if (player.currentSrc() !== src) {
            player.src({ src, type: 'application/x-mpegURL' });
            // Reset error asynchronously to avoid lint error
            setTimeout(() => setErrorMsg(null), 0);
        }
        return;
    }

    const videoElement = document.createElement("video-js");
    videoElement.classList.add('vjs-big-play-centered');
    videoElement.style.width = '100%';
    videoElement.style.height = '100%';
    videoRef.current.appendChild(videoElement);

    const player = playerRef.current = videojs(videoElement, {
      autoplay: true,
      controls: false,
      responsive: true,
      fluid: false,
      html5: {
        vhs: {
            overrideNative: true
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false
      },
      sources: [{
        src: src,
        type: 'application/x-mpegURL'
      }]
    }, () => {
      // Production Error Handling
      player.on('error', () => {
        const err = player.error();
        console.error('VideoJS Error:', err);
        // Translate common errors
        let msg = `Hata Kodu: ${err?.code}`;
        if (err?.code === 4) msg = 'Yayın kaynağı desteklenmiyor veya şu an erişilemiyor (Media Error 4).';
        if (err?.code === 3) msg = 'Yayın çözme hatası (Decode Error).';
        if (err?.code === 2) msg = 'Ağ bağlantısı hatası (Network Error).';
        
        setErrorMsg(`${msg} (${err?.message})`);
      });
      
      player.on('play', () => setPaused(false));
      player.on('pause', () => setPaused(true));
      player.on('timeupdate', () => {
          const curr = player.currentTime() || 0;
          const dur = player.duration(); // number | undefined
          const seekable = player.seekable();
          
          setCurrentTime(curr);
          setDuration(dur || 0);

          // Build Progress % & DVR Logic
          if (dur !== undefined && isFinite(dur) && dur > 0) {
              // VOD Logic
              setCurrentProgress((curr / dur) * 100);
              setIsBehindLive(false);
          } else if (seekable.length > 0) {
              // Live Stream Logic
              const start = seekable.start(0);
              const end = seekable.end(0);
              const latency = end - curr;
              setLiveLatency(latency);
              setBufferDuration(end - start);

              // Eğer 10 saniyeden fazla gerideysek "Canlıya Git" butonunu göster
              const behind = latency > 10;
              setIsBehindLive(behind);

              if (end > start) {
                  // Eğer canlıya çok yakınsak (%99+) %100'e sabitle (Jitter önleme)
                  const rawPct = ((curr - start) / (end - start)) * 100;
                  if (rawPct > 99.5) {
                      setCurrentProgress(100);
                  } else {
                      setCurrentProgress(Math.min(100, Math.max(0, rawPct)));
                  }
              } else {
                  setCurrentProgress(100);
              }
          } else {
              setCurrentProgress(0);
              setBufferDuration(0);
          }
      });
      player.on('volumechange', () => {
          setVolume(player.volume() || 1);
          setMuted(player.muted() ?? false);
      });
      player.on('fullscreenchange', () => {
          setFullscreen(player.isFullscreen() ?? false);
      });
      
      // Attempt to load qualities after metadata
      player.on('loadedmetadata', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vhs = (player.tech() as any).vhs;
        if (vhs && vhs.representations) {
             const levels = vhs.representations();
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const mapped = levels.map((l: any) => ({
                 id: l.id,
                 height: l.height,
                 bitrate: l.bandwidth
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             })).sort((a: any, b: any) => b.height - a.height);
             
             setQualities(mapped);
        }
      });

      player.play()?.catch(() => setPaused(true));
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [src]);

  // Hide controls interactions
  useEffect(() => {
    const resetTimer = () => {
      setShowControls(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
          if (!showSettings) setShowControls(false); // Don't hide if settings open
      }, 5000); // 5 seconds
    };

    const handleInput = () => resetTimer();
    window.addEventListener('mousemove', handleInput);
    window.addEventListener('keydown', handleInput);
    window.addEventListener('click', handleInput);

    resetTimer();

    return () => {
        window.removeEventListener('mousemove', handleInput);
        window.removeEventListener('keydown', handleInput);
        window.removeEventListener('click', handleInput);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    return () => {
        window.removeEventListener('mousemove', handleInput);
        window.removeEventListener('keydown', handleInput);
        window.removeEventListener('click', handleInput);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [showSettings]);

  // Real-time Stream Duration Clock
  useEffect(() => {
      if (!isLive || !startTime) return;

      const updateClock = () => {
          const start = new Date(startTime).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - start) / 1000);
          setElapsedStreamTime(elapsed > 0 ? elapsed : 0);
      };

      updateClock(); // Initial
      const interval = setInterval(updateClock, 1000);

      return () => clearInterval(interval);
  }, [isLive, startTime]);

  const togglePlay = () => {
      const player = playerRef.current;
      if (!player) return;
      if (player.paused()) player.play();
      else player.pause();
  };

  const toggleMute = () => {
      const player = playerRef.current;
      if (!player) return;
      player.muted(!player.muted());
  };

  // Fullscreen Logic (Container-based)
  const toggleFullscreen = async () => {
      const container = containerRef.current;
      if (!container) return;

      if (!document.fullscreenElement) {
          try {
              await container.requestFullscreen();
              setFullscreen(true);
          } catch (err) {
              console.error("Error attempting to enable fullscreen:", err);
          }
      } else {
          try {
              if (document.exitFullscreen) {
                await document.exitFullscreen();
                setFullscreen(false);
              }
          } catch (err) {
              console.error("Error attempting to exit fullscreen:", err);
          }
      }
  };

  // Sync fullscreen state with browser events
  useEffect(() => {
    const handleFsChange = () => {
        setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const changeQuality = (qualityId: string) => {
      const player = playerRef.current;
      if (!player) return;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vhs = (player.tech() as any).vhs;
      if (!vhs) return;

      if (qualityId === 'auto') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          vhs.representations().forEach((rep: any) => rep.enabled(true));
          setCurrentQuality('auto');
      } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          vhs.representations().forEach((rep: any) => {
              rep.enabled(rep.id === qualityId);
          });
          setCurrentQuality(qualityId);
      }
      setShowSettings(false);
  };

  const getCurrentQualityLabel = () => {
      if (currentQuality === 'auto') return 'Auto';
      const q = qualities.find(q => q.id === currentQuality);
      return q ? `${q.height}p` : 'Auto';
  };

  const jumpToLive = () => {
      const player = playerRef.current;
      if (!player) return;
      const seekable = player.seekable();
      if (seekable.length > 0) {
          const liveEdge = seekable.end(0);
          player.currentTime(liveEdge);
          player.play();
      }
  };

  // Helper to format negative time (e.g. -01:30)
  const formatTime = (seconds: number) => {
      const absSeconds = Math.abs(seconds);
      const h = Math.floor(absSeconds / 3600);
      const m = Math.floor((absSeconds % 3600) / 60);
      const s = Math.floor(absSeconds % 60);
      
      const mStr = m.toString().padStart(2, '0');
      const sStr = s.toString().padStart(2, '0');
      
      if (h > 0) {
          return `${h}:${mStr}:${sStr}`;
      }
      return `${mStr}:${sStr}`;
  };


  
  // Format current live latency for display
  const getCurrentTimeDisplay = () => {
      // If VOD
      if (duration && isFinite(duration) && duration > 0) {
           return `${formatTime(currentTime)} / ${formatTime(duration)}`;
      }
      // If Live
      if (isBehindLive) {
          return `-${formatTime(liveLatency)}`;
      }
      return "";
  };

  return (
    <div 
        ref={containerRef}
        className="relative w-full h-full bg-[var(--color-tv-black)] flex flex-col group/player overflow-hidden selection:bg-none select-none"
        onDoubleClick={toggleFullscreen}
    >
      {/* Video Container */}
      <div ref={videoRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none" />
      
      {/* ERROR UI */}
      {errorMsg && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-8 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-red-500/30 max-w-xl w-full text-center shadow-2xl">
                <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error_outline</span>
                <h2 className="text-2xl font-bold text-white mb-2">Yayın Oynatılamadı</h2>
                <p className="text-gray-400 mb-6">{errorMsg.split('(')[0]}</p>
                
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-white text-black font-bold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">refresh</span>
                        Sayfayı Yenile
                    </button>
                    
                    <button 
                        onClick={() => setShowErrorDetails(!showErrorDetails)}
                        className="text-white/50 text-sm hover:text-white transition-colors underline decoration-dotted"
                    >
                        {showErrorDetails ? 'Teknik Detayları Gizle' : 'Bu hata neden oldu? (Teknik Detaylar)'}
                    </button>

                    {showErrorDetails && (
                        <div className="mt-4 p-4 bg-black/50 rounded-lg text-left overflow-hidden">
                            <p className="font-mono text-xs text-red-300 break-all mb-2">{errorMsg}</p>
                            <div className="border-t border-white/10 pt-2 mt-2">
                                <p className="text-xs text-gray-500 font-mono">Kaynak:</p>
                                <p className="text-xs text-gray-400 font-mono break-all">{src}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}


      {/* Overlays - Only show if not minimal */}
      {!minimal && (
        <>
          {/* Top Information Overlay */}
          <div className={`absolute top-0 left-0 w-full h-48 overlay-gradient-top z-10 flex items-start justify-between p-[var(--spacing-overscan)] pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            {/* Streamer Info */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                    {/* Live Badge & Go To Live */}
                    {isLive && (
                        <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-lg flex items-center gap-2 shadow-lg transition-colors ${isBehindLive ? 'bg-gray-600 text-white/50 cursor-pointer pointer-events-auto hover:bg-gray-500 hover:text-white' : 'bg-[#FF6600] text-white font-bold live-pulse'}`}
                                 onClick={isBehindLive ? jumpToLive : undefined}
                            >
                                <span className={`w-3 h-3 rounded-full ${isBehindLive ? 'bg-white/50' : 'bg-black'}`}></span>
                                {isBehindLive ? 'CANLIYA DÖN' : 'CANLI'}
                            </div>
                        </div>
                    )}
                    
                    {/* Old Time Display Removed */} 
                </div>
                {/* DYNAMIC CHANNEL NAME */}
                <h1 className="text-5xl font-bold text-white tracking-tight mt-2 drop-shadow-md">{channelName}</h1>
                <h2 className="text-3xl text-[var(--color-primary)] font-medium flex items-center gap-2 drop-shadow-sm">
                    <span className="material-symbols-outlined filled text-4xl">category</span>
                    {category}
                </h2>
                {title && <p className="text-white/60 text-xl max-w-2xl truncate">{title}</p>}
            </div>
            
            {/* Top Right: Branding */}
            <div className="flex items-center gap-3 opacity-80">
                <div className="text-right">
                    <p className="text-3xl font-bold tracking-widest text-white">SmartTV</p>
                    <p className="text-lg text-white/60 font-medium">By KdK</p>
                </div>
            </div>
          </div>

          {/* Center Play Icon Animation (Only when Paused) */}
          <div className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${paused ? 'opacity-100' : 'opacity-0 group-hover/player:opacity-100'}`}>
                {paused && (
                    <div className="w-32 h-32 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center pointer-events-auto cursor-pointer hover:scale-110 transition-transform" onClick={togglePlay}>
                        <span className="material-symbols-outlined text-white text-[80px]">play_arrow</span>
                    </div>
                )}
            </div>

          {/* Bottom Controls Overlay */}
          <div className={`absolute bottom-0 left-0 w-full h-auto min-h-[160px] overlay-gradient-bottom z-20 flex flex-col justify-end p-[var(--spacing-overscan)] transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            
                {/* Scrubber Row */}
            <div className="flex items-center gap-4 w-full mb-6 relative">
                 {/* Left Label: Max History (e.g. -04:00) OR Real Stream Time */}
                 <span className="text-white/70 font-mono text-sm font-bold min-w-[50px] text-right">
                    {/* 
                        If Live and we have StartTime: Show (TotalElapsed - Latency) -> 02:45:12
                        Else if Live: Show negative buffer -> -04:00 
                        Else (VOD): Show currentTime -> 00:15:30 
                    */}
                    {isLive && startTime 
                        ? formatTime(Math.max(0, elapsedStreamTime - liveLatency))
                        : (isFinite(duration) && duration > 0 
                            ? formatTime(currentTime) 
                            : (bufferDuration > 0 ? `-${formatTime(bufferDuration)}` : '00:00')
                          )
                    }
                 </span>
                 
                 {/* DEBUG: Show Buffer Duration if Settings Open */}
                 {showSettings && isLive && (
                    <div className="absolute top-[-20px] left-10 text-[10px] text-orange-500 font-mono bg-black/50 px-1 rounded">
                        Buffer: {formatTime(bufferDuration)} / Elapsed: {formatTime(elapsedStreamTime)}
                    </div>
                 )}

                {/* Scrubber Track */}
                <div 
                    className="flex-1 h-1.5 bg-white/20 group/scrubber cursor-pointer flex items-center relative hover:h-2 transition-all duration-200 rounded-full"
                    onClick={(e) => {
                        if (!playerRef.current) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = (e.clientX - rect.left) / rect.width;
                        const dur = playerRef.current.duration();

                        if (dur !== undefined && isFinite(dur) && dur > 0) {
                            playerRef.current.currentTime(percent * dur);
                        } else if (playerRef.current.seekable().length > 0) {
                             // LIVE Logic
                            const start = playerRef.current.seekable().start(0);
                            const end = playerRef.current.seekable().end(0);
                            const target = start + percent * (end - start);
                            playerRef.current.currentTime(target);
                            
                             // Optimistic update
                            const latency = end - target;
                            setLiveLatency(latency);
                            setIsBehindLive(latency > 10);
                        }
                    }}
                >
                    {/* Progress (Orange) */}
                    <div 
                        className="absolute left-0 h-full bg-[#FF6600] z-10 shadow-[0_0_10px_#FF6600] rounded-l-full"
                        style={{ width: `${currentProgress}%` }}
                    />
                    
                    {/* Thumb (Orange Circle) - With Time Tooltip */}
                    <div 
                        className="absolute w-5 h-5 bg-[#FF6600] rounded-full shadow-[0_0_15px_#FF6600] z-20 opacity-0 group-hover/scrubber:opacity-100 scale-0 group-hover/scrubber:scale-100 transition-all duration-200 flex items-center justify-center"
                        style={{ left: `${currentProgress}%`, transform: 'translateX(-50%)' }}
                    >
                         {/* Time Tooltip on Hover/Drag */}
                         <div className="absolute bottom-full mb-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-md border border-white/10 whitespace-nowrap hidden group-hover/scrubber:block">
                             {getCurrentTimeDisplay() || "CANLI"}
                         </div>
                    </div>
                </div>

                {/* Right Label: LIVE or Duration */}
                <span className="text-[#FF6600] font-mono text-sm font-bold min-w-[50px] uppercase tracking-wider">
                     {isFinite(duration) && duration > 0 ? formatTime(duration) : 'CANLI'}
                </span>
            </div>

            {/* 2. Main Control Row */}
            <div className="flex items-center justify-between w-full pointer-events-auto px-2">
                
                {/* Left: Volume Controls */}
                <div className="flex items-center gap-4 group/volume w-1/4">
                    <button className="tv-focusable w-12 h-12 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors" onClick={toggleMute}>
                        <span className="material-symbols-outlined text-3xl">{muted || volume === 0 ? 'volume_off' : 'volume_up'}</span>
                    </button>
                    <div className="w-0 overflow-hidden group-hover/volume:w-32 transition-all duration-300 flex items-center">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={muted ? 0 : volume}
                            onChange={(e) => {
                                const newVol = parseFloat(e.target.value);
                                setVolume(newVol);
                                setMuted(newVol === 0);
                                if (playerRef.current) playerRef.current.volume(newVol);
                            }}
                            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#FF6600] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_#FF6600]"
                        />
                    </div>
                </div>

                {/* Center: Play/Pause/Skip Controls (ABSOLUTE CENTER) */}
                <div className="flex items-center justify-center gap-8 w-1/2">
                    <button 
                        onClick={() => {
                            const player = playerRef.current;
                            if (player) {
                                const current = player.currentTime() || 0;
                                player.currentTime(current - 10);
                            }
                        }}
                        className="tv-focusable p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        title="Geri Sar (10s)"
                    >
                        <span className="material-symbols-outlined text-4xl">replay_10</span>
                    </button>

                    <button 
                        className="tv-focusable w-20 h-20 bg-white text-[var(--color-primary)] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(124,59,237,0.4)] hover:scale-110 transition-transform" 
                        onClick={togglePlay}
                    >
                        <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>
                            {paused ? 'play_arrow' : 'pause'}
                        </span>
                    </button>

                    <button 
                        onClick={() => {
                            if (playerRef.current) {
                                const player = playerRef.current;
                                const duration = player.duration() || 0;
                                const currentTime = player.currentTime() || 0;
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const liveTracker = (player as any).liveTracker;
                                
                                if (duration - currentTime > 10) {
                                     player.currentTime(currentTime + 10);
                                } else {
                                     if (liveTracker && typeof liveTracker.seekableEnd === 'function') {
                                         player.currentTime(liveTracker.seekableEnd());
                                     } else {
                                         player.currentTime(duration);
                                     }
                                }
                            }
                        }}
                        className="tv-focusable p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        title="İleri Sar (10s)"
                    >
                        <span className="material-symbols-outlined text-4xl">forward_10</span>
                    </button>
                </div>

                {/* Right: Quality & Settings & Fullscreen */}
                <div className="flex items-center justify-end gap-6 relative w-1/4">
                    {/* Quality Label */}
                    <div className="px-3 py-1 bg-white/10 rounded text-white font-bold text-sm border border-white/5">
                        {getCurrentQualityLabel()}
                    </div>

                    <button 
                        className={`tv-focusable w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors ${showSettings ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'}`}
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <span className="material-symbols-outlined text-3xl">settings</span>
                    </button>

                    {/* Settings Menu */}
                    {showSettings && (
                        <div className="absolute bottom-full right-0 mb-4 w-60 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col py-1">
                             <div className="px-4 py-2 text-white/50 text-xs font-bold uppercase tracking-wider mb-1 border-b border-white/5">Kalite</div>
                             <button 
                                onClick={() => changeQuality('auto')}
                                className={`px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center justify-between ${currentQuality === 'auto' ? 'text-[var(--color-primary)] font-bold' : 'text-white'}`}
                             >
                                <span className="text-sm">Otomatik</span>
                                {currentQuality === 'auto' && <span className="material-symbols-outlined text-base">check</span>}
                             </button>
                             {qualities.map((q) => (
                                <button 
                                    key={q.id}
                                    onClick={() => changeQuality(q.id)}
                                    className={`px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center justify-between ${currentQuality === q.id ? 'text-[var(--color-primary)] font-bold' : 'text-white'}`}
                                >
                                    <span className="text-sm">{q.height}p</span>
                                    {currentQuality === q.id && <span className="material-symbols-outlined text-base">check</span>}
                                </button>
                             ))}
                        </div>
                    )}

                    <button className="tv-focusable w-12 h-12 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 transition-colors" onClick={toggleFullscreen}>
                        <span className="material-symbols-outlined text-3xl">{fullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                    </button>
                </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
