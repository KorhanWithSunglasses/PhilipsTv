import Sidebar from '@/components/Sidebar';
import StreamCard from '@/components/StreamCard';
import { getKickChannel } from '@/lib/kick';
import { STREAMERS } from '@/lib/streamers';

import HeroCarousel from '@/components/HeroCarousel';

export const revalidate = 60;

export default async function Home() {
  // Fetch data for all streamers
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
        thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop' 
      };
    })
  );

  const sortedChannels = [...channelsData].sort((a, b) => {
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    return (b.viewers || 0) - (a.viewers || 0);
  });

  const featuredChannel = sortedChannels[0];
  const liveChannels = sortedChannels.filter(c => c.isLive);
  const displayedRow = liveChannels.length > 0 ? liveChannels : sortedChannels.slice(0, 5);

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden p-[60px] relative">
        {/* Dynamic Hero Carousel V2 */}
        <HeroCarousel liveChannels={liveChannels.length > 0 ? liveChannels : [featuredChannel]} />

        {/* Content Rows - Pushed down to bottom/middle */}
        <div className="flex flex-col gap-6 overflow-hidden mt-auto mb-8">
            <div className="flex items-center justify-between pr-4">
                <h3 className="text-[32px] font-bold text-white tracking-wide">Şu An Canlı</h3>
            </div>
            <div className="flex gap-8 pb-8 pl-2 pt-2 overflow-x-auto no-scrollbar">
                {displayedRow.map((channel) => (
                    <div key={channel.username} className="w-[440px] shrink-0 aspect-video relative">
                         <StreamCard channel={channel} isLarge={true} />
                    </div>
                ))}
            </div>
        </div>
      </main>
    </div>
  );
}
