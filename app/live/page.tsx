import { getKickChannel } from '@/lib/kick';
import { STREAMERS } from '@/lib/streamers';
import LiveGrid from '@/components/LiveGrid';

export const revalidate = 60;

export default async function Page() {
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

  return <LiveGrid initialChannels={channelsData} />;
}
