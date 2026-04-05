interface StatusBadgeProps {
  status: string
}

const statusMap: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:    { bg: '#FFF8E1', color: '#E65100', label: 'Pending' },
  PROCESS:    { bg: '#E3F2FB', color: '#1565A0', label: 'Process' },
  DONE:       { bg: '#E8F5E9', color: '#2E7D32', label: 'Done' },
  DELIVERED:  { bg: '#E8F5E9', color: '#2E7D32', label: 'Delivered' },
  CANCELLED:  { bg: '#FFEBEE', color: '#C62828', label: 'Cancelled' },
  UNPAID:     { bg: '#FFF8E1', color: '#E65100', label: 'Belum Bayar' },
  DP:         { bg: '#E3F2FB', color: '#1565A0', label: 'DP' },
  PAID:       { bg: '#E8F5E9', color: '#2E7D32', label: 'Lunas' },
  SUCCESS:    { bg: '#E8F5E9', color: '#2E7D32', label: 'Sukses' },
  FAILED:     { bg: '#FFEBEE', color: '#C62828', label: 'Gagal' },
  IN:         { bg: '#E8F5E9', color: '#2E7D32', label: 'Pemasukan' },
  OUT:        { bg: '#FFEBEE', color: '#C62828', label: 'Pengeluaran' },
  CRITICAL:   { bg: '#FFEBEE', color: '#C62828', label: 'Kritis' },
  SAFE:       { bg: '#E8F5E9', color: '#2E7D32', label: 'Aman' },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const s = statusMap[status] ?? { bg: '#f5f5f5', color: '#666', label: status }

  return (
    <span style={{
      fontSize: 10,
      padding: '2px 8px',
      borderRadius: 4,
      fontWeight: 500,
      background: s.bg,
      color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}