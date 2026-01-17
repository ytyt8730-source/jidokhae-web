/**
 * 칭찬하기 관련 상수 및 유틸
 * M4 소속감 - Phase 2
 */

// 칭찬 문구 5개
export const PRAISE_PHRASES = [
  { id: 'good_time', text: '덕분에 좋은 시간이었어요' },
  { id: 'impressive_story', text: '이야기가 인상 깊었어요' },
  { id: 'warm_atmosphere', text: '따뜻한 분위기를 만들어주셨어요' },
  { id: 'new_perspective', text: '새로운 관점을 얻었어요' },
  { id: 'want_to_meet_again', text: '다음에도 함께하고 싶어요' },
] as const

export type PraisePhrase = typeof PRAISE_PHRASES[number]['id']

// 칭찬 문구 ID로 텍스트 가져오기
export function getPraiseText(phraseId: string): string | undefined {
  return PRAISE_PHRASES.find(p => p.id === phraseId)?.text
}

// 유효한 칭찬 문구 ID인지 확인
export function isValidPhraseId(phraseId: string): phraseId is PraisePhrase {
  return PRAISE_PHRASES.some(p => p.id === phraseId)
}
