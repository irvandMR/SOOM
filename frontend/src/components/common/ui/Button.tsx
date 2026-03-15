import { Button as PrimeButton } from 'primereact/button'
import { useBreakpoint } from '../../../hooks/useBreakpoint'

interface ButtonProps {
  label?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  icon?: React.ReactNode
  iconOnly?: boolean
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  size?: 'small' | 'normal'
  tooltip?: string
  style?: React.CSSProperties
}

export default function Button({
  label, onClick, variant = 'primary',
  icon, iconOnly = false, loading, disabled,
  type = 'button', size = 'normal', tooltip, style
}: ButtonProps) {
  const { isMobile } = useBreakpoint()

  const variantStyles = {
    primary: { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)', color: 'white' },
    secondary: { backgroundColor: 'transparent', borderColor: 'var(--border)', color: 'var(--text)' },
    danger: { backgroundColor: 'transparent', borderColor: '#FFCDD2', color: '#E57373' },
    ghost: { backgroundColor: 'transparent', borderColor: 'transparent', color: 'var(--muted)' },
  }

  const isSmall = size === 'small'
  const showIconOnly = iconOnly || (isMobile && !!icon && !!label)

  // Konversi Lucide icon jadi string icon untuk PrimeReact tidak bisa
  // Jadi kita pakai iconTemplate
  const iconTemplate = icon
    ? () => <span style={{ display: 'flex', alignItems: 'center', marginRight: !showIconOnly && label ? 6 : 0 }}>{icon}</span>
    : undefined

  return (
    <PrimeButton
      label={showIconOnly ? undefined : label}
      icon={iconTemplate}
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      type={type}
      tooltip={showIconOnly ? (tooltip ?? label) : undefined}
      tooltipOptions={{ position: 'top' }}
      pt={{
        root: {
          style: {
            ...variantStyles[variant],
            fontFamily: 'inherit',
            fontSize: isSmall ? 11 : 13,
            fontWeight: 500,
            borderRadius: 8,
            padding: showIconOnly
              ? isSmall ? '5px 6px' : '7px 8px'
              : isSmall ? '4px 10px' : '8px 14px',
            border: `1px solid ${variantStyles[variant].borderColor}`,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            ...style,
          }
        },
        label: { style: { fontWeight: 500, fontSize: isSmall ? 11 : 13 } },
      }}
    />
  )
}