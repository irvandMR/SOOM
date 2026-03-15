interface FormFieldProps {
  label: string
  children: React.ReactNode
  required?: boolean
}

export default function FormField({ label, children, required }: FormFieldProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--text)',
        display: 'block',
        marginBottom: 5,
      }}>
        {label} {required && <span style={{ color: '#C62828' }}>*</span>}
      </label>
      {children}
    </div>
  )
}