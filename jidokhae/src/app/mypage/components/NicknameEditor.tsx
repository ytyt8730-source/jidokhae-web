'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X } from 'lucide-react'
import { useNicknameCheck } from '@/hooks/useNicknameCheck'

interface NicknameEditorProps {
  currentNickname: string
}

export default function NicknameEditor({ currentNickname }: NicknameEditorProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [nickname, setNickname] = useState(currentNickname)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { status: nicknameStatus, scheduleCheck, cancelCheck, setStatus } = useNicknameCheck({
    currentNickname,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 6)
    setNickname(value)
    setErrorMsg('')
    setSaveStatus('idle')
    scheduleCheck(value)
  }

  const handleStartEdit = () => {
    setIsEditing(true)
    setNickname(currentNickname)
    setStatus('idle')
    setSaveStatus('idle')
    setErrorMsg('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleCancel = () => {
    cancelCheck()
    setIsEditing(false)
    setNickname(currentNickname)
    setStatus('idle')
    setSaveStatus('idle')
    setErrorMsg('')
  }

  const handleSave = async () => {
    const trimmed = nickname.trim()
    if (trimmed === currentNickname) {
      setIsEditing(false)
      return
    }
    if (trimmed.length < 2 || trimmed.length > 6) {
      setErrorMsg('2~6자 사이로 입력해주세요.')
      return
    }
    if (nicknameStatus === 'taken') {
      setErrorMsg('이미 사용 중인 닉네임입니다.')
      return
    }

    setSaveStatus('saving')
    try {
      const res = await fetch('/api/users/nickname', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: trimmed }),
      })
      const data = await res.json()

      if (data.success && data.data?.success) {
        setIsEditing(false)
        router.refresh()
      } else {
        setErrorMsg(data.error?.message || '닉네임 변경에 실패했습니다.')
        setSaveStatus('error')
      }
    } catch {
      setErrorMsg('닉네임 변경 중 오류가 발생했습니다.')
      setSaveStatus('error')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  const isBusy = saveStatus === 'saving'

  if (!isEditing) {
    return (
      <button
        onClick={handleStartEdit}
        className="flex items-center gap-1.5 text-sm text-primary font-medium mt-0.5 group"
        aria-label={`닉네임 변경 (현재: ${currentNickname})`}
      >
        <span>{currentNickname}</span>
        <Pencil
          size={12}
          strokeWidth={1.5}
          className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      </button>
    )
  }

  return (
    <div className="mt-0.5">
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={nickname}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={6}
          aria-label="새 닉네임"
          aria-invalid={nicknameStatus === 'taken' || !!errorMsg}
          className="w-24 px-2 py-0.5 text-sm border border-primary/30 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={handleSave}
          disabled={isBusy || nicknameStatus === 'taken' || nickname.trim().length < 2}
          className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-40"
          aria-label="닉네임 저장"
        >
          <Check size={14} strokeWidth={1.5} />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-gray-400 hover:bg-gray-100 rounded"
          aria-label="닉네임 변경 취소"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>
      <div role="status" aria-live="polite">
        {nicknameStatus === 'checking' && <p className="text-xs text-gray-400 mt-0.5">확인 중...</p>}
        {nicknameStatus === 'available' && <p className="text-xs text-green-600 mt-0.5">사용 가능</p>}
        {nicknameStatus === 'taken' && <p className="text-xs text-red-500 mt-0.5">이미 사용 중</p>}
        {isBusy && <p className="text-xs text-gray-400 mt-0.5">저장 중...</p>}
        {errorMsg && <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>}
      </div>
    </div>
  )
}
