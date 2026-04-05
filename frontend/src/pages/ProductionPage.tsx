import { useState } from 'react'
import { Eye } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import type { Production } from '../types/production.types'
import { formatDate } from '../utils/format'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import StatusBadge from '../components/common/ui/StatusBadge'
import FilterBar from '../components/common/ui/FilterBar'
import Button from '../components/common/ui/Button'
import DetailProductionModal from '../components/production/DetailProductionModal'
import AddProductionModal from '../components/production/AddProductionModal'
import { useProductions, PRODUCTION_KEYS } from '../hooks/queries/useProductionQueries'
import { useProducts } from '../hooks/queries/useProductQueries'

interface Product {
  id: string
  name: string
  unitName: string
  unitSymbol: string
}

export default function ProductionPage() {
  const queryClient = useQueryClient()

  // ── UI State ──────────────────────────────────────────────────────────────
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'productionDate',
    sortOrder: -1 as 1 | -1 | 0 | null,
    search: '',
    filterStatus: 'ALL',
    filterDateRange: [null, null] as [Date | null, Date | null]
  })

  const [showModal, setShowModal] = useState(false)
  const [selectedProductionId, setSelectedProductionId] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // ── React Query ───────────────────────────────────────────────────────────
  const { data: productData } = useProducts({ page: 0, size: 1000 })
  const products = (productData as any)?.content || []
  const hasProducts = products.length > 0

  const { data: pageData, isLoading } = useProductions({
    page: lazyParams.page,
    size: lazyParams.rows,
    search: lazyParams.search || undefined,
    sort: `${lazyParams.sortField},${lazyParams.sortOrder === 1 ? 'asc' : 'desc'}`
  }, hasProducts)

  const productions = pageData?.content || []
  const totalRecords = pageData?.totalElements || 0

  const refresh = () => queryClient.invalidateQueries({ queryKey: PRODUCTION_KEYS.lists() })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onPage = (event: any) => {
    setLazyParams(prev => ({ ...prev, first: event.first, rows: event.rows, page: event.page }))
  }

  const onSort = (event: any) => {
    setLazyParams(prev => ({ ...prev, sortField: event.sortField, sortOrder: event.sortOrder }))
  }

  const columns = [
    { header: 'Produk', field: 'product.name', sortable: true, body: (row: Production) => row.productName },
    {
      header: 'Versi Resep', body: (row: Production) => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Versi {row.recipeVersion}</span>
      )
    },
    {
      header: 'Qty Produksi', field: 'quantityProduced', sortable: true, body: (row: Production) => (
        <span style={{ fontWeight: 500 }}>{row.quantityProduced} {row.unitSymbol ?? ''}</span>
      )
    },
    {
      header: 'Tgl Produksi', field: 'productionDate', sortable: true, body: (row: Production) => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(row.productionDate)}</span>
      )
    },
    {
      header: 'Tgl Expired', field: 'expiredDate', sortable: true, body: (row: Production) => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(row.expiredDate)}</span>
      )
    },
    { header: 'Status', field: 'status', sortable: true, body: (row: Production) => <StatusBadge status={row.status} /> },
    {
      header: 'Catatan', body: (row: Production) => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.notes || '-'}</span>
      )
    },
    {
      header: 'Aksi', body: (row: Production) => (
        <Button
          label="Detail"
          icon={<Eye size={12} />}
          variant="secondary"
          size="small"
          onClick={() => { setSelectedProductionId(row.id); setShowDetailModal(true) }}
        />
      )
    },
  ]

  return (
    <div>
      <PageHeader
        title="Produksi"
        subtitle={`${totalRecords} produksi tercatat`}
        actionLabel="Catat Produksi"
        onAction={() => setShowModal(true)}
      />

      <FilterBar
        config={{
          search: { 
            value: lazyParams.search, 
            onChange: (v) => setLazyParams(p => ({ ...p, search: v, page: 0, first: 0 })), 
            placeholder: 'Cari nama produk...' 
          },
          dateRange: {
            value: lazyParams.filterDateRange,
            onChange: (val) => setLazyParams(p => ({ ...p, filterDateRange: val ?? [null, null], page: 0, first: 0 })),
            placeholder: 'Filter tanggal'
          },
          dropdowns: [{
            value: lazyParams.filterStatus,
            onChange: (v) => setLazyParams(p => ({ ...p, filterStatus: v, page: 0, first: 0 })),
            options: [
              { label: 'Semua Status', value: 'ALL' },
              { label: 'Sukses', value: 'SUCCESS' },
              { label: 'Gagal', value: 'FAILED' },
            ],
            placeholder: 'Status',
          }],
        }}
        onReset={() => setLazyParams(p => ({ ...p, search: '', filterStatus: 'ALL', filterDateRange: [null, null], page: 0, first: 0 }))}
        hasActiveFilter={!!(lazyParams.search || lazyParams.filterStatus !== 'ALL' || lazyParams.filterDateRange?.[0])}
        onRefresh={refresh}
      />

      <Table
        data={productions}
        columns={columns}
        loading={isLoading}
        emptyMessage="Belum ada data produksi"
        lazy
        totalRecords={totalRecords}
        first={lazyParams.first}
        rows={lazyParams.rows}
        onPage={onPage}
        onSort={onSort}
        sortField={lazyParams.sortField}
        sortOrder={lazyParams.sortOrder}
      />

      <AddProductionModal
        visible={showModal}
        onHide={() => setShowModal(false)}
        onSuccess={refresh}
        products={products as Product[]}
      />

      <DetailProductionModal
        visible={showDetailModal}
        onHide={() => { setShowDetailModal(false); setSelectedProductionId(null) }}
        productionId={selectedProductionId}
      />
    </div>
  )
}