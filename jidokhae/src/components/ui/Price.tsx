import { KongIcon } from '@/components/icons/KongIcon'

interface PriceProps {
  amount: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showUnit?: boolean
}

const sizeConfig = {
  sm: { text: 'text-xs', icon: 12 },
  md: { text: 'text-sm', icon: 16 },
  lg: { text: 'text-base', icon: 20 },
}

/**
 * 가격 표시 컴포넌트
 * 콩 아이콘 + 금액 형식으로 표시
 *
 * @example
 * <Price amount={5000} />  // [콩아이콘] 5,000콩
 * <Price amount={5000} showUnit={false} />  // [콩아이콘] 5,000
 */
export function Price({
  amount,
  className = '',
  size = 'md',
  showUnit = true
}: PriceProps) {
  const config = sizeConfig[size]

  return (
    <span className={`inline-flex items-center gap-1 font-bold ${config.text} ${className}`}>
      <KongIcon size={config.icon} />
      <span>
        {amount.toLocaleString()}
        {showUnit && '콩'}
      </span>
    </span>
  )
}

export default Price
