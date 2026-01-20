import TransfersClient from './TransfersClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '입금 확인 - 지독해 관리자',
}

export default function AdminTransfersPage() {
  return <TransfersClient />
}
