/**
 * 솔라피 알림톡 어댑터
 * M3 알림시스템 - 솔라피 API 연동
 *
 * 추후 NHN Cloud 등으로 교체 가능하도록 NotificationService 인터페이스 구현
 */

import { createHmac, randomBytes } from 'crypto'
import { notificationLogger } from '@/lib/logger'
import type {
  NotificationService,
  AlimtalkParams,
  NotificationResult
} from './types'

// 솔라피 API 설정
const SOLAPI_API_URL = 'https://api.solapi.com'

// 환경 변수
const getConfig = () => ({
  apiKey: process.env.SOLAPI_API_KEY || '',
  apiSecret: process.env.SOLAPI_API_SECRET || '',
  sender: process.env.SOLAPI_SENDER || '',
  pfId: process.env.SOLAPI_KAKAO_PFID || '',
})

// 솔라피 API 인증 헤더 생성
function createAuthHeader(): string {
  const { apiKey, apiSecret } = getConfig()

  if (!apiKey || !apiSecret) {
    throw new Error('SOLAPI API credentials not configured')
  }

  const date = new Date().toISOString()
  const salt = randomBytes(32).toString('hex')
  const signature = createHmac('sha256', apiSecret)
    .update(date + salt)
    .digest('hex')

  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
}

// 전화번호 정규화 (010-1234-5678 -> 01012345678)
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

/**
 * 솔라피 어댑터 - NotificationService 인터페이스 구현
 */
export class SolapiAdapter implements NotificationService {
  private isConfigured(): boolean {
    const config = getConfig()
    return !!(config.apiKey && config.apiSecret && config.pfId)
  }

  /**
   * 단일 알림톡 발송
   */
  async sendAlimtalk(params: AlimtalkParams): Promise<NotificationResult> {
    const logger = params.userId
      ? notificationLogger.withUser(params.userId)
      : notificationLogger

    // 설정 확인
    if (!this.isConfigured()) {
      logger.warn('solapi_not_configured', {
        templateCode: params.templateCode,
      })
      // 개발 환경에서는 성공으로 처리 (실제 발송 안 함)
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          messageId: `dev_${Date.now()}`,
        }
      }
      return {
        success: false,
        error: 'Solapi not configured',
        errorCode: 'NOT_CONFIGURED',
      }
    }

    const config = getConfig()
    const phone = normalizePhone(params.phone)

    try {
      const response = await fetch(`${SOLAPI_API_URL}/messages/v4/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': createAuthHeader(),
        },
        body: JSON.stringify({
          message: {
            to: phone,
            from: config.sender,
            kakaoOptions: {
              pfId: config.pfId,
              templateId: params.templateCode,
              variables: params.variables,
            },
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        logger.error('solapi_send_failed', {
          templateCode: params.templateCode,
          phone: phone.slice(0, 7) + '****', // 개인정보 마스킹
          status: response.status,
          error: data,
        })
        return {
          success: false,
          error: data.errorMessage || 'Failed to send alimtalk',
          errorCode: data.errorCode,
        }
      }

      const messageId = data.groupId || data.messageId || `msg_${Date.now()}`

      logger.info('solapi_send_success', {
        templateCode: params.templateCode,
        messageId,
      })

      return {
        success: true,
        messageId,
      }
    } catch (error) {
      logger.error('solapi_send_error', {
        templateCode: params.templateCode,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'NETWORK_ERROR',
      }
    }
  }

  /**
   * 대량 알림톡 발송
   */
  async sendBulkAlimtalk(paramsList: AlimtalkParams[]): Promise<NotificationResult[]> {
    // 병렬 발송 (동시 10건 제한)
    const results: NotificationResult[] = []
    const batchSize = 10

    for (let i = 0; i < paramsList.length; i += batchSize) {
      const batch = paramsList.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(params => this.sendAlimtalk(params))
      )
      results.push(...batchResults)
    }

    return results
  }
}

/**
 * 개발용 Mock 어댑터
 * 실제 발송 없이 로그만 기록
 */
export class MockNotificationAdapter implements NotificationService {
  async sendAlimtalk(params: AlimtalkParams): Promise<NotificationResult> {
    notificationLogger.info('mock_alimtalk_send', {
      templateCode: params.templateCode,
      phone: params.phone.slice(0, 7) + '****',
      variables: params.variables,
      userId: params.userId,
      meetingId: params.meetingId,
    })

    // 항상 성공 반환
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    }
  }

  async sendBulkAlimtalk(paramsList: AlimtalkParams[]): Promise<NotificationResult[]> {
    return Promise.all(paramsList.map(params => this.sendAlimtalk(params)))
  }
}
