'use client';

import { useState, useEffect, useCallback } from 'react';

export function ImageLightbox({ images, index, onClose }: { images: string[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);

  const prev = useCallback(() => setCurrent(i => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const next = useCallback(() => setCurrent(i => (i < images.length - 1 ? i + 1 : 0)), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center cursor-pointer" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 text-gray-400 hover:text-white z-10 bg-black/50 rounded-full p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 text-gray-400 hover:text-white z-10 bg-black/50 rounded-full p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <img
        src={images[current]}
        alt={`Imagem ${current + 1}`}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg cursor-default"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <div className="absolute bottom-4 text-sm text-gray-500">
          {current + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
