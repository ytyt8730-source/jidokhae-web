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
