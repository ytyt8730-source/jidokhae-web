'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
  children: ReactNode
}

/**
 * Portal - document.body에 렌더링하여 stacking context 탈출
 *
 * backdrop-filter, transform 등이 있는 부모 내부에서
 * position: fixed가 viewport 기준으로 동작하지 않는 문제를 해결.
 */
export default function Portal({ children }: PortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(children, document.body)
}
