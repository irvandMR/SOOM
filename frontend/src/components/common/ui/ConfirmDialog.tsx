import { ConfirmDialog as PrimeConfirmDialog, confirmDialog } from 'primereact/confirmdialog'

export { confirmDialog }

export default function ConfirmDialog() {
  return (
    <PrimeConfirmDialog
      pt={{
        root: { style: { borderRadius: 12, fontFamily: 'inherit', maxWidth: 360, width: '90vw' } },
        header: { style: { borderRadius: '12px 12px 0 0', fontSize: 15, fontWeight: 600, paddingBottom: 8 } },
        content: { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '8px 24px 20px' } },
        icon: { style: { fontSize: 36, marginBottom: 12, display: 'block' } },
        message: { style: { fontSize: 13, color: 'var(--muted)', marginLeft: 0 } },
        footer: { style: { borderRadius: '0 0 12px 12px', justifyContent: 'center', gap: 8, padding: '12px 24px' } },
      }}
    />
  )
}