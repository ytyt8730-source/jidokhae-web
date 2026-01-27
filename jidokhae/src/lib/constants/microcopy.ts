/**
 * Micro-copy 상수 파일
 * 전체 서비스의 텍스트를 감성적 톤으로 통일
 *
 * 원칙:
 * - 따뜻하고 편안한 톤
 * - 명령조보다 제안/초대 느낌
 * - 부정적 상황도 긍정적으로 표현
 */

export const MICROCOPY = {
  // 버튼 텍스트
  buttons: {
    // 모임 관련
    register: '함께 읽기',
    cancel: '다음 기회에',
    waitlist: '다음 기회를 기다리기',
    viewDetails: '자세히 보기',
    goToMeeting: '모임 보러가기',

    // 인증 관련
    login: '돌아오기',
    signup: '함께하기',
    logout: '잠시 자리 비우기',

    // 프로필/활동 관련
    editProfile: '나를 소개하기',
    addBook: '책장에 꽂기',
    writeReview: '오늘의 기억 남기기',
    sendPraise: '마음 전하기',
    viewPraise: '받은 마음 보기',

    // 결제 관련
    pay: '자리 확보하기',
    confirmTransfer: '입금했어요',

    // 일반
    confirm: '확인',
    save: '저장하기',
    submit: '보내기',
    close: '닫기',
    retry: '다시 시도하기',
    goHome: '홈으로 돌아가기',
    goBack: '돌아가기',
  },

  // 상태 메시지
  status: {
    // 결제/신청 상태
    paymentComplete: '자리가 준비되었습니다',
    pendingPayment: '확인을 기다리는 중',
    confirmed: '함께하게 되었습니다',
    closed: '이번 자리는 마감되었습니다',
    cancelled: '다음에 꼭 만나요',

    // 대기 상태
    onWaitlist: '대기 중이에요',
    waitlistJoined: '대기 명단에 등록되었습니다',

    // 모임 상태
    meetingOpen: '신청 가능',
    meetingClosed: '마감',
    meetingAlmostFull: '마감임박',
    meetingCompleted: '모임 완료',

    // 로딩
    loading: '잠시만요',
    processing: '처리 중이에요',
  },

  // 에러 메시지
  errors: {
    generic: '잠시 문제가 생겼어요',
    network: '연결이 불안정해요. 다시 시도해주세요',
    validation: '이 부분을 채워주세요',
    unauthorized: '로그인이 필요해요',
    notFound: '찾을 수 없어요',
    serverError: '서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요',
    paymentFailed: '결제 중 문제가 생겼어요',
    alreadyRegistered: '이미 신청한 모임이에요',
    meetingFull: '아쉽게도 자리가 모두 찼어요',
  },

  // 폼 검증 메시지
  validation: {
    required: '이 부분을 채워주세요',
    email: '올바른 이메일 주소를 입력해주세요',
    phone: '올바른 전화번호를 입력해주세요',
    minLength: (min: number) => `${min}자 이상 입력해주세요`,
    maxLength: (max: number) => `${max}자 이하로 입력해주세요`,
    passwordMismatch: '비밀번호가 일치하지 않아요',
    invalidFormat: '형식이 맞지 않아요',
  },

  // 페이지 타이틀
  pages: {
    home: '지독해',
    mypage: '나의 지독해',
    notifications: '소식',
    meetings: '모임',
    bookshelf: '나의 책장',
    profile: '프로필',
    login: '돌아오기',
    signup: '함께하기',
    about: '지독해 소개',
  },

  // 빈 상태 메시지
  empty: {
    meetings: '아직 예정된 모임이 없어요',
    registrations: '아직 신청한 모임이 없어요',
    completedMeetings: '아직 완료된 모임이 없어요',
    books: '아직 책장이 비어있어요',
    praises: '아직 받은 마음이 없어요',
    notifications: '새로운 소식이 없어요',
  },

  // 확인/알림 메시지
  alerts: {
    cancelConfirm: '정말 다음 기회로 미룰까요?',
    logoutConfirm: '잠시 자리를 비울까요?',
    deleteConfirm: '정말 삭제할까요?',
    unsavedChanges: '저장하지 않은 내용이 있어요',

    // 성공 메시지
    saved: '저장되었습니다',
    deleted: '삭제되었습니다',
    sent: '전송되었습니다',
    copied: '복사되었습니다',

    // 환영 메시지
    welcomeBack: '다시 만나서 반가워요',
    welcomeNew: '지독해에 오신 것을 환영합니다',
  },

  // 칭찬 관련
  praise: {
    title: '마음 전하기',
    placeholder: '따뜻한 마음을 전해보세요',
    sent: '마음이 전달되었습니다',
    received: '누군가 마음을 전했어요',
  },

  // 배지 관련
  badges: {
    earned: '새로운 배지를 획득했어요!',
    viewAll: '모든 배지 보기',
  },

  // 티켓 관련 (M9 Phase 9.4)
  ticket: {
    save: '이미지로 저장',
    calendar: '캘린더에 추가',
    detail: '티켓 자세히 보기',
    upcoming: '예정된 모임',
    past: '지난 모임',
  },

  // 취소 관련 (M9 Phase 9.4)
  cancel: {
    // Bottom Sheet 타이틀
    title: '정말 다음 기회로 미룰까요?',

    // 긍정적 리마인더
    reminder: '이번 모임도 분명 좋은 시간이 될 거예요',
    reminderSub: '함께 읽고 이야기 나누는 시간은 언제나 소중하니까요',

    // 버튼
    thinkAgain: '조금 더 생각해볼게요',
    confirmCancel: '취소할게요',

    // 환불 규정 제목
    refundPolicy: '환불 규정 확인하기',

    // 완료 메시지
    complete: '다음에 꼭 만나요',
    completeSub: '언제든 다시 함께할 수 있어요. 다음 모임에서 뵙기를 기대할게요',
  },
} as const;

// 타입 export
export type MicrocopyButtons = keyof typeof MICROCOPY.buttons;
export type MicrocopyStatus = keyof typeof MICROCOPY.status;
export type MicrocopyErrors = keyof typeof MICROCOPY.errors;
