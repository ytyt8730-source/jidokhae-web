/**
 * 사운드 매니저
 * M8 Phase 8.3: Sound System
 *
 * ASMR 피드백 사운드 시스템 - 브라우저 Audio API 기반
 */

// 사운드 ID 타입
export type SoundId = 'beans' | 'printer' | 'typewriter' | 'tear' | 'stamp' | 'whoosh'

// 사운드 설정 키
const SOUND_ENABLED_KEY = 'jidokhae_sound_enabled'

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private enabled: boolean = true
  private initialized: boolean = false

  constructor() {
    // 서버사이드에서는 초기화하지 않음
    if (typeof window === 'undefined') return

    // 로컬스토리지에서 설정 로드
    const stored = localStorage.getItem(SOUND_ENABLED_KEY)
    this.enabled = stored !== 'false'
  }

  /**
   * 사운드 파일 미리 로드
   */
  preload(soundId: SoundId, path: string): void {
    if (typeof window === 'undefined') return

    try {
      const audio = new Audio(path)
      audio.preload = 'auto'
      audio.volume = 0.5 // 기본 볼륨 50%
      this.sounds.set(soundId, audio)
    } catch (error) {
      // 오디오 로드 실패 시 무시 (개발 환경 등)
      console.debug(`Sound preload failed: ${soundId}`, error)
    }
  }

  /**
   * 사운드 재생
   */
  play(soundId: SoundId): void {
    if (typeof window === 'undefined') return
    if (!this.enabled) return

    const audio = this.sounds.get(soundId)
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(() => {
        // 사용자 인터랙션 없이 재생 시도 시 실패할 수 있음 (브라우저 정책)
      })
    }
  }

  /**
   * 사운드 on/off 설정
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem(SOUND_ENABLED_KEY, String(enabled))
    }
  }

  /**
   * 현재 사운드 설정 상태
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * 볼륨 설정 (0-1)
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    this.sounds.forEach((audio) => {
      audio.volume = clampedVolume
    })
  }

  /**
   * 모든 사운드 초기화
   */
  initialize(): void {
    if (this.initialized) return
    if (typeof window === 'undefined') return

    // 사운드 파일 프리로드
    // 참고: 실제 사운드 파일이 없으면 무시됨
    this.preload('beans', '/sounds/beans-pour.mp3')
    this.preload('printer', '/sounds/printer-whir.mp3')
    this.preload('typewriter', '/sounds/typewriter.mp3')
    this.preload('tear', '/sounds/paper-tear.mp3')
    this.preload('stamp', '/sounds/stamp-thud.mp3')
    this.preload('whoosh', '/sounds/whoosh.mp3')

    this.initialized = true
  }
}

// 싱글톤 인스턴스
export const soundManager = new SoundManager()

// 사운드 파일 목록 (관리용)
export const SOUND_FILES: Record<SoundId, { path: string; description: string; duration: string }> = {
  beans: { path: '/sounds/beans-pour.mp3', description: '콩 결제 시', duration: '~0.5s' },
  printer: { path: '/sounds/printer-whir.mp3', description: '티켓 인쇄', duration: '~2.0s' },
  typewriter: { path: '/sounds/typewriter.mp3', description: '타자 효과', duration: '~1.5s' },
  tear: { path: '/sounds/paper-tear.mp3', description: '절취선/봉인 뜯기', duration: '~0.8s' },
  stamp: { path: '/sounds/stamp-thud.mp3', description: '도장 찍힘', duration: '~0.3s' },
  whoosh: { path: '/sounds/whoosh.mp3', description: '전송 효과', duration: '~0.5s' },
}
