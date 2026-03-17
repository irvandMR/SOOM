import { useNavigate } from "react-router-dom"
import type { Product, Recipe } from "../../types/product.types"
import { formatRupiah } from "../../utils/format"
import Button from "../common/ui/Button"
import Modal from "../common/ui/Modal"

const typeLabel: Record<string, string> = {
  MADE_TO_ORDER: 'Made to Order',
  MADE_TO_STOCK: 'Made to Stock',
  RESELL: 'Resell',
}

interface Props {
    visible: boolean
    onHide: () => void
    product: Product | null
    recipes: Recipe[]
    loading: boolean
    onRecipeModal: () => void
}

export default function DetailProductModal({
    visible,
    onHide,
    product,
    recipes,
    loading,
    onRecipeModal
}:Props){

    const navigate = useNavigate()
    const recommendedPrice = product
    ? product.estimatedCost * (1 + product.targetMargin / 100)
    : 0
    const activeRecipe = recipes.find(r => r.isActive)

    return(
        <Modal
            visible={visible}
            onHide={() => onHide()}
            title={product?.name ?? 'Detail Produk'}
            width="500px"
            >
            {product && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    
                {/* Info */}
                <div style={{ background: 'var(--sidebar-bg)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                        { label: 'Kategori', value: product.categoryName },
                        { label: 'Unit', value: product.unitName },
                        { label: 'Tipe', value: typeLabel[product.type] },
                        { label: 'Stok', value: `${product.stockQuantity} ${product.unitName}` },
                    ].map(({ label, value }) => (
                        <div key={label}>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{value}</div>
                        </div>
                    ))}
                    </div>
                </div>
    
                {/* Estimasi */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                    { label: 'Harga Jual', value: formatRupiah(product.defaultPrice), color: 'var(--accent)' },
                    { label: 'Est. Modal', value: formatRupiah(product.estimatedCost), color: 'var(--text)' },
                    { label: 'Rek. Harga', value: formatRupiah(recommendedPrice), color: '#2E7D32' },
                    ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'var(--sidebar-bg)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color }}>{value}</div>
                    </div>
                    ))}
                </div>
    
                {/* Resep Aktif saja */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Resep Aktif
                    </div>
                    <Button
                        label="Lihat Semua Versi →"
                        variant="ghost"
                        size="small"
                        onClick={() => {
                        onHide()
                        navigate(`/products/${product.id}/recipes`)
                        }}
                    />
                    </div>
    
                    {loading ? (
                    <div style={{ textAlign: 'center', padding: 20 }}>
                        <i className="pi pi-spin pi-spinner" style={{ color: 'var(--accent)' }} />
                    </div>
                    ) : !activeRecipe ? (
                    <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>
                        Belum ada resep aktif —{' '}
                        <span
                        // onClick={() => { setShowDetailModal(false); setShowRecipeModal(true) }}
                        onClick={() => onRecipeModal()}
                        style={{ color: 'var(--accent)', cursor: 'pointer' }}
                        >
                        Tambah resep
                        </span>
                    </div>
                    ) : (
                    <div style={{ border: '1px solid #A5D6A7', borderRadius: 8, padding: 12, background: '#F0FFF4' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Versi {activeRecipe.versionNumber}</span>
                            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#E8F5E9', color: '#2E7D32', fontWeight: 500 }}>Aktif</span>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Est. {formatRupiah(activeRecipe.estimatedCost)}</span>
                        </div>
                        {activeRecipe.items.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderTop: '1px solid var(--border)' }}>
                            <span>{item.ingredientName}</span>
                            <span style={{ color: 'var(--muted)' }}>{item.quantity} {item.unitSymbol}</span>
                        </div>
                        ))}
                    </div>
                    )}
                </div>
                </div>
            )}
            </Modal>
    )
}