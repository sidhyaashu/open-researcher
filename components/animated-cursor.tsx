'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCursorProps {
  targetX: number
  targetY: number
  containerRef: React.RefObject<HTMLElement>
  onComplete?: () => void
  delay?: number
}

export function AnimatedCursor({ targetX, targetY, containerRef, onComplete, delay = 0 }: AnimatedCursorProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [isClicking, setIsClicking] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const calculatePosition = () => {
      const containerRect = containerRef.current!.getBoundingClientRect()
      // Start from center of the container
      const startX = containerRect.width / 2
      const startY = containerRect.height / 2

      setPosition({ x: startX, y: startY })
      setIsVisible(true)
      
      // Start animation after a brief pause
      setTimeout(() => {
        // Recalculate container position in case it moved
        const updatedContainerRect = containerRef.current!.getBoundingClientRect()
        // Move to target position relative to container
        const finalX = targetX - updatedContainerRect.left
        const finalY = targetY - updatedContainerRect.top
        setPosition({ x: finalX, y: finalY })
        
        // Trigger click animation when cursor reaches target
        setTimeout(() => {
          setIsClicking(true)
          
          // Call onComplete after click animation
          setTimeout(() => {
            onComplete?.()
          }, 300)
        }, 1500) // Duration of cursor movement
      }, 100)
    }

    const timer = setTimeout(calculatePosition, delay)

    return () => clearTimeout(timer)
  }, [targetX, targetY, containerRef, onComplete, delay])

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "absolute z-50 pointer-events-none transition-all duration-[1500ms] ease-out",
        isClicking && "scale-75"
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-2px, -2px)' // Slight offset for cursor tip
      }}
    >
      {/* Large Orange Cursor */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "transition-transform duration-300 drop-shadow-lg",
          isClicking && "scale-90"
        )}
      >
        <path
          d="M3 3L21 11.5L12.5 12.5L11.5 21L3 3Z"
          fill="#fb923c"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
      
      {/* Click ripple effect */}
      {isClicking && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-orange-400 animate-ping" />
        </div>
      )}
    </div>
  )
}