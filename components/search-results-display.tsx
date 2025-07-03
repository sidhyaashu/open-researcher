'use client'

import { useState, useEffect, useRef } from 'react'
import { Globe, Search, FileText, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatedCursor } from './animated-cursor'

interface SearchResult {
  title: string
  url: string
  description?: string
  markdown?: string
  screenshot?: string
  dateFound?: string
}

interface SearchHistory {
  query: string
  results: SearchResult[]
  screenshots: Array<{ url: string; screenshot?: string }>
  timestamp: number
}

interface SearchResultsDisplayProps {
  query?: string
  results?: SearchResult[]
  isActive?: boolean
  currentUrl?: string
  screenshots?: Array<{ url: string; screenshot?: string }>
  onClose?: () => void
}

export function SearchResultsDisplay({ 
  query = '', 
  results = [], 
  isActive = false,
  currentUrl = '',
  screenshots = [],
  onClose
}: SearchResultsDisplayProps) {
  const [showScreenshot, setShowScreenshot] = useState(false)
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null)
  const [activeResultIndex, setActiveResultIndex] = useState(-1)
  const [viewMode, setViewMode] = useState<'search' | 'screenshots' | 'history'>('search')
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0)
  const [isImageTall, setIsImageTall] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [showClosingAnimation, setShowClosingAnimation] = useState(false)
  const [browserClosed, setBrowserClosed] = useState(false)
  const closeButtonRef = useRef<HTMLDivElement>(null)
  const browserContainerRef = useRef<HTMLDivElement>(null)
  const screenshotRef = useRef<HTMLImageElement>(null)
  
  // Save search history when search completes
  useEffect(() => {
    if (!isActive && query && results.length > 0) {
      // Check if this search is already in history (avoid duplicates)
      const existingIndex = searchHistory.findIndex(h => h.query === query)
      if (existingIndex === -1) {
        const newHistory: SearchHistory = {
          query,
          results: [...results],
          screenshots: [...screenshots],
          timestamp: Date.now()
        }
        setSearchHistory(prev => [...prev, newHistory])
      }
      
      // Trigger closing animation after search completes
      setTimeout(() => {
        setShowClosingAnimation(true)
      }, 2000) // Wait 2 seconds after search completes
    }
  }, [isActive, query, results.length, screenshots.length])
  
  // Switch to history view when search completes and we have history
  useEffect(() => {
    if (!isActive && searchHistory.length > 0) {
      setViewMode('history')
    }
  }, [isActive, searchHistory.length])

  // Show screenshot only when actively scraping a specific URL
  useEffect(() => {
    if (isActive && currentUrl && currentUrl !== '' && screenshots.length > 0) {
      // Always use the latest screenshot when scraping
      // This handles cases where the same URL is scraped multiple times
      const latestScreenshot = screenshots[screenshots.length - 1]
      
      // Check if this is the URL being scraped or if it's the latest screenshot
      const currentScreenshotData = screenshots.find(s => s.url === currentUrl) || latestScreenshot
      
      if (currentScreenshotData?.screenshot) {
        // Small delay to ensure smooth transition
        setTimeout(() => {
          // Reset loading state when changing screenshots
          setIsImageLoaded(false)
          setIsImageTall(false)
          // Show the screenshot for the page being scraped
          setCurrentScreenshot(currentScreenshotData.screenshot || null)
          setShowScreenshot(true)
        }, 150)
      } else {
        // No screenshot for current URL, show search results
        setShowScreenshot(false)
      }
    } else {
      // Not scraping a specific URL, show search results
      setShowScreenshot(false)
      setCurrentScreenshot(null)
      setIsImageLoaded(false)
      setIsImageTall(false)
    }
  }, [currentUrl, screenshots, isActive])

  // Highlight results as they're being scraped
  useEffect(() => {
    if (currentUrl && results.length > 0) {
      const index = results.findIndex(r => r.url === currentUrl)
      setActiveResultIndex(index)
    } else {
      setActiveResultIndex(-1)
    }
  }, [currentUrl, results])

  const getUrlBarContent = () => {
    // Prioritize showing scraping URL when actively scraping
    if (currentUrl && isActive) {
      return {
        icon: <FileText className="h-4 w-4" />,
        text: currentUrl,
        action: 'scraping'
      }
    }
    // Show search query when we have results or are searching
    if (query && (results.length > 0 || isActive)) {
      return {
        icon: <Search className="h-4 w-4" />,
        text: `Searching: ${query}`,
        action: 'searching'
      }
    }
    // Default to search if we have a query
    if (query) {
      return {
        icon: <Search className="h-4 w-4" />,
        text: `Searching: ${query}`,
        action: isActive ? 'searching' : 'idle'
      }
    }
    return {
      icon: <Globe className="h-4 w-4" />,
      text: '',
      action: 'idle'
    }
  }

  const urlBar = getUrlBarContent()

  return (
    <div 
      ref={browserContainerRef}
      className={cn(
        "h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-500 relative",
        browserClosed && "opacity-0 scale-95 translate-x-full"
      )}
    >
      {/* Animated cursor - positioned inside the browser container */}
      {showClosingAnimation && closeButtonRef.current && browserContainerRef.current && (
        <AnimatedCursor
          targetX={closeButtonRef.current.getBoundingClientRect().left + closeButtonRef.current.offsetWidth / 2}
          targetY={closeButtonRef.current.getBoundingClientRect().top + closeButtonRef.current.offsetHeight / 2}
          containerRef={browserContainerRef as React.RefObject<HTMLElement>}
          onComplete={() => {
            setBrowserClosed(true)
            setTimeout(() => {
              onClose?.()
            }, 500) // Wait for browser close animation
          }}
          delay={500}
        />
      )}
      
      {/* Fake browser URL bar */}
      <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div 
              ref={closeButtonRef} 
              className={cn(
                "w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 cursor-pointer transition-all duration-300",
                showClosingAnimation && "animate-button-press"
              )}
            />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-700 rounded-md px-3 py-1 min-w-0">
            {urlBar.icon}
            <span className="text-sm text-gray-600 dark:text-gray-300 font-mono truncate flex-1 min-w-0">
              {urlBar.text}
            </span>
            {urlBar.action === 'searching' && (
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs text-blue-500 whitespace-nowrap">Searching...</span>
              </div>
            )}
            {urlBar.action === 'scraping' && (
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-xs text-orange-500 whitespace-nowrap">Scraping...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search results display */}
      <div className="flex-1 overflow-hidden relative">
        {(viewMode === 'search' && showScreenshot && currentScreenshot) ? (
          <div className="absolute inset-0 flex">
            <div className="relative flex-1 bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
              {/* Loading state for image */}
              {!isImageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-10">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading page...</p>
                  </div>
                </div>
              )}
              
              {/* Scrolling container for long screenshots */}
              <div className="absolute inset-0 overflow-hidden">
                <div className={cn(
                  "screenshot-scroll-container transition-opacity duration-500",
                  isImageTall && isImageLoaded && "animate-screenshot-scroll",
                  isImageLoaded ? "opacity-100" : "opacity-0"
                )}>
                  <img 
                    ref={screenshotRef}
                    src={currentScreenshot} 
                    alt="Screenshot" 
                    className={cn(
                      "w-full",
                      isImageTall ? "object-cover object-top" : "object-contain h-full"
                    )}
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      const containerHeight = img.parentElement?.parentElement?.clientHeight || 0;
                      const imageHeight = img.naturalHeight * (img.clientWidth / img.naturalWidth);
                      setIsImageTall(imageHeight > containerHeight * 1.5); // Image is tall if it's 1.5x the container height
                      
                      // Add a small delay to ensure smooth transition
                      setTimeout(() => {
                        setIsImageLoaded(true);
                      }, 100);
                    }}
                  />
                </div>
                {/* Fade gradients for smooth scrolling effect */}
                {isImageTall && isImageLoaded && (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white dark:from-gray-900 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
                  </>
                )}
              </div>
              {/* Scanner effect overlay - only show when image is loaded */}
              {isImageLoaded && (
                <div className="absolute inset-0 pointer-events-none animate-fade-in">
                  <div className="scanner-line" />
                  {/* Grid overlay effect */}
                  <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 40px,
                    rgba(251, 146, 60, 0.03) 40px,
                    rgba(251, 146, 60, 0.03) 41px
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 40px,
                    rgba(251, 146, 60, 0.03) 40px,
                    rgba(251, 146, 60, 0.03) 41px
                  )`
                }} />
                </div>
              )}
              {isImageLoaded && (
                <div className="absolute bottom-6 right-6 bg-white border-2 border-orange-500 text-orange-600 px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-up">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <span className="text-sm font-bold">Scanning page content</span>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'search' && !showScreenshot ? (
          <div className="h-full bg-white dark:bg-gray-900 flex flex-col">
            {/* Google-style search header - always show when we have results */}
            {(query || results.length > 0) && (
              <div className="border-b border-gray-200 dark:border-gray-700 px-3 lg:px-6 py-2 lg:py-3 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-3 lg:gap-8">
                  {/* Firecrawl logo */}
                  <img 
                    src="/firecrawl-logo-with-fire.png" 
                    alt="Firecrawl" 
                    className="h-6 lg:h-8 w-auto flex-shrink-0"
                  />
                  
                  {/* Search box */}
                  <div className="flex-1 max-w-[400px]">
                    <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full px-3 lg:px-5 py-2 lg:py-2.5 shadow-sm hover:shadow-md transition-shadow">
                      <span className="text-gray-700 dark:text-gray-300 flex-1 text-sm font-normal truncate">
                        <span className="lg:hidden">{query ? (query.length > 30 ? query.substring(0, 30) + '...' : query) : 'Search...'}</span>
                        <span className="hidden lg:inline">{query || 'Search...'}</span>
                      </span>
                      <div className="ml-2 lg:ml-3 p-1 flex-shrink-0">
                        <Search className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Search results in Google style */}
            <div className="flex-1 overflow-y-auto px-6">
              <div className="max-w-[500px] py-4">
                {/* Results count */}
                {query && results.length > 0 && !isActive && (
                  <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                    About {results.length} results
                  </div>
                )}

                {/* Search results */}
                <div className="space-y-6">
                {results.map((result, index) => {
                  const hostname = new URL(result.url).hostname
                  const urlPath = result.url.split('/').slice(3).filter(Boolean).join(' › ')
                  
                  return (
                    <div key={index} className="group">
                      {/* Site info - simple text without logo */}
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <cite className="not-italic">
                          {hostname}
                          {urlPath && <span> › {urlPath}</span>}
                        </cite>
                      </div>

                      {/* Title */}
                      <h3 className="mb-1">
                        <a 
                          href={result.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xl text-blue-700 dark:text-blue-400 hover:underline visited:text-purple-700 dark:visited:text-purple-400"
                        >
                          {result.title}
                        </a>
                      </h3>

                      {/* Date and description */}
                      <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {result.dateFound && (
                          <span className="text-gray-500 dark:text-gray-400">{result.dateFound} — </span>
                        )}
                        <span>{result.description}</span>
                      </div>

                      {/* Scraping indicator */}
                      {activeResultIndex === index && (
                        <div className="mt-2 inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400 border-2 border-dashed border-green-500 rounded px-3 py-1 animate-selection-pulse-green">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span>Analyzing this page...</span>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* No results message */}
                {results.length === 0 && query && !isActive && (
                  <div className="py-8">
                    <p className="text-base text-gray-700 dark:text-gray-300">
                      Your search - <span className="font-medium">{query}</span> - did not match any documents.
                    </p>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      <p className="font-medium mb-2">Suggestions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Make sure all words are spelled correctly.</li>
                        <li>Try different keywords.</li>
                        <li>Try more general keywords.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Loading state - removed to go directly to search results */}
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'screenshots' && !isActive ? (
          <div className="h-full overflow-hidden flex flex-col">
            {/* Screenshot viewer */}
            <div className="flex-1 bg-white dark:bg-gray-900 overflow-hidden">
              {screenshots.length > 0 && screenshots[selectedScreenshotIndex]?.screenshot ? (
                <img 
                  src={screenshots[selectedScreenshotIndex].screenshot} 
                  alt={`Screenshot from ${screenshots[selectedScreenshotIndex].url}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-500 dark:text-gray-400">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No screenshots available</p>
                </div>
              )}
            </div>
            
            {/* Screenshot thumbnails */}
            {screenshots.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="flex gap-2 overflow-x-auto">
                  {screenshots.map((screenshot, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedScreenshotIndex(index)}
                      className={cn(
                        "flex-shrink-0 relative rounded-lg overflow-hidden transition-all",
                        selectedScreenshotIndex === index
                          ? "ring-2 ring-orange-500 dark:ring-orange-400"
                          : "opacity-70 hover:opacity-100"
                      )}
                    >
                      <img 
                        src={screenshot.screenshot || ''} 
                        alt={`Thumbnail ${index + 1}`}
                        className="w-24 h-16 object-contain bg-gray-100 dark:bg-gray-800"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 truncate">
                        {new URL(screenshot.url).hostname}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}