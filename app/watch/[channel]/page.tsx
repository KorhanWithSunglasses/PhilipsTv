import TVPlayer from '@/components/TVPlayer';
import { getKickStream } from '@/lib/kick';
import Link from 'next/link';

export const revalidate = 60;

interface WatchPageProps {
  params: Promise<{ channel: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { channel } = await params;
  const { url, isLive, error } = await getKickStream(channel);

  // If offline or error
  // TODO: Improve offline state with "Go back" button or similar
  if (!url || error) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-black text-white">
              <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4 capitalize">{channel}</h1>
                  <p className="text-2xl text-gray-400">Yayıncı Şu An Çevrimdışı</p>
                  <p className="text-sm mt-4 text-gray-600">Tekrar kontrol ediliyor...</p>
                  <Link href="/" className="mt-8 inline-block bg-white/10 px-6 py-3 rounded text-white hover:bg-white/20 transition-colors">
                    Ana Sayfaya Dön
                  </Link>
              </div>
          </div>
      );
  }

  // Wrap URL in our local proxy to bypass CORS
  const proxyUrl = url ? `/api/proxy?url=${encodeURIComponent(url)}` : null;

  const { displayName, title, category, startTime } = await getKickStream(channel);

  return (
    <main className="h-screen w-full bg-black overflow-hidden relative group">
      <TVPlayer 
        src={proxyUrl || ''} 
        isLive={isLive} 
        channelName={displayName}
        title={title}
        category={category}
        startTime={startTime}
      />
      
      {/* Back Button Overlay - Visible on hover/interaction */}
      <Link href="/" className="absolute top-8 left-8 z-50 bg-black/50 backdrop-blur-md p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/80">
        <span className="material-symbols-outlined text-3xl">arrow_back</span>
      </Link>
    </main>
  );
}
