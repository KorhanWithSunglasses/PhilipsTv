'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const menuItems = [
    { name: 'Ana Sayfa', icon: 'home', path: '/' },
    { name: 'Canlı Yayınlar', icon: 'live_tv', path: '/live' },
    { name: 'Diziler', icon: 'movie', path: '/series', disabled: true },
    { name: 'Filmler', icon: 'theaters', path: '/movies', disabled: true },
  ];

  return (
    <aside className="flex flex-col w-[350px] shrink-0 h-screen justify-between py-[60px] pl-[60px] pr-8 bg-black border-r border-white/10 z-50">
      <div className="flex flex-col gap-12">
        {/* Logo */}
        <div className="">
          <h1 className="text-primary text-5xl font-bold tracking-tight leading-none">SmartTV</h1>
          <p className="text-neutral-500 text-lg mt-1 font-bold tracking-widest pl-1 border-l-2 border-neutral-700 ml-1">By KdK</p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-4">
          {menuItems.map((item) => {
             if (item.disabled) {
                return (
                    <div
                        key={item.path}
                        className="flex items-center gap-5 px-6 py-5 rounded-r-xl transition-all duration-200 text-[#444444] cursor-not-allowed opacity-50"
                    >
                        <span className="material-symbols-outlined text-[36px]">
                        {item.icon}
                        </span>
                        <span className="text-[32px] leading-none font-medium">{item.name}</span>
                    </div>
                );
             }

            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-5 px-6 py-5 rounded-r-xl transition-all duration-200 group ${
                  active
                    ? 'text-white border-l-4 border-primary bg-gradient-to-r from-primary/20 to-transparent font-bold'
                    : 'text-[#888888] hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`material-symbols-outlined text-[36px] ${active ? 'text-white' : ''}`}>
                  {item.icon}
                </span>
                <span className="text-[32px] leading-none font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Settings - Disabled */}
      <div className="flex items-center gap-5 px-6 py-5 rounded-r-xl mb-4 text-[#444444] cursor-not-allowed opacity-50">
        <span className="material-symbols-outlined text-[36px]">settings</span>
        <span className="text-[32px] leading-none font-medium">Ayarlar</span>
      </div>
    </aside>
  );
}
