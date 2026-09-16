interface Props {
  servings: number
  onChange: (servings: number) => void
  min?: number
}

export function ServingsStepper({ servings, onChange, min = 1 }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        type={'button'}
        onClick={() => onChange(Math.max(min, servings - 1))}
        disabled={servings <= min}
        style={stepperButtonStyle}
      >
        {'−'}
      </button>
      <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{servings}</span>
      <button type={'button'} onClick={() => onChange(servings + 1)} style={stepperButtonStyle}>
        {'+'}
      </button>
      <span style={{ color: '#666', fontSize: 14 }}>{'servings'}</span>
    </div>
  )
}

const stepperButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: '1px solid #ccc',
  background: '#fff',
  fontSize: 18,
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
