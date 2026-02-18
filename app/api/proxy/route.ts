import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    console.log(`[Proxy] Fetching: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Origin': 'https://kick.com',
        'Referer': 'https://kick.com/'
      },
    });

    console.log(`[Proxy] Upstream Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
        console.error(`[Proxy] Failed to fetch. Status: ${response.status}`);
        return NextResponse.json(
          { error: `Failed to fetch: ${response.statusText}` },
          { status: response.status }
        );
      }
  
      const contentType = response.headers.get('Content-Type') || '';
      const isM3U8 = contentType.includes('mpegurl') || url.endsWith('.m3u8');
  
      if (isM3U8) {
        console.log(`[Proxy] Rewriting M3U8 content for: ${url}`);
        const text = await response.text();
        const baseUrl = new URL(url);
        
        const rewritten = text.split(/\r?\n/).map(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;
          
          try {
            // Resolve relative URLs
            const absoluteUrl = new URL(trimmed, baseUrl).toString();
            
            // OPTIMIZATION: Only proxy nested playlists (.m3u8). 
            // Return direct URLs for segments (.ts, .m4s) to bypass Vercel server and save bandwidth.
            // This assumes the CDN allows direct access (CORS).
            const isPlaylist = absoluteUrl.includes('.m3u8');

            if (isPlaylist) {
                return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
            } else {
                return absoluteUrl;
            }
          } catch (e) {
            console.error(`[Proxy] Error parsing line: ${trimmed}`, e);
            return line;
          }
        }).join('\n');
  
        return new NextResponse(rewritten, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          }
        });
      }
  
      const body = await response.blob(); 
      
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'public, max-age=3600');
  
      return new NextResponse(body, {
        status: 200,
        headers,
      });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
