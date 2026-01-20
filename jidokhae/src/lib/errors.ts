/**
 * 에러 코드 체계
 * 
 * 1xxx: 인증 관련
 * 2xxx: 결제 관련
 * 3xxx: 외부 서비스
 * 4xxx: 비즈니스 로직
 * 5xxx: 시스템 에러
 */
export enum ErrorCode {
  // =============================================
  // 인증 (1xxx)
  // =============================================
  AUTH_INVALID_TOKEN = 1001,
  AUTH_SESSION_EXPIRED = 1002,
  AUTH_UNAUTHORIZED = 1003,
  AUTH_INVALID_CREDENTIALS = 1004,
  AUTH_USER_NOT_FOUND = 1005,
  AUTH_EMAIL_ALREADY_EXISTS = 1006,
  AUTH_WEAK_PASSWORD = 1007,
  AUTH_EMAIL_NOT_VERIFIED = 1008,
  AUTH_FORBIDDEN = 1009,

  // =============================================
  // 결제 (2xxx)
  // =============================================
  PAYMENT_FAILED = 2001,
  PAYMENT_WEBHOOK_INVALID = 2002,
  PAYMENT_WEBHOOK_SIGNATURE_MISMATCH = 2003,
  PAYMENT_ALREADY_PROCESSED = 2004,
  PAYMENT_AMOUNT_MISMATCH = 2005,
  REFUND_NOT_ELIGIBLE = 2006,
  REFUND_ALREADY_PROCESSED = 2007,
  REFUND_AMOUNT_EXCEEDED = 2008,

  // 계좌이체 (21xx)
  TRANSFER_DEADLINE_EXPIRED = 2101,
  TRANSFER_ALREADY_CONFIRMED = 2102,
  TRANSFER_SENDER_NAME_MISMATCH = 2103,
  TRANSFER_NOT_FOUND = 2104,
  TRANSFER_INVALID_REFUND_ACCOUNT = 2105,

  // =============================================
  // 외부 서비스 (3xxx)
  // =============================================
  EXTERNAL_API_TIMEOUT = 3001,
  EXTERNAL_API_ERROR = 3002,
  NOTIFICATION_SEND_FAILED = 3003,
  NOTIFICATION_TEMPLATE_NOT_FOUND = 3004,
  KAKAO_AUTH_FAILED = 3005,

  // =============================================
  // 비즈니스 로직 - 모임 (4xxx)
  // =============================================
  MEETING_NOT_FOUND = 4001,
  MEETING_CLOSED = 4002,
  MEETING_CANCELLED = 4003,
  CAPACITY_EXCEEDED = 4004,
  CAPACITY_RACE_CONDITION = 4005,

  // 비즈니스 로직 - 신청 (41xx)
  REGISTRATION_NOT_FOUND = 4101,
  REGISTRATION_ALREADY_EXISTS = 4102,
  REGISTRATION_ALREADY_CANCELLED = 4103,
  REGISTRATION_CANNOT_CANCEL = 4104,

  // 비즈니스 로직 - 대기 (42xx)
  WAITLIST_NOT_FOUND = 4201,
  WAITLIST_ALREADY_EXISTS = 4202,
  WAITLIST_EXPIRED = 4203,

  // 비즈니스 로직 - 자격 (43xx)
  ELIGIBILITY_NOT_MET = 4301,
  ELIGIBILITY_EXPIRED = 4302,

  // 비즈니스 로직 - 칭찬 (44xx)
  PRAISE_DUPLICATE_MEETING = 4401,
  PRAISE_DUPLICATE_PERSON = 4402,
  PRAISE_SELF_NOT_ALLOWED = 4403,

  // 비즈니스 로직 - 참여 완료 (45xx)
  PARTICIPATION_ALREADY_COMPLETED = 4501,
  PARTICIPATION_NO_SHOW = 4502,
  PARTICIPATION_INVALID_METHOD = 4503,

