'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface Source {
  url: string;
  title: string;
  description?: string;
}

interface CitationTooltipProps {
  sources: Source[];
}

// Helper to get favicon URL
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '/favicon.ico';
  }
}

export function CitationTooltip({ sources }: CitationTooltipProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; source: Source } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'SUP' && target.className.includes('citation')) {
        const citationText = target.textContent?.match(/\d+/)?.[0];
        if (citationText) {
          const index = parseInt(citationText) - 1;
          const source = sources[index];
          if (source) {
            const rect = target.getBoundingClientRect();
            setTooltip({
              x: rect.left + rect.width / 2,
              y: rect.top,
              source
            });
          }
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'SUP' && target.className.includes('citation')) {
        timeoutRef.current = setTimeout(() => {
          setTooltip(null);
        }, 200);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [sources]);

  if (!tooltip) return null;

  const maxUrlLength = 50;
  const displayUrl = tooltip.source.url.length > maxUrlLength 
    ? tooltip.source.url.substring(0, maxUrlLength) + '...' 
    : tooltip.source.url;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: tooltip.x,
        top: tooltip.y - 8,
        transform: 'translate(-50%, -100%)'
      }}
      onMouseEnter={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }}
      onMouseLeave={() => setTooltip(null)}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 max-w-sm pointer-events-auto">
        <div className="flex items-start gap-3">
          <Image 
            src={getFaviconUrl(tooltip.source.url)} 
            alt=""
            width={20}
            height={20}
            className="w-5 h-5 mt-0.5 flex-shrink-0"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"%3E%3Crect width="20" height="20" rx="4" fill="%23E5E7EB"/%3E%3C/svg%3E';
            }}
          />
          <div className="min-w-0">
            <p className="font-medium text-sm text-gray-900 dark:text-gray-100 break-words">
              {tooltip.source.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all">
              {displayUrl}
            </p>
            {tooltip.source.description && (
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                {tooltip.source.description}
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Arrow */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-2">
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white dark:border-t-gray-800" />
      </div>
    </div>
  );
}