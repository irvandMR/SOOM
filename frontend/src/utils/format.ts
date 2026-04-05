export const formatRupiah = (amount: number | null | undefined): string => {
  const safeAmount = (amount == null || isNaN(amount)) ? 0 : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(safeAmount);
}

export const formatDate = (date: string): string => {
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export const formatDateShort = (date: string): string => {
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date))
}

export const formatNumber = (num: number, decimals = 0): string =>
  new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)

export const formatPercent = (num: number): string =>
  `${num.toFixed(1)}%`

export const toLocalDateTimeString =(date: Date): string => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}` // format LocalDateTime Java
}