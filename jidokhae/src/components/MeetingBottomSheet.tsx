'use client'

/**
 * MeetingBottomSheet - Design System v3.3 (One-Page Architecture)
 *
 * 3-Click 결제 플로우:
 * 1. 카드 클릭 → Bottom Sheet 열림
 * 2. 내용 확인 (스크롤)
 * 3. CTA 클릭 → 결제 진행
 *
 * Design Note (Marcus Wei):
 * - Spring 애니메이션 (stiffness: 300, damping: 30)
 * - 드래그 제스처로 닫기 지원
 *
 * UX Note (Sarah Chen):
 * - 컨텍스트 유지하면서 모임 정보 표시
 * - Sticky CTA로 모바일 전환율 최적화
 */

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion'
import { X, Calendar, MapPin, Users, Medal, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import PaymentButton from '@/components/PaymentButton'
import WaitlistButton from '@/components/WaitlistButton'
import { KongIcon } from '@/components/icons/KongIcon'
import { formatMeetingDate, formatFee } from '@/lib/utils'
import type { MeetingWithStatus, User, RefundPolicy } from '@/types/database'

interface MeetingStatusData {
  alreadyRegistered: boolean
  registrationId: string | null
  userWaitlist: { id: string; position: number } | null
  refundPolicy: RefundPolicy | null
  publicReviews: { id: string; content: string }[]
}

interface MeetingBottomSheetProps {
  meeting: MeetingWithStatus | null
  user: User | null
  isOpen: boolean
  onClose: () => void
}

export default function MeetingBottomSheet({
  meeting,
  user,
  isOpen,
  onClose,
}: MeetingBottomSheetProps) {
  const dragControls = useDragControls()
  const [statusData, setStatusData] = useState<MeetingStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showRefundDetails, setShowRefundDetails] = useState(false)

  // ESC 키로 닫기
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  // 모임 상태 데이터 fetch
  useEffect(() => {
    if (!isOpen || !meeting) {
      setStatusData(null)
      return
    }

    const fetchStatus = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/meetings/${meeting.id}/status`)
        const data = await res.json()
        if (data.success) {
          setStatusData(data.data)
        }
      } catch (err) {
        console.error('Failed to fetch meeting status:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()
  }, [isOpen, meeting])

  // 이벤트 리스너 및 body overflow
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'

      // URL 파라미터 동기화
      if (meeting) {
        window.history.pushState(null, '', `?meeting=${meeting.id}`)
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown, meeting])

  // 닫을 때 URL 정리
  const handleClose = () => {
    window.history.pushState(null, '', window.location.pathname)
    onClose()
  }

  // 드래그 종료 시 처리
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100) {
      handleClose()
    }
  }

  if (!meeting) return null

  const getStatusBadge = () => {
    switch (meeting.displayStatus) {
      case 'closing_soon':
        return <Badge variant="warning">마감 임박</Badge>
      case 'closed':
        return <Badge variant="default">마감</Badge>
      case 'waitlist_available':
        return <Badge variant="info">대기 가능</Badge>
      default:
        return <Badge variant="success">모집중</Badge>
    }
  }

  const getMeetingTypeBadge = () => {
    const types: Record<string, { label: string; variant: 'brand' | 'info' | 'default' }> = {
      regular: { label: '정기모임', variant: 'brand' },
      discussion: { label: '토론모임', variant: 'info' },
      other: { label: '특별모임', variant: 'default' },
    }
    const type = types[meeting.meeting_type] || types.other
    return <Badge variant={type.variant}>{type.label}</Badge>
  }

  // 환불 규정
  const refundRules = statusData?.refundPolicy?.rules as { days_before: number; refund_percent: number }[] | undefined
  const mainRefundRule = refundRules?.[0]

  // CTA 표시 여부
  const alreadyRegistered = statusData?.alreadyRegistered ?? false
  const userWaitlist = statusData?.userWaitlist ?? null
  const showPaymentCTA = !alreadyRegistered && !userWaitlist && meeting.displayStatus !== 'closed'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-modal-overlay backdrop-blur-sm bg-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-modal flex flex-col rounded-t-3xl overflow-hidden bg-bg-surface"
            style={{ maxHeight: '90vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            role="dialog"
            aria-modal="true"
            aria-labelledby="meeting-sheet-title"
          >
            {/* Handle Bar */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div
                className="w-12 h-1.5 rounded-full bg-[var(--border)]"
                aria-hidden="true"
              />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-6 pb-4 border-b border-[var(--border)]">
              <div className="flex-1">
                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {meeting.isThisWeek && <Badge variant="success">이번 주</Badge>}
                  {getMeetingTypeBadge()}
                  {getStatusBadge()}
                </div>

                {/* Title */}
                <h2
                  id="meeting-sheet-title"
                  className="text-xl font-bold heading-themed text-text"
                >
                  {meeting.title}
                </h2>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="p-2 -mr-2 rounded-full hover:bg-[var(--bg-base)] transition-colors"
                aria-label="닫기"
              >
                <X size={24} strokeWidth={1.5} className="text-text-muted" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-text-muted" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Meta Info */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 text-text-muted">
                      <Calendar size={18} className="text-primary flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-sm">{formatMeetingDate(meeting.datetime)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-text-muted">
                      <MapPin size={18} className="text-primary flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-sm">{meeting.location}</span>
                    </div>
                    <div className="flex items-center gap-3 text-text">
                      <KongIcon size={18} />
                      <span className="text-sm font-medium">{formatFee(meeting.fee)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-text-muted">
                      <Users size={18} className="text-primary flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-sm">{meeting.current_participants}명 참여</span>
                    </div>
                  </div>

                  {/* Atmosphere Preview (신규회원용) */}
                  {user?.is_new_member && statusData?.publicReviews && statusData.publicReviews.length > 0 && (
                    <div className="p-4 bg-[var(--bg-base)] rounded-xl">
                      <h3 className="flex items-center gap-2 text-sm font-medium text-text mb-3">
                        지난 모임의 분위기
                      </h3>
                      <div className="space-y-2">
                        {statusData.publicReviews.slice(0, 3).map((review) => (
                          <p
                            key={review.id}
                            className="text-sm text-text-muted italic leading-relaxed"
                          >
                            &ldquo;{review.content.length > 60
                              ? `${review.content.slice(0, 60)}...`
                              : review.content}&rdquo;
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {meeting.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-text mb-2">모임 안내</h3>
                      <p className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed">
                        {meeting.description}
                      </p>
                    </div>
                  )}

                  {/* Refund Rules */}
                  {refundRules && refundRules.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
                        <Clock size={16} strokeWidth={1.5} />
                        환불 규정
                      </h3>

                      {/* Main Rule */}
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-text-muted">
                          <span className="font-medium text-primary">
                            {mainRefundRule?.days_before}일 전까지 {mainRefundRule?.refund_percent}% 환불
                          </span>
                        </p>

                        {refundRules.length > 1 && (
                          <button
                            onClick={() => setShowRefundDetails(!showRefundDetails)}
                            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors"
                          >
                            {showRefundDetails ? (
                              <>
                                접기
                                <ChevronUp size={12} strokeWidth={1.5} />
                              </>
                            ) : (
                              <>
                                자세히
                                <ChevronDown size={12} strokeWidth={1.5} />
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Detail Rules */}
                      <AnimatePresence>
                        {showRefundDetails && refundRules.length > 1 && (
                          <motion.ul
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-1 pl-1 overflow-hidden"
                          >
                            {refundRules.slice(1).map((rule, index) => (
                              <li key={index} className="text-xs text-text-muted">
                                • {rule.days_before === 0 ? '당일' : `${rule.days_before}일 전`}: {rule.refund_percent}% 환불
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* First Visit Banner (신규회원용) */}
                  {user?.is_new_member && showPaymentCTA && (
                    <div className="p-3 bg-primary/5 rounded-xl flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Medal size={24} strokeWidth={1.5} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">
                          첫 모임 신청 시 <span className="font-bold">웰컴 멤버</span> 배지가 지급됩니다!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky CTA */}
            <div className="sticky bottom-0 px-6 py-4 border-t border-[var(--border)] bg-bg-surface pb-safe-area-inset-bottom">
              {alreadyRegistered ? (
                <div>
                  <Button disabled className="w-full">
                    신청 완료
                  </Button>
                  <p className="text-xs text-primary mt-2 text-center">
                    이미 신청한 모임입니다. 마이페이지에서 확인하세요.
                  </p>
                </div>
              ) : userWaitlist ? (
                <div className="text-center">
                  <Badge variant="info" className="mb-2">대기 {userWaitlist.position}번째</Badge>
                  <p className="text-xs text-text-muted">마이페이지에서 대기 취소 가능합니다.</p>
                </div>
              ) : meeting.displayStatus === 'closed' ? (
                <Button disabled className="w-full">
                  마감되었습니다
                </Button>
              ) : meeting.displayStatus === 'waitlist_available' ? (
                <WaitlistButton
                  meeting={meeting}
                  user={user}
                  className="w-full"
                />
              ) : (
                <PaymentButton
                  meeting={meeting}
                  user={user}
                  className="w-full"
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
