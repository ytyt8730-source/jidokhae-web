'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'electric' | 'warm'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'electric',
  toggleTheme: () => {},
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('electric')

  useEffect(() => {
    // 클라이언트에서 저장된 테마 로드
    const saved = localStorage.getItem('jidokhae-theme') as Theme | null
    if (saved && (saved === 'electric' || saved === 'warm')) {
      setThemeState(saved)
      document.documentElement.setAttribute('data-theme', saved)
    } else {
      document.documentElement.setAttribute('data-theme', 'electric')
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('jidokhae-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setThemeState(prev => prev === 'electric' ? 'warm' : 'electric')
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
