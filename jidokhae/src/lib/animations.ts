import { Variants } from 'framer-motion'

/**
 * 공통 애니메이션 variants
 * PRD 디자인 시스템 사양에 따른 애니메이션 정의
 */

// 페이드인 + 슬라이드업
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
}

// 단순 페이드인
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
}

// 카드 리스트 Stagger 컨테이너 (100ms 간격)
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

// Stagger 자식 아이템 (아래→위 등장)
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
}

// 카드 호버/탭 애니메이션 (Y축 -4px, scale 0.98)
export const cardHoverTap = {
  hover: {
    y: -4,
    transition: {
      duration: 0.2,
      ease: 'easeOut' as const,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
}

// 마감 임박 뱃지 Pulse 애니메이션 (opacity 0.7~1, 1.5초 주기)
export const pulseAnimation: Variants = {
  pulse: {
    opacity: [1, 0.7, 1],
    transition: {
      duration: 1.5,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
}

// 모달 배경
export const overlayAnimation: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
}

// 모달 콘텐츠 (Spring 기반)
export const modalAnimation: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
    },
  },
}

// 버튼 호버/탭
export const buttonHoverTap = {
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
}

// 프로그레스 바 채워짐
export const progressFill: Variants = {
  hidden: {
    width: '0%',
  },
  visible: (percent: number) => ({
    width: `${percent}%`,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  }),
}

// 배지 획득 효과
export const badgeEarned: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.5,
    rotateY: -90,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotateY: 0,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 200,
    },
  },
}

// 스크롤 인터랙션용 - 섹션 페이드인
export const sectionFadeIn: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
}

// 스크롤 인터랙션용 - 왼쪽에서 슬라이드인
export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

// 스크롤 인터랙션용 - 오른쪽에서 슬라이드인
export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

// 갤러리용 stagger 컨테이너 (더 빠른 간격)
export const galleryStagger: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
}

// 갤러리 아이템
export const galleryItem: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

// 후기 카드용 stagger
export const reviewStagger: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

// 후기 카드 아이템
export const reviewItem: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

// ============================================
// M9: Ticket 관련 애니메이션
// ============================================

// 슬릿 등장 애니메이션 (화면 하단에서 올라옴)
export const ticketSlit: Variants = {
  hidden: {
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
}

// 티켓 인쇄 애니메이션 (위에서 아래로 내려오며 인쇄됨)
export const ticketPrinting: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
  },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: {
      duration: 2,
      ease: 'linear',
    },
  },
}

// Kong Idle 애니메이션 (살랑살랑 흔들림)
export const kongIdle: Variants = {
  idle: {
    rotate: [-3, 3, -3],
    y: [-1, 1, -1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// Kong 쏟아지는 애니메이션 컨테이너
export const kongPourContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

// Kong 개별 콩 떨어지는 애니메이션
export const kongPourItem: Variants = {
  hidden: {
    y: -50,
    opacity: 0,
    scale: 0.5,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  },
}

// 확정 도장 애니메이션
export const confirmStamp: Variants = {
  hidden: {
    scale: 3,
    opacity: 0,
    rotate: -15,
  },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25,
    },
  },
}

// 스텁 날아가는 애니메이션
export const stubFlyaway: Variants = {
  hidden: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
  },
  flyaway: {
    opacity: 0,
    x: 100,
    y: -100,
    scale: 0.5,
    rotate: 15,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
}

// ============================================
// Design System v3.3: Bottom Sheet 애니메이션
// ============================================

// Bottom Sheet 오버레이
export const bottomSheetOverlay: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
}

// Bottom Sheet 콘텐츠 (Spring 기반)
export const bottomSheetContent: Variants = {
  hidden: {
    y: '100%',
  },
  visible: {
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    y: '100%',
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

// ============================================
// Design System v3.3: Bento Grid 애니메이션
// ============================================

// Bento 카드 호버 효과
export const bentoCardHover = {
  hover: {
    y: -2,
    transition: {
      duration: 0.2,
      ease: 'easeOut' as const,
    },
  },
}

// Bento 그리드 stagger 컨테이너
export const bentoStagger: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}

// Bento 개별 카드 애니메이션
export const bentoItem: Variants = {
  hidden: {
    opacity: 0,
    y: 15,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

// ============================================
// Design System v3.3: Spring 기반 페이지 진입 애니메이션
// ============================================

/**
 * Spring 페이지 페이드인 (Yuki Tanaka: 물리 기반 자연스러운 모션)
 * - 페이지 전체 또는 주요 섹션의 진입 효과
 * - scale과 함께 사용하여 3D 느낌 부여
 */
export const springFadeIn: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
      mass: 0.8,
    },
  },
}

/**
 * Spring 카드 진입 (부드러운 탄성 효과)
 * - 개별 카드나 컨텐츠 블록에 사용
 */
export const springCard: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 150,
      damping: 15,
    },
  },
}

/**
 * Spring Stagger 컨테이너 (카드 리스트용)
 * - 자식 요소들이 순차적으로 Spring 애니메이션
 */
export const springStaggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

/**
 * Spring Stagger 아이템
 * - springStaggerContainer의 자식으로 사용
 */
export const springStaggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 180,
      damping: 18,
    },
  },
}

/**
 * Spring 섹션 진입 (더 큰 요소용)
 * - Hero 섹션이나 주요 컨텐츠 블록에 사용
 */
export const springSectionFadeIn: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 20,
      mass: 1,
    },
  },
}

/**
 * Spring 모달/Sheet 진입
 * - Bottom Sheet, Modal 등에 사용
 */
export const springModalEnter: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
}
