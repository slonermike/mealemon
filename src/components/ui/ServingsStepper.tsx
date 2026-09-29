import { color, tab } from '@/theme'

interface Props {
  servings: number
  onChange: (servings: number) => void
  min?: number
}

export function ServingsStepper({ servings, onChange, min = 1 }: Props) {
  return (
    <div role={'group'} aria-label={'Servings'} style={{ display: 'flex', alignItems: 'center' }}>
      <button
        type={'button'}
        onClick={() => onChange(Math.max(min, servings - 1))}
        disabled={servings <= min}
        aria-label={'Fewer servings'}
        style={servings <= min ? { ...stepperButtonStyle, ...disabledStyle } : stepperButtonStyle}
      >
        {'−'}
      </button>
      <output aria-live={'polite'} style={valueStyle}>
        {servings}
      </output>
      <button
        type={'button'}
        onClick={() => onChange(servings + 1)}
        aria-label={'More servings'}
        style={stepperButtonStyle}
      >
        {'+'}
      </button>
      <span style={{ color: color.muted, fontSize: 14, marginLeft: 8 }}>{'servings'}</span>
    </div>
  )
}

const stepperButtonStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 12,
  border: `1px solid ${tab.recipes.edge}`,
  background: color.surface,
  color: tab.recipes.accent,
  fontSize: 22,
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}

const disabledStyle: React.CSSProperties = {
  color: color.muted,
  opacity: 0.55,
  cursor: 'default',
}

const valueStyle: React.CSSProperties = {
  minWidth: 40,
  textAlign: 'center',
  fontSize: 18,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
}
