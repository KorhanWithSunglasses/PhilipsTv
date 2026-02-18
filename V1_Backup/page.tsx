import Sidebar from '@/components/Sidebar';
import StreamCard from '@/components/StreamCard';
import { getKickChannel } from '@/lib/kick';
import { STREAMERS } from '@/lib/streamers';

export const revalidate = 60;

export default async function Home() {
  // Fetch data for all streamers
  // In a real app, this should be paginated or optimized. 
  // For 15 streamers, Promise.all is acceptable but might be slow.
  const channelsData = await Promise.all(
    STREAMERS.map(async (slug) => {
      const data = await getKickChannel(slug);
      return data || { 
        username: slug, 
        displayName: slug, 
        isLive: false, 
        category: 'Offline', 
        viewers: 0, 
        title: '', 
        thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop' // Generic gaming placeholder
      };
    })
  );

  // Sort: Live first, then by viewers
  const sortedChannels = [...channelsData].sort((a, b) => {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    return (b.viewers || 0) - (a.viewers || 0);
  });

  const featuredChannel = sortedChannels[0]; // Top streamer is featured
  const liveChannels = sortedChannels.filter(c => c.isLive);
  // If no one is live, just show the top ones
  const displayedRow = liveChannels.length > 0 ? liveChannels : sortedChannels.slice(0, 5);

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col gap-10 h-full overflow-hidden p-[60px]">
        {/* Hero Banner */}
        <div className="relative w-full h-[400px] shrink-0 rounded-2xl overflow-hidden bg-[#1A1A1A] shadow-2xl group">
             {/* Background Image */}
             <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: `url('${featuredChannel.thumbnail}')` }}
             />
             {/* Gradient Overlay */}
             <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
             
             {/* Hero Content */}
             <div className="absolute inset-0 flex flex-col justify-center px-12 gap-4">
                <div className="flex items-center gap-3 mb-2">
                    {featuredChannel.isLive && <span className="bg-red-600 text-white text-lg font-bold px-3 py-1 rounded animate-pulse">CANLI</span>}
                    <span className="text-gray-300 text-xl font-medium tracking-wide uppercase">{featuredChannel.category}</span>
                </div>
                <h2 className="text-white text-[56px] font-bold leading-[1.1] max-w-[800px]">{featuredChannel.title || featuredChannel.displayName}</h2>
                <div className="flex items-center gap-6 mt-4">
                     <a href={`/watch/${featuredChannel.username}`} className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-lg font-bold text-xl hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined fill-1">play_arrow</span>
                        İzle
                     </a>
                </div>
             </div>
        </div>

        {/* Content Rows */}
        <div className="flex flex-col gap-6 overflow-hidden">
            <div className="flex items-center justify-between pr-4">
                <h3 className="text-[32px] font-bold text-white tracking-wide">Şu An Canlı</h3>
            </div>
            <div className="flex gap-8 pb-8 pl-2 pt-2 overflow-x-auto no-scrollbar">
                {displayedRow.map((channel) => (
                    <div key={channel.username} className="w-[440px] shrink-0">
                         <StreamCard channel={channel} isLarge={true} />
                    </div>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
}
