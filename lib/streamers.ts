export const STREAMERS = [
  'jahrein',
  'swaggybark',
  'erlizzy',
  'caglararts',
  'killayda',
  'buraksakinol',
  'burhi',
  'purplebixi',
  'cavs',
  'nanazort',
  'wtcn',
  'holyphoenix',
  'aloskegang',
  'hype',
  'closer'
];

export interface StreamerInfo {
    username: string;
    displayName: string;
    isLive: boolean;
    category?: string;
    viewers?: number;
    thumbnail?: string;
    title?: string;
    playbackUrl?: string; // HLS URL
}
