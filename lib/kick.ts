

export async function getKickChannel(channel: string) {
  try {
    const response = await fetch(`https://kick.com/api/v1/channels/${channel}`, {
      cache: 'no-store', // Disable caching to fetch fresh stream URLs
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    
    // Extract relevant info
    const isLive = data?.livestream?.is_live || false;
    const playbackUrl = data?.playback_url;
    const category = data?.livestream?.categories?.[0]?.name || data?.recent_categories?.[0]?.name || 'Just Chatting';
    const viewers = data?.livestream?.viewer_count || 0;
    const title = data?.livestream?.session_title || data?.previous_livestreams?.[0]?.session_title || '';
    const thumbnail = data?.livestream?.thumbnail?.url || data?.user?.profile_pic;
    
    return {
        username: data?.slug || channel,
        displayName: data?.user?.username || channel,
        isLive,
        playbackUrl,
        category,
        viewers,
        title,
        thumbnail, // Provide a default if missing?
        startTime: data?.livestream?.start_time || data?.livestream?.created_at || null, // Stream start time
    };
  } catch (e) {
    console.error(`Error fetching ${channel}:`, e);
    return null;
  }
}

// Keep original function for compatibility but wrap the new one if needed, 
// or just use this one. For now let's keep a focused stream fetcher if needed.
export async function getKickStream(channel: string) {
    const data = await getKickChannel(channel);
    return {
        url: data?.playbackUrl || null,
        isLive: data?.isLive || false,
        error: data ? null : 'Failed to fetch',
        // Pass other data if we update callers
        ...data
    };
}
