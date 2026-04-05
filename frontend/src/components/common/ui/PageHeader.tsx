import Button from './Button'
import { Plus } from 'lucide-react'
import { useBreakpoint } from '../../../hooks/useBreakpoint'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export default function PageHeader({ title, subtitle, actionLabel, onAction }: PageHeaderProps) {
  const { isMobile } = useBreakpoint()

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      gap: 12,
    }}>
      <div>
        <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
          {title}
        </div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{subtitle}</div>}
      </div>
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          icon={<Plus size={14} />}
          onClick={onAction}
          iconOnly={isMobile}
          tooltip={actionLabel}
        />
      )}
    </div>
  )
}