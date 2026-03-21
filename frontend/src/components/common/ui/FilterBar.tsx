import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { Calendar } from 'primereact/calendar'
import { X, RefreshCw } from 'lucide-react'
import Button from './Button'

export interface FilterOption {
  label: string
  value: string
}

export interface FilterConfig {
  search?: {
    value: string
    onChange: (val: string) => void
    placeholder?: string
  }
  dateRange?: {
    value: [Date | null, Date | null]
    onChange: (val: [Date | null, Date | null]) => void
    placeholder?: string
  }
  dropdowns?: {
    value: string
    onChange: (val: string) => void
    options: FilterOption[]
    placeholder?: string
  }[]
}

interface FilterBarProps {
  config: FilterConfig
  onReset: () => void
  hasActiveFilter: boolean
  onRefresh?: () => void
}

export default function FilterBar({
  config,
  onReset,
  hasActiveFilter,
  onRefresh
}: FilterBarProps) {
  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >

      {/* Refresh */}
      {onRefresh && (
        <Button
          icon={<RefreshCw size={12} />}
          variant="secondary"
          size="normal"
          onClick={onRefresh}
        />
      )}
      
      {/* Search */}
      {config.search && (
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <i
            className="pi pi-search"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 12,
              color: 'var(--muted)',
              zIndex: 1,
            }}
          />
          <InputText
            value={config.search.value}
            onChange={(e) => config.search!.onChange(e.target.value)}
            placeholder={config.search.placeholder ?? 'Cari...'}
            style={{ width: '100%', fontSize: 13, paddingLeft: 30 }}
          />
        </div>
      )}

      {/* Date Range */}
      {config.dateRange && (
        <Calendar
          value={config.dateRange.value[0] === null ? null : config.dateRange.value}
          onChange={(e) => {
            const val = e.value
            if (!val) {
              config.dateRange!.onChange([null, null])   // ← handle null saat clear
            } else if (Array.isArray(val)) {
              config.dateRange!.onChange(val as [Date | null, Date | null])
            } else {
              config.dateRange!.onChange([val, null])    // ← handle single date
            }
          }}
          selectionMode="range"
          readOnlyInput
          placeholder={config.dateRange.placeholder ?? 'Filter tanggal'}
          dateFormat="dd/mm/yy"
          showButtonBar
          style={{ minWidth: 200 }}
          inputStyle={{ fontSize: 13 }}
        />
      )}

      {/* Dropdowns */}
      {config.dropdowns?.map((dd, i) => (
        <Dropdown
          key={i}
          value={dd.value}
          onChange={(e) => dd.onChange(e.value ?? '')} 
          options={dd.options}
          placeholder={dd.placeholder ?? 'Pilih...'}
          style={{ fontSize: 13, minWidth: 150 }}
        />
      ))}

      {/* Reset */}
      {hasActiveFilter && (
        <Button
          label="Reset"
          icon={<X size={12} />}
          variant="ghost"
          size="small"
          onClick={onReset}
        />
      )}
    </div>
  )
}