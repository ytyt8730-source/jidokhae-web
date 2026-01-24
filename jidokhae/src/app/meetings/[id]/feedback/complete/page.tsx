/**
 * 참여 완료 확인 페이지
 * M4 소속감 - Phase 1
 */

import { Suspense } from 'react'
import FeedbackCompleteClient from './FeedbackCompleteClient'

export default function FeedbackCompletePage() {
  return (
    <Suspense fallback={<FeedbackCompleteFallback />}>
      <FeedbackCompleteClient />
    </Suspense>
  )
}

function FeedbackCompleteFallback() {
  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <div className="card p-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 animate-pulse mb-6" />
        <div className="h-8 bg-gray-100 rounded animate-pulse mb-2 w-32 mx-auto" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-48 mx-auto" />
      </div>
    </div>
  )
}