  // =============================================
  // 시스템 (5xxx)
  // =============================================
  INTERNAL_ERROR = 5001,
  DATABASE_ERROR = 5002,
  VALIDATION_ERROR = 5003,
  NOT_FOUND = 5004,
  METHOD_NOT_ALLOWED = 5005,
  RATE_LIMIT_EXCEEDED = 5006,
}

/**
 * 사용자에게 보여줄 에러 메시지
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // 인증
  [ErrorCode.AUTH_INVALID_TOKEN]: '유효하지 않은 인증 정보입니다.',
  [ErrorCode.AUTH_SESSION_EXPIRED]: '세션이 만료되었습니다. 다시 로그인해주세요.',
  [ErrorCode.AUTH_UNAUTHORIZED]: '접근 권한이 없습니다.',
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: '이메일 또는 비밀번호가 올바르지 않습니다.',
  [ErrorCode.AUTH_USER_NOT_FOUND]: '존재하지 않는 사용자입니다.',
  [ErrorCode.AUTH_EMAIL_ALREADY_EXISTS]: '이미 가입된 이메일입니다.',
  [ErrorCode.AUTH_WEAK_PASSWORD]: '비밀번호가 너무 약합니다.',
  [ErrorCode.AUTH_EMAIL_NOT_VERIFIED]: '이메일 인증이 필요합니다.',
  [ErrorCode.AUTH_FORBIDDEN]: '해당 기능에 대한 권한이 없습니다.',

  // 결제
  [ErrorCode.PAYMENT_FAILED]: '결제에 실패했습니다. 다시 시도해주세요.',
  [ErrorCode.PAYMENT_WEBHOOK_INVALID]: '결제 검증에 실패했습니다.',
  [ErrorCode.PAYMENT_WEBHOOK_SIGNATURE_MISMATCH]: '결제 검증에 실패했습니다.',
  [ErrorCode.PAYMENT_ALREADY_PROCESSED]: '이미 처리된 결제입니다.',
  [ErrorCode.PAYMENT_AMOUNT_MISMATCH]: '결제 금액이 일치하지 않습니다.',
  [ErrorCode.REFUND_NOT_ELIGIBLE]: '환불이 불가능합니다.',
  [ErrorCode.REFUND_ALREADY_PROCESSED]: '이미 환불 처리되었습니다.',
  [ErrorCode.REFUND_AMOUNT_EXCEEDED]: '환불 금액이 결제 금액을 초과합니다.',

  // 계좌이체
  [ErrorCode.TRANSFER_DEADLINE_EXPIRED]: '입금 기한이 만료되었습니다.',
  [ErrorCode.TRANSFER_ALREADY_CONFIRMED]: '이미 입금 확인된 건입니다.',
  [ErrorCode.TRANSFER_SENDER_NAME_MISMATCH]: '입금자명이 일치하지 않습니다.',
  [ErrorCode.TRANSFER_NOT_FOUND]: '계좌이체 신청 내역을 찾을 수 없습니다.',
  [ErrorCode.TRANSFER_INVALID_REFUND_ACCOUNT]: '환불 계좌 정보가 올바르지 않습니다.',

  // 외부 서비스
  [ErrorCode.EXTERNAL_API_TIMEOUT]: '외부 서비스 응답이 지연되고 있습니다.',
  [ErrorCode.EXTERNAL_API_ERROR]: '외부 서비스 오류가 발생했습니다.',
  [ErrorCode.NOTIFICATION_SEND_FAILED]: '알림 발송에 실패했습니다.',
  [ErrorCode.NOTIFICATION_TEMPLATE_NOT_FOUND]: '알림 템플릿을 찾을 수 없습니다.',
  [ErrorCode.KAKAO_AUTH_FAILED]: '카카오 로그인에 실패했습니다.',

  // 비즈니스 로직 - 모임
  [ErrorCode.MEETING_NOT_FOUND]: '모임을 찾을 수 없습니다.',
  [ErrorCode.MEETING_CLOSED]: '마감된 모임입니다.',
  [ErrorCode.MEETING_CANCELLED]: '취소된 모임입니다.',
  [ErrorCode.CAPACITY_EXCEEDED]: '죄송합니다. 정원이 마감되었어요.',
  [ErrorCode.CAPACITY_RACE_CONDITION]: '다른 분이 먼저 신청했어요. 다시 시도해주세요.',

  // 비즈니스 로직 - 신청
  [ErrorCode.REGISTRATION_NOT_FOUND]: '신청 내역을 찾을 수 없습니다.',
  [ErrorCode.REGISTRATION_ALREADY_EXISTS]: '이미 신청한 모임입니다.',
  [ErrorCode.REGISTRATION_ALREADY_CANCELLED]: '이미 취소된 신청입니다.',
  [ErrorCode.REGISTRATION_CANNOT_CANCEL]: '취소할 수 없는 신청입니다.',

  // 비즈니스 로직 - 대기
  [ErrorCode.WAITLIST_NOT_FOUND]: '대기 내역을 찾을 수 없습니다.',
  [ErrorCode.WAITLIST_ALREADY_EXISTS]: '이미 대기 중입니다.',
  [ErrorCode.WAITLIST_EXPIRED]: '대기 시간이 만료되었습니다.',

  // 비즈니스 로직 - 자격
  [ErrorCode.ELIGIBILITY_NOT_MET]: '정기모임 참여 자격이 필요합니다.',
  [ErrorCode.ELIGIBILITY_EXPIRED]: '정기모임 참여 자격이 만료되었습니다.',

  // 비즈니스 로직 - 칭찬
  [ErrorCode.PRAISE_DUPLICATE_MEETING]: '이 모임에서 이미 칭찬했습니다.',
  [ErrorCode.PRAISE_DUPLICATE_PERSON]: '같은 분에게 3개월 내 칭찬은 1번만 가능해요.',
  [ErrorCode.PRAISE_SELF_NOT_ALLOWED]: '본인은 칭찬할 수 없습니다.',

  // 비즈니스 로직 - 참여 완료
  [ErrorCode.PARTICIPATION_ALREADY_COMPLETED]: '이미 참여 완료된 모임입니다.',
  [ErrorCode.PARTICIPATION_NO_SHOW]: '미참여 처리된 모임입니다.',
  [ErrorCode.PARTICIPATION_INVALID_METHOD]: '올바르지 않은 참여 완료 방법입니다.',

  // 시스템
  [ErrorCode.INTERNAL_ERROR]: '서버 오류가 발생했습니다.',
  [ErrorCode.DATABASE_ERROR]: '데이터 처리 중 오류가 발생했습니다.',
  [ErrorCode.VALIDATION_ERROR]: '입력 값이 올바르지 않습니다.',
  [ErrorCode.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ErrorCode.METHOD_NOT_ALLOWED]: '허용되지 않은 요청입니다.',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.',
}

/**
 * HTTP 상태 코드 매핑
 */
