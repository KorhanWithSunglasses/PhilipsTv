'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="bg-black text-white p-10 font-mono">
        <h2 className="text-red-500 text-2xl font-bold mb-4">Uygulama Hatası (TV)</h2>
        <div className="bg-gray-900 p-4 rounded border border-gray-700 mb-6 overflow-auto max-h-[60vh]">
          <h3 className="text-lg font-bold text-yellow-500 mb-2">{error.name}</h3>
          <p className="text-base text-gray-300 mb-4">{error.message}</p>
          {error.stack && (
            <pre className="text-xs text-gray-500 whitespace-pre-wrap">
              {error.stack}
            </pre>
          )}
          {error.digest && (
             <p className="text-xs text-gray-600 mt-2">Digest: {error.digest}</p>
          )}
        </div>
        <button
          onClick={() => reset()}
          className="bg-orange-600 text-white px-6 py-3 rounded text-xl font-bold hover:bg-orange-700"
        >
          Tekrar Dene
        </button>
      </body>
    </html>
  );
}
