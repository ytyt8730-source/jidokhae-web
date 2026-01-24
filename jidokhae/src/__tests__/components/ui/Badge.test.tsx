/**
 * Badge 컴포넌트 테스트
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from '@/components/ui/Badge'

describe('Badge', () => {
  it('텍스트를 렌더링한다', () => {
    render(<Badge>테스트 배지</Badge>)

    expect(screen.getByText('테스트 배지')).toBeInTheDocument()
  })

  it('기본 variant를 적용한다', () => {
    render(<Badge>기본</Badge>)

    const badge = screen.getByText('기본')
    expect(badge).toHaveClass('bg-brand-50', 'text-brand-700')
  })

  it('success variant를 적용한다', () => {
    render(<Badge variant="success">성공</Badge>)

    const badge = screen.getByText('성공')
    expect(badge).toHaveClass('bg-green-50', 'text-success')
  })

  it('warning variant를 적용한다', () => {
    render(<Badge variant="warning">경고</Badge>)

    const badge = screen.getByText('경고')
    expect(badge).toHaveClass('bg-accent-100', 'text-accent-700')
  })

  it('urgent variant를 적용한다', () => {
    render(<Badge variant="urgent">마감임박</Badge>)

    const badge = screen.getByText('마감임박')
    expect(badge).toHaveClass('bg-accent-50', 'text-accent-500')
  })

  it('error variant를 적용한다', () => {
    render(<Badge variant="error">오류</Badge>)

    const badge = screen.getByText('오류')
    expect(badge).toHaveClass('bg-red-50', 'text-error')
  })

  it('info variant를 적용한다', () => {
    render(<Badge variant="info">정보</Badge>)

    const badge = screen.getByText('정보')
    expect(badge).toHaveClass('bg-blue-50', 'text-info')
  })

  it('brand variant를 적용한다', () => {
    render(<Badge variant="brand">브랜드</Badge>)

    const badge = screen.getByText('브랜드')
    expect(badge).toHaveClass('bg-brand-100', 'text-brand-800')
  })

  it('closed variant를 적용한다', () => {
    render(<Badge variant="closed">마감</Badge>)

    const badge = screen.getByText('마감')
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-400')
  })

  it('커스텀 className을 추가할 수 있다', () => {
    render(<Badge className="my-custom-class">커스텀</Badge>)

    const badge = screen.getByText('커스텀')
    expect(badge).toHaveClass('my-custom-class')
  })

  it('기본 스타일을 포함한다', () => {
    render(<Badge>스타일</Badge>)

    const badge = screen.getByText('스타일')
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'px-2.5',
      'py-1',
      'rounded-md',
      'text-xs',
      'font-medium'
    )
  })

  it('React 노드를 children으로 받을 수 있다', () => {
    render(
      <Badge>
        <span data-testid="inner-element">내부 요소</span>
      </Badge>
    )

    expect(screen.getByTestId('inner-element')).toBeInTheDocument()
  })
})
