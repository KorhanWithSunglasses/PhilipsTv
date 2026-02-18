import { NextRequest, NextResponse } from 'next/server';
import { getKickStream } from '@/lib/kick';

export async function GET(request: NextRequest) {
  const channel = request.nextUrl.searchParams.get('channel') || 'swaggybark';
  const { url, isLive, error } = await getKickStream(channel);

  if (error || !url) {
    return NextResponse.json({ error, isLive }, { status: isLive ? 500 : 404 });
  }

  // Wrap URL in our local proxy to bypass CORS
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
  return NextResponse.json({ url: proxyUrl, isLive });
}

