interface QualificationStatusProps {
  qualification: {
    status: 'none' | 'active' | 'warning' | 'expired'
    message: string
  }
  lastRegularMeetingAt: string | null
}

/**
 * QualificationStatus - 정기모임 자격 상태
 */
export default function QualificationStatus({
  qualification,
  lastRegularMeetingAt,
}: QualificationStatusProps) {
  const bgColorMap = {
    active: 'bg-green-50',
    warning: 'bg-orange-50',
    expired: 'bg-red-50',
    none: 'bg-gray-50',
  }

  const dotColorMap = {
    active: 'bg-green-500',
    warning: 'bg-orange-500',
    expired: 'bg-red-500',
    none: 'bg-gray-400',
  }

  const textColorMap = {
    active: 'text-green-800',
    warning: 'text-orange-800',
    expired: 'text-red-800',
    none: 'text-gray-600',
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-text mb-4">정기모임 자격 상태</h3>
      <div className={`p-4 rounded-xl ${bgColorMap[qualification.status]}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${dotColorMap[qualification.status]}`} />
          <p className={`font-medium ${textColorMap[qualification.status]}`}>
            {qualification.message}
          </p>
        </div>
        {lastRegularMeetingAt && (
          <p className="text-xs text-gray-500 mt-2 ml-6">
            마지막 참여: {new Date(lastRegularMeetingAt).toLocaleDateString('ko-KR')}
          </p>
        )}
      </div>
    </div>
  )
}
