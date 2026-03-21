import { useEffect, useState } from 'react'
import api from '../services/api'
import type { Production } from '../types/production.types'
import { formatDate } from '../utils/format'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import StatusBadge from '../components/common/ui/StatusBadge'
import FilterBar from '../components/common/ui/FilterBar'
import DetailProductionModal from '../components/production/DetailProductionModal'
import Button from '../components/common/ui/Button'
import { Eye } from 'lucide-react'
import AddProductionModal from '../components/production/addProductionModal'

interface Product {
  id: string
  name: string
  unitName: string    // ← tambah
  unitSymbol: string  // ← tambah
}

export default function ProductionPage() {
  const [productions, setProductions] = useState<Production[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterDateRange, setFilterDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [first, setFirst] = useState(0)

  const [selectedProductionId, setSelectedProductionId] = useState<string | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const fetchProductions = async () => {
    const res = await api.get('/productions')
    setProductions(res.data.data)
  }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prodRes, productRes] = await Promise.all([  // ← tambah unitRes
          api.get('/productions'),
          api.get('/products'),
          api.get('/units'),                                          // ← tambah
        ])
        setProductions(prodRes.data.data)
        setProducts(productRes.data.data)                                 // ← tambah
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  useEffect(() => {
    setFirst(0)
  }, [search, filterStatus, filterDateRange])

  const filteredProductions = productions.filter(p => {
    const matchSearch = p.productName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus
    const matchDate = (() => {
      if (!filterDateRange?.[0]) return true
      const date = new Date(p.productionDate)
      date.setHours(0, 0, 0, 0)
      const start = new Date(filterDateRange[0]!)
      start.setHours(0, 0, 0, 0)
      const end = new Date(filterDateRange[1] ?? filterDateRange[0]!)
      end.setHours(23, 59, 59, 999)
      return date >= start && date <= end
    })()
    return matchSearch && matchStatus && matchDate
  })

  const columns = [
    { header: 'Produk', field: 'productName' },
    {
      header: 'Versi Resep', body: (row: Production) => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Versi {row.recipeVersion}</span>
      )
    },
    {
      header: 'Qty Produksi', body: (row: Production) => (
        <span style={{ fontWeight: 500 }}>
          {row.quantityProduced} {row.unitSymbol ?? ''}
        </span>
      )
    },
    {
      header: 'Tgl Produksi', body: (row: Production) => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(row.productionDate)}</span>
      )
    },
    { header: 'Status', body: (row: Production) => <StatusBadge status={row.status} /> },
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
    }
  ]

  return (
    <div>
      <PageHeader
        title="Produksi"
        subtitle={`${filteredProductions.length} produksi tercatat`}
        actionLabel="Catat Produksi"
        onAction={() => setShowModal(true)}
      />

      <FilterBar
        config={{
          search: { value: search, onChange: setSearch, placeholder: 'Cari nama produk...' },
          dateRange: {
            value: filterDateRange,
            onChange: (val) => setFilterDateRange(val ?? [null, null]),
            placeholder: 'Filter tanggal'
          },
          dropdowns: [{
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { label: 'Semua Status', value: 'ALL' },
              { label: 'Sukses', value: 'SUCCESS' },
              { label: 'Gagal', value: 'FAILED' },
            ],
            placeholder: 'Status',
          }],
        }}
        onReset={() => { setSearch(''); setFilterStatus('ALL'); setFilterDateRange([null, null]) }}
        hasActiveFilter={!!(search || filterStatus !== 'ALL' || filterDateRange[0])}
        onRefresh={fetchProductions}
      />

      <Table
        data={filteredProductions}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada data produksi"
        first={first}
        onFirstChange={setFirst}
      />

      <AddProductionModal
        visible={showModal}
        onHide={() => setShowModal(false)}
        onSuccess={fetchProductions}
        products={products}   
      />

      <DetailProductionModal
        visible={showDetailModal}
        onHide={() => { setShowDetailModal(false); setSelectedProductionId(null) }}
        productionId={selectedProductionId}
      />
    </div>
  )
}