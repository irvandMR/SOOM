import { Dialog } from 'primereact/dialog'
import Button from './Button'

interface ModalProps {
  visible: boolean
  onHide: () => void
  title: string
  children: React.ReactNode
  onConfirm?: () => void
  confirmLabel?: string
  loading?: boolean
  width?: string
}

export default function Modal({
  visible, onHide, title, children,
  onConfirm, confirmLabel = 'Simpan',
  loading, width = '440px'
}: ModalProps) {
  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={title}
      style={{ width, fontFamily: 'inherit' }}
      footer={onConfirm && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8 }}>
          <Button label="Batal" variant="secondary" onClick={onHide} />
          <Button label={confirmLabel} onClick={onConfirm} loading={loading} />
        </div>
      )}
    >
      {children}
    </Dialog>
  )
}