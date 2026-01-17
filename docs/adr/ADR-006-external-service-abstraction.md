# ADR-006: 외부 서비스 추상화

## 상태
✅ 결정됨

## 날짜
2026-01-14

## 맥락

- 알림톡: 솔라피 → NHN Cloud 전환 가능성
- 결제: 포트원 통해 카카오페이/토스 등 PG 교체 가능성
- 외부 서비스 장애 시 빠른 대응 필요

## 고려한 대안

### 대안 1: 직접 호출 (No Abstraction)
- 장점: 단순함
- 단점: 교체 시 전체 코드 수정 필요

### 대안 2: 인터페이스 기반 추상화 (선택)
- 장점: 30분 내 서비스 교체 가능
- 단점: 초기 설계 비용

## 결정

**핵심 외부 서비스는 인터페이스로 추상화**

### 알림 서비스 추상화

```typescript
// lib/services/notification/types.ts
interface NotificationProvider {
  sendKakaoTalk(params: {
    phoneNumber: string
    templateCode: string
    variables: Record<string, string>
  }): Promise<NotificationResult>
  
  sendSMS(params: {
    phoneNumber: string
    message: string
  }): Promise<NotificationResult>
}

interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

// lib/services/notification/solapi.ts
export class SolapiProvider implements NotificationProvider {
  async sendKakaoTalk(params) { ... }
  async sendSMS(params) { ... }
}

// lib/services/notification/nhn.ts (추후)
export class NHNProvider implements NotificationProvider {
  async sendKakaoTalk(params) { ... }
  async sendSMS(params) { ... }
}

// lib/services/notification/index.ts
import { SolapiProvider } from './solapi'

const provider = process.env.NOTIFICATION_PROVIDER === 'nhn'
  ? new NHNProvider()
  : new SolapiProvider()

export const notification = provider
```

### 결제 서비스 추상화

```typescript
// lib/services/payment/types.ts
interface PaymentProvider {
  preparePayment(params: PrepareParams): Promise<PrepareResult>
  verifyPayment(paymentId: string): Promise<VerifyResult>
  refund(params: RefundParams): Promise<RefundResult>
}

// lib/services/payment/portone.ts
export class PortoneProvider implements PaymentProvider {
  async preparePayment(params) { ... }
  async verifyPayment(paymentId) { ... }
  async refund(params) { ... }
}
```

### 웹훅 시그니처 검증

```typescript
// lib/services/payment/portone.ts
export function verifyWebhookSignature(
  signature: string,
  body: string
): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.PORTONE_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')
  return signature === expected
}
```

### 폴더 구조

```
lib/services/
├── notification/
│   ├── types.ts          # 인터페이스 정의
│   ├── solapi.ts         # 솔라피 구현
│   ├── nhn.ts            # NHN 구현 (추후)
│   └── index.ts          # 프로바이더 선택
├── payment/
│   ├── types.ts
│   ├── portone.ts
│   └── index.ts
└── index.ts              # 통합 export
```

## 결과

### 긍정적 영향
- 서비스 교체 시 구현체만 변경
- 테스트 시 Mock 주입 용이
- 장애 시 빠른 대체 가능

### 주의사항
- 인터페이스는 미리 충분히 설계
- 환경 변수로 프로바이더 선택

---

## 관련 파일
- `/src/lib/services/notification/`
- `/src/lib/services/payment/`

