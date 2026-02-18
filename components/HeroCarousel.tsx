'use client';

import { useState, useEffect } from 'react';
import { StreamerInfo } from '@/lib/streamers';
import TVPlayer from './TVPlayer';
import Link from 'next/link';

interface HeroCarouselProps {
  liveChannels: StreamerInfo[];
}

export default function HeroCarousel({ liveChannels }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Rotating logic
  useEffect(() => {
    if (liveChannels.length === 0) return;

    const rotationInterval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % liveChannels.length);
        setProgress(0); // Reset progress bar
    }, 20000); // 20 seconds

    // Progress bar animation
    const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + (100 / 200), 100)); // Update every 100ms
    }, 100);

    return () => {
        clearInterval(rotationInterval);
        clearInterval(progressInterval);
    };
  }, [liveChannels.length, activeIndex]); 
  // Dependency on activeIndex resets the timer if user manually clicks? 
  // Ideally, manual click should reset timer.

  const handleChannelClick = (index: number) => {
      setActiveIndex(index);
      setProgress(0);
  };

  if (liveChannels.length === 0) {
      return (
          <div className="w-full h-[500px] flex items-center justify-center bg-[#1A1A1A] rounded-2xl">
              <p className="text-2xl text-white/50">Şu an canlı yayın yok.</p>
          </div>
      );
  }

  const activeChannel = liveChannels[activeIndex];
  // Helper for proxy url
  const getProxyUrl = (url: string) => `/api/proxy?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex gap-8 w-full h-[600px] mb-20">
      {/* LEFT: Active Stream Player */}
      <div className="flex-[2] relative rounded-2xl overflow-hidden shadow-2xl bg-black group/main">
        <TVPlayer 
            src={activeChannel.playbackUrl ? getProxyUrl(activeChannel.playbackUrl) : ''} 
            isLive={true} 
            minimal={true}
        />
        
        {/* Overlay Info - Clickable to Watch */}
        <Link 
            href={`/watch/${activeChannel.username}`}
            className="absolute top-0 left-0 w-full h-full p-6 bg-gradient-to-b from-black/90 via-transparent to-transparent z-20 flex flex-col items-start cursor-pointer hover:bg-white/5 transition-colors"
        >
             <h2 className="text-3xl font-bold text-white mb-1 drop-shadow-md">{activeChannel.displayName}</h2>
             <p className="text-base text-primary font-medium max-w-[80%] truncate">{activeChannel.title}</p>
        </Link>
        
        <Link 
            href={`/watch/${activeChannel.username}`}
            className="absolute bottom-6 right-6 z-30 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg pointer-events-auto group/btn hover:scale-110"
            title="Tam Ekran İzle"
        >
            <span className="material-symbols-outlined text-3xl">fullscreen</span>
        </Link>
      </div>

      {/* RIGHT: Vertical Carousel List */}
      <div className="flex-1 flex flex-col gap-4 relative overflow-hidden h-full rounded-2xl bg-[#0a0a0a] border border-white/5">
         <div 
            className="flex flex-col gap-4 p-4 transition-transform duration-700 ease-in-out"
            style={{ transform: `translateY(-${Math.max(0, (activeIndex - 1) * 140)}px)` }} 
         >
            {liveChannels.map((channel, index) => {
                const isActive = index === activeIndex;
                return (
                    <div 
                        key={channel.username}
                        onClick={() => handleChannelClick(index)}
                        className={`
                            relative h-[124px] w-full shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border border-white/5
                            ${isActive ? 'opacity-100 scale-100 ring-2 ring-primary z-10 shadow-[0_0_20px_rgba(255,102,0,0.3)] bg-white/5' : 'opacity-40 scale-95 hover:opacity-80 bg-black/40'}
                        `}
                    >
                        {/* Content Row */}
                        <div className="flex h-full"> 
                            {/* Thumb */}
                            <div className="w-[100px] h-full relative">
                                <div 
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url('${channel.thumbnail}')` }}
                                />
                            </div>
                            
                            {/* Text Info */}
                            <div className="flex-1 p-3 flex flex-col justify-center gap-1">
                                <h3 className={`font-bold text-white leading-tight truncate ${isActive ? 'text-lg text-primary' : 'text-base'}`}>{channel.displayName}</h3>
                                <p className="text-xs text-gray-400 truncate">{channel.category}</p>
                                {isActive && (
                                    <div className="mt-1 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF6600] animate-pulse"></div>
                                        <span className="text-[10px] uppercase font-bold text-[#FF6600] tracking-wider">CANLI</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress Bar for Active Item */}
                        {isActive && (
                            <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
                                <div 
                                    className="h-full bg-primary ease-linear"
                                    style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
         </div>
      </div>
    </div>
  );
}
