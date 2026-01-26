interface LeafIconProps {
  className?: string
  size?: number
}

/**
 * 잎사귀 아이콘 (지독해 로고용 SVG)
 * 이모지 대신 사용하는 커스텀 아이콘
 */
export function LeafIcon({ className = '', size = 16 }: LeafIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C8 2 4 6 4 12c0 4 2 7 4 8.5V22l4-2 4 2v-1.5c2-1.5 4-4.5 4-8.5 0-6-4-10-8-10z" />
      <path d="M12 6c-2 0-4 2-4 6s2 6 4 6" opacity="0.3" />
    </svg>
  )
}

export default LeafIcon
