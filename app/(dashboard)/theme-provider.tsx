'use client'

import { useEffect, useState } from 'react'

export function ThemeProvider({ 
  mode, 
  children 
}: { 
  mode: string
  children: React.ReactNode 
}) {
  const [isDark, setIsDark] = useState(mode === 'dark')

  useEffect(() => {
    if (mode === 'auto') {
      // Detect system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setIsDark(mediaQuery.matches)
      
      // Listen for system changes
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      setIsDark(mode === 'dark')
    }
  }, [mode])

  return (
    <div className={isDark ? 'dark' : ''}>
      {children}
    </div>
  )
}