export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = {
  // 인증 -> 401, 403
  [ErrorCode.AUTH_INVALID_TOKEN]: 401,
  [ErrorCode.AUTH_SESSION_EXPIRED]: 401,
  [ErrorCode.AUTH_UNAUTHORIZED]: 403,
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCode.AUTH_USER_NOT_FOUND]: 404,
  [ErrorCode.AUTH_EMAIL_ALREADY_EXISTS]: 409,
  [ErrorCode.AUTH_WEAK_PASSWORD]: 400,
  [ErrorCode.AUTH_EMAIL_NOT_VERIFIED]: 403,
  [ErrorCode.AUTH_FORBIDDEN]: 403,

  // 결제 -> 400, 409
  [ErrorCode.PAYMENT_FAILED]: 400,
  [ErrorCode.PAYMENT_WEBHOOK_INVALID]: 400,
  [ErrorCode.PAYMENT_WEBHOOK_SIGNATURE_MISMATCH]: 400,
  [ErrorCode.PAYMENT_ALREADY_PROCESSED]: 409,
  [ErrorCode.PAYMENT_AMOUNT_MISMATCH]: 400,
  [ErrorCode.REFUND_NOT_ELIGIBLE]: 400,
  [ErrorCode.REFUND_ALREADY_PROCESSED]: 409,
  [ErrorCode.REFUND_AMOUNT_EXCEEDED]: 400,

  // 계좌이체
  [ErrorCode.TRANSFER_DEADLINE_EXPIRED]: 400,
  [ErrorCode.TRANSFER_ALREADY_CONFIRMED]: 409,
  [ErrorCode.TRANSFER_SENDER_NAME_MISMATCH]: 400,
  [ErrorCode.TRANSFER_NOT_FOUND]: 404,
  [ErrorCode.TRANSFER_INVALID_REFUND_ACCOUNT]: 400,

  // 외부 서비스 -> 502, 503
  [ErrorCode.EXTERNAL_API_TIMEOUT]: 504,
  [ErrorCode.EXTERNAL_API_ERROR]: 502,
  [ErrorCode.NOTIFICATION_SEND_FAILED]: 502,
  [ErrorCode.NOTIFICATION_TEMPLATE_NOT_FOUND]: 404,
  [ErrorCode.KAKAO_AUTH_FAILED]: 502,

  // 비즈니스 로직 -> 400, 404, 409
  [ErrorCode.MEETING_NOT_FOUND]: 404,
  [ErrorCode.MEETING_CLOSED]: 400,
  [ErrorCode.MEETING_CANCELLED]: 400,
  [ErrorCode.CAPACITY_EXCEEDED]: 409,
  [ErrorCode.CAPACITY_RACE_CONDITION]: 409,

  [ErrorCode.REGISTRATION_NOT_FOUND]: 404,
  [ErrorCode.REGISTRATION_ALREADY_EXISTS]: 409,
  [ErrorCode.REGISTRATION_ALREADY_CANCELLED]: 400,
  [ErrorCode.REGISTRATION_CANNOT_CANCEL]: 400,

  [ErrorCode.WAITLIST_NOT_FOUND]: 404,
  [ErrorCode.WAITLIST_ALREADY_EXISTS]: 409,
  [ErrorCode.WAITLIST_EXPIRED]: 400,

  [ErrorCode.ELIGIBILITY_NOT_MET]: 403,
  [ErrorCode.ELIGIBILITY_EXPIRED]: 403,

  [ErrorCode.PRAISE_DUPLICATE_MEETING]: 409,
  [ErrorCode.PRAISE_DUPLICATE_PERSON]: 409,
  [ErrorCode.PRAISE_SELF_NOT_ALLOWED]: 400,

  [ErrorCode.PARTICIPATION_ALREADY_COMPLETED]: 409,
  [ErrorCode.PARTICIPATION_NO_SHOW]: 400,
  [ErrorCode.PARTICIPATION_INVALID_METHOD]: 400,

  // 시스템 -> 500
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.METHOD_NOT_ALLOWED]: 405,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
}

/**
 * 커스텀 에러 클래스
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly httpStatus: number
  public readonly details?: unknown

  constructor(code: ErrorCode, details?: unknown) {
    super(ERROR_MESSAGES[code])
    this.name = 'AppError'
    this.code = code
    this.httpStatus = ERROR_HTTP_STATUS[code]
    this.details = details
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    }
  }
}

/**
 * 에러 생성 헬퍼 함수
 */
export function createError(code: ErrorCode, details?: unknown): AppError {
  return new AppError(code, details)
}

/**
 * 알 수 없는 에러를 AppError로 변환
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(ErrorCode.INTERNAL_ERROR, {
      originalMessage: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }

  return new AppError(ErrorCode.INTERNAL_ERROR, { error })
}

