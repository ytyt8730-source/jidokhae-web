interface KongIconProps {
  className?: string
  size?: number
}

/**
 * 콩 화폐 아이콘 (SVG)
 * 이모지 대신 사용하는 커스텀 아이콘
 */
export function KongIcon({ className = '', size = 16 }: KongIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="13" rx="7" ry="9" />
      <ellipse cx="12" cy="7" rx="2.5" ry="1.8" opacity="0.5" />
    </svg>
  )
}

export default KongIcon
