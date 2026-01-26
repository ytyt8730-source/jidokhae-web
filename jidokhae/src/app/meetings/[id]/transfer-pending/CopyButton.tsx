'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  text: string
  label: string
  highlight?: boolean
}

export default function CopyButton({ text, label, highlight = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-lg transition-colors ${highlight
          ? 'bg-brand-50 hover:bg-brand-100'
          : 'bg-gray-100 hover:bg-gray-200'
        }`}
      title={`${label} 복사`}
    >
      {copied ? (
        <Check size={16} className="text-green-500" />
      ) : (
        <Copy size={16} className={highlight ? 'text-brand-600' : 'text-gray-500'} />
      )}
    </button>
  )
}
