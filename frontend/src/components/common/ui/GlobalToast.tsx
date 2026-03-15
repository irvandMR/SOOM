import { useEffect, useRef } from 'react'
import { Toast } from 'primereact/toast'
import { useToastStore } from '../../../store/useToastStore'

export default function GlobalToast() {
  const toastRef = useRef<Toast>(null)
  const { message, clear } = useToastStore()

  useEffect(() => {
    if (message && toastRef.current) {
      toastRef.current.show({
        severity: message.severity,
        summary: message.summary,
        detail: message.detail,
        life: 3000,
      })
      clear()
    }
  }, [message])

  return (
    <Toast
      ref={toastRef}
      position="top-right"
      pt={{
        root: { style: { zIndex: 9999 } },
      }}
    />
  )
}