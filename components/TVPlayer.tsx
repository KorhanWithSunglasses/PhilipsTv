import { useEffect, useRef, useState } from 'react';
import Hls, { ErrorData, Events } from 'hls.js';

interface TVPlayerProps {
  src: string;
}

export default function TVPlayer({ src }: TVPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('Initializing...');

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const resetPlayer = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeAttribute('src');
      video.load();
    };

    resetPlayer();

    if (!src) {
      // Avoid setting state here to prevent cascading updates warning
      // Just log to debug info if needed or handle in render
      return;
    }

    
    // STRATEGY 1: Native HLS (Preferred for Smart TVs/Vewd)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Avoid immediate state update
      setTimeout(() => setDebugInfo('Mode: Native HLS (Apple/SmartTV)'), 0);
      video.src = src;
      // Native listeners
      video.addEventListener('error', () => {
        const err = video.error;
        setErrorMsg(`Native Error: ${err?.code} - ${err?.message}`);
      });
    }
    // STRATEGY 2: Hls.js Fallback (Legacy Config)
    else if (Hls.isSupported()) {
      // Avoid setting state synchronously if possible, or use timeout 0
      setTimeout(() => setDebugInfo('Mode: Hls.js (Legacy Fallback)'), 0);
      
      const hls = new Hls({
        enableWorker: false, // Critical for old Vewd/CPUs
        maxBufferLength: 30, // Reduce memory usage
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 20000,
        levelLoadingTimeOut: 20000,
        fragLoadingTimeOut: 20000,
      });

      hls.loadSource(src);
      hls.attachMedia(video);
      
      hls.on(Events.ERROR, (_event: unknown, data: ErrorData) => {
        if (data.fatal) {
           setErrorMsg(`HLS.js Fatal: ${data.type} - ${data.details}`);
           // Try to recover
           switch (data.type) {
             case Hls.ErrorTypes.NETWORK_ERROR:
               hls.startLoad();
               break;
             case Hls.ErrorTypes.MEDIA_ERROR:
               hls.recoverMediaError();
               break;
             default:
               resetPlayer();
               break;
           }
        }
      });

      hlsRef.current = hls;
    } 
    else {
      // Avoid immediate state update
      setTimeout(() => {
        setErrorMsg('Hata: Bu tarayıcı HLS oynatamıyor (Ne Native ne Hls.js).');
        setDebugInfo('Mode: Unsupported');
      }, 0);
    }

    return () => {
      resetPlayer();
    };
  }, [src]);

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center">
      
      {/* ERROR / DEBUG OVERLAY */}
      {(errorMsg || debugInfo) && (
        <div className="absolute top-2 left-2 right-2 z-10 pointer-events-none">
          {errorMsg && (
            <div className="bg-red-800/90 text-white p-2 mb-2 rounded border border-red-500 text-sm font-mono whitespace-pre-wrap">
              {errorMsg}
            </div>
          )}
          <div className="bg-black/50 text-green-400 p-1 text-[10px] font-mono">
            {debugInfo}
          </div>
        </div>
      )}

      {/* PURE HTML5 VIDEO TAG - NO CUSTOM UI */}
      <video
        ref={videoRef}
        controls // Native TV controls
        playsInline
        className="w-full h-full object-contain"
        style={{ width: '100%', height: '100%', maxHeight: '100vh' }}
        controlsList="nodownload" 
        preload="auto"
      />
    </div>
  );
}
