'use client';

import { StreamerInfo } from '@/lib/streamers';
import Link from 'next/link';

interface StreamCardProps {
  channel: StreamerInfo;
  isLarge?: boolean;
}

export default function StreamCard({ channel, isLarge = false }: StreamCardProps) {
  const { username, displayName, category, viewers, isLive, title, thumbnail } = channel;

  return (
    <Link 
      href={`/watch/${username}`}
      className={`group relative shrink-0 rounded-xl overflow-hidden bg-[#1A1A1A] border border-white/10 transition-all duration-300 transform hover:scale-110 hover:border-primary/50 hover:shadow-[0_0_40px_rgba(255,102,0,0.6)] cursor-pointer h-full w-full block`}
    >
        {/* Background Image / Thumbnail */}
        <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
            style={{ 
                backgroundImage: `url('${thumbnail || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop'}')`,
                opacity: 0.8 
            }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

        {/* Live Badge */}
        {isLive && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#FF6600] px-3 py-1.5 rounded shadow-lg animate-[pulse_2s_infinite]">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span className="text-white text-sm font-bold tracking-wider">CANLI</span>
            </div>
        )}
        
        {!isLive && (
             <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded">
                <span className="text-white text-sm font-bold tracking-wider">OFFLINE</span>
            </div>
        )}


        {/* Card Info */}
        <div className="absolute bottom-0 left-0 w-full p-5 flex flex-col gap-1">
            <h4 className="text-white text-[22px] font-bold truncate drop-shadow-md">{displayName}</h4>
            <div className="flex items-center justify-between text-gray-300">
                <p className="text-lg font-medium truncate max-w-[70%]">{category}</p>
                {isLive && <span className="text-primary text-base font-bold">{viewers} İzleyici</span>}
            </div>
        </div>
    </Link>
  );
}
