import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { formatMeetingDate, formatFee } from '@/lib/utils'
import { getDday } from '@/lib/payment'
import type { Meeting, Registration, Waitlist } from '@/types/database'

interface RegistrationListProps {
  confirmedRegistrations: (Registration & { meetings: Meeting })[]
  pendingTransferRegistrations: (Registration & { meetings: Meeting })[]
  waitlists: (Waitlist & { meetings: Meeting })[]
  completedRegistrations: (Registration & { meetings: Meeting })[]
  cancelledRegistrations: (Registration & { meetings: Meeting })[]
}

/**
 * RegistrationList - 신청 내역 리스트
 */
export default function RegistrationList({
  confirmedRegistrations,
  pendingTransferRegistrations,
  waitlists,
  completedRegistrations,
  cancelledRegistrations,
}: RegistrationListProps) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold text-text mb-4">내 신청 모임</h3>

      {/* 확정된 신청 */}
      {confirmedRegistrations.length > 0 ? (
        <div className="space-y-3">
          {confirmedRegistrations.map((reg) => (
            <Link
              key={reg.id}
              href={`/meetings/${reg.meeting_id}`}
              className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="success">확정</Badge>
                    <span className="text-sm font-medium text-primary">
                      {getDday(reg.meetings.datetime)}
                    </span>
                  </div>
                  <h4 className="font-medium text-text truncate">{reg.meetings.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatMeetingDate(reg.meetings.datetime)}
                  </p>
                </div>
                <ArrowRight size={20} className="text-gray-400 flex-shrink-0 mt-1" strokeWidth={1.5} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-8">
          신청한 모임이 없습니다.
        </p>
      )}

      {/* 입금대기 */}
      {pendingTransferRegistrations.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">입금대기</h4>
          <div className="space-y-3">
            {pendingTransferRegistrations.map((reg) => (
              <Link
                key={reg.id}
                href={`/meetings/${reg.meeting_id}/transfer-pending`}
                className="block p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="warning">입금대기</Badge>
                      <span className="text-sm font-medium text-primary">
                        {getDday(reg.meetings.datetime)}
                      </span>
                    </div>
                    <h4 className="font-medium text-text truncate">{reg.meetings.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatMeetingDate(reg.meetings.datetime)}
                    </p>
                    <p className="text-xs text-yellow-700 mt-2">
                      입금 정보 확인하기 →
                    </p>
                  </div>
                  <ArrowRight size={20} className="text-gray-400 flex-shrink-0 mt-1" strokeWidth={1.5} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 대기 중 */}
      {waitlists.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">대기 중</h4>
          <div className="space-y-3">
            {waitlists.map((wl) => (
              <Link
                key={wl.id}
                href={`/meetings/${wl.meeting_id}`}
                className="block p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="info">대기 {wl.position}번째</Badge>
                    </div>
                    <h4 className="font-medium text-text truncate">{wl.meetings.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatMeetingDate(wl.meetings.datetime)}
                    </p>
                  </div>
                  <ArrowRight size={20} className="text-gray-400 flex-shrink-0 mt-1" strokeWidth={1.5} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 참여 완료 */}
      {completedRegistrations.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">참여 완료</h4>
          <div className="space-y-3">
            {completedRegistrations.slice(0, 5).map((reg) => (
              <div
                key={reg.id}
                className="p-4 bg-green-50 rounded-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="success">참여 완료</Badge>
                    </div>
                    <h4 className="font-medium text-text truncate">{reg.meetings.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatMeetingDate(reg.meetings.datetime)}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      href={`/meetings/${reg.meeting_id}/praise`}
                      className="text-xs text-primary hover:text-primary/80 px-2 py-1 bg-bg-surface rounded-lg border border-primary/20 hover:border-primary/30"
                    >
                      칭찬하기
                    </Link>
                    <Link
                      href={`/meetings/${reg.meeting_id}/feedback`}
                      className="text-xs text-gray-600 hover:text-gray-700 px-2 py-1 bg-bg-surface rounded-lg border border-gray-200 hover:border-gray-300"
                    >
                      후기 쓰기
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {completedRegistrations.length > 5 && (
              <p className="text-sm text-gray-500 text-center">
                외 {completedRegistrations.length - 5}개 모임
              </p>
            )}
          </div>
        </div>
      )}

      {/* 취소된 신청 */}
      {cancelledRegistrations.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-500 mb-3">취소된 신청</h4>
          <div className="space-y-2">
            {cancelledRegistrations.slice(0, 3).map((reg) => (
              <div
                key={reg.id}
                className="p-3 bg-gray-50 rounded-lg opacity-60"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="default">취소됨</Badge>
                  <span className="text-sm text-gray-600 truncate">{reg.meetings.title}</span>
                </div>
                {reg.refund_amount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    환불: {formatFee(reg.refund_amount)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
