'use client';

import { useState } from 'react';
import { StreamerInfo } from '@/lib/streamers';
import StreamCard from './StreamCard';
import Sidebar from './Sidebar';

interface LiveGridProps {
  initialChannels: StreamerInfo[];
}

type SortOption = 'viewers' | 'name' | 'status';

export default function LiveGrid({ initialChannels }: LiveGridProps) {
  const [sortOption, setSortOption] = useState<SortOption>('viewers');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // Sorting Logic
  const sortedChannels = [...initialChannels].sort((a, b) => {
    switch (sortOption) {
      case 'viewers':
        // Live first, then viewer count
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
        return (b.viewers || 0) - (a.viewers || 0);
      case 'name':
        return a.displayName.localeCompare(b.displayName);
      case 'status':
        return (a.isLive === b.isLive) ? 0 : a.isLive ? -1 : 1;
      default:
        return 0;
    }
  });

  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    setIsSortMenuOpen(false);
  };

  const getSortLabel = () => {
    switch (sortOption) {
      case 'viewers': return 'İzleyici Sayısı';
      case 'name': return 'İsim';
      case 'status': return 'Durum';
    }
  };

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      <Sidebar />
      
      {/* Main Content - Adjusted padding to match Sidebar for symmetry */}
      <main className="flex-1 flex flex-col h-full relative z-10 pl-[60px] pr-[60px] py-[60px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 w-full relative">
            <div className="flex flex-col">
                <h2 className="text-5xl font-bold text-white mb-2 leading-tight">Şimdi Canlı</h2>
                <p className="text-2xl text-white/50 font-normal">Popüler yayıncıları keşfet</p>
            </div>
            
            {/* Sort Button / Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                    className="flex items-center gap-3 text-white/70 hover:text-white transition-colors bg-white/5 px-6 py-3 rounded-xl border border-white/5 hover:border-white/20"
                >
                    <span className="material-symbols-outlined text-3xl">sort</span>
                    <span className="text-2xl font-medium">Sırala: {getSortLabel()}</span>
                </button>

                {isSortMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col">
                        <button 
                            onClick={() => handleSortChange('viewers')}
                            className={`px-6 py-4 text-left text-xl hover:bg-white/10 transition-colors ${sortOption === 'viewers' ? 'text-primary font-bold' : 'text-white'}`}
                        >
                            İzleyici Sayısı
                        </button>
                        <button 
                            onClick={() => handleSortChange('status')}
                            className={`px-6 py-4 text-left text-xl hover:bg-white/10 transition-colors ${sortOption === 'status' ? 'text-primary font-bold' : 'text-white'}`}
                        >
                            Durum (Canlı)
                        </button>
                        <button 
                            onClick={() => handleSortChange('name')}
                            className={`px-6 py-4 text-left text-xl hover:bg-white/10 transition-colors ${sortOption === 'name' ? 'text-primary font-bold' : 'text-white'}`}
                        >
                            İsim (A-Z)
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Grid Container */}
        <div className="grid grid-cols-4 gap-14 w-full content-start pr-4 pb-40 overflow-y-auto no-scrollbar">
            {sortedChannels.map((channel) => (
                <div key={channel.username} className="aspect-video w-full relative group/card z-0 hover:z-50">
                    <StreamCard channel={channel} />
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
