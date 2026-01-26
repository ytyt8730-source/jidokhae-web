# 사운드 파일 디렉토리

M8 Phase 8.3: Sound System을 위한 사운드 파일 저장 위치입니다.

## 필요한 사운드 파일

| 파일명 | 용도 | Duration |
|--------|------|----------|
| `beans-pour.mp3` | 콩 결제 시 | ~0.5s |
| `printer-whir.mp3` | 티켓 인쇄 | ~2.0s |
| `typewriter.mp3` | 타자 효과 | ~1.5s |
| `paper-tear.mp3` | 절취선/봉인 뜯기 | ~0.8s |
| `stamp-thud.mp3` | 도장 찍힘 | ~0.3s |
| `whoosh.mp3` | 전송 효과 | ~0.5s |

## 권장 사양

- 형식: MP3 (가장 넓은 브라우저 호환성)
- 비트레이트: 128kbps (용량 최적화)
- 채널: 모노 (스테레오 불필요)
- 샘플링: 44.1kHz

## 소스 추천

- [Freesound.org](https://freesound.org/) - 무료 ASMR 사운드
- [Pixabay](https://pixabay.com/sound-effects/) - 로열티 프리 효과음
- 직접 녹음: ASMR 느낌의 짧은 효과음

## 사용법

1. 위 파일들을 이 디렉토리에 추가
2. SoundManager가 자동으로 프리로드
3. `useFeedback` 훅으로 재생

```typescript
import { useFeedback } from '@/hooks/useFeedback'

function MyComponent() {
  const { feedback } = useFeedback()

  // 결제 완료 시
  feedback('payment') // beans + heavy haptic

  // 티켓 발권 시
  feedback('ticket') // printer + tick haptic
}
```

## 참고

- 사운드 파일이 없어도 앱은 정상 동작합니다
- 브라우저 정책에 따라 사용자 인터랙션 후에만 재생됩니다
- iOS Safari에서는 첫 터치 후에만 오디오 재생이 가능합니다
