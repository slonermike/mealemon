import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { usePlanStore } from '@/store/planSlice'
import { useRecipeStore, selectAllAllergenTags } from '@/store/recipeSlice'
import { ModeToggleList } from './ModeToggleList'
import { ServingsStepper } from './ServingsStepper'

export function GlobalSettingsWidget() {
  const [open, setOpen] = useState(false)

  const activeModes = usePlanStore((s) => s.active_modes)
  const toggleMode = usePlanStore((s) => s.toggleMode)
  const defaultServings = usePlanStore((s) => s.default_servings)
  const setDefaultServings = usePlanStore((s) => s.setDefaultServings)

  const allTags = useRecipeStore(useShallow(selectAllAllergenTags))

  const summary: string[] = []
  if (defaultServings !== 4) summary.push(`${defaultServings} servings`)
  if (activeModes.length > 0) summary.push(`excl: ${activeModes.join(', ')}`)

  return (
    <div style={containerStyle}>
      <button type={'button'} onClick={() => setOpen((o) => !o)} style={pillStyle}>
        <span style={{ marginRight: 6 }}>{'⚙'}</span>
        <span style={pillLabelStyle}>{'Defaults'}</span>
        {summary.length > 0 && <span style={pillSummaryStyle}>{summary.join(' · ')}</span>}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div style={panelStyle}>
          <div style={rowStyle}>
            <span style={labelStyle}>{'Default servings'}</span>
            <ServingsStepper servings={defaultServings} onChange={setDefaultServings} />
          </div>
          {allTags.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={labelStyle}>{'Exclusions'}</div>
              <ModeToggleList
                allTags={allTags}
                activeTags={activeModes}
                onToggle={toggleMode}
                onClear={() => activeModes.forEach(toggleMode)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 72,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'min(448px, calc(100vw - 32px))',
  borderRadius: 12,
  boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
  background: '#fff',
  border: '1px solid #e5e7eb',
  zIndex: 100,
  overflow: 'hidden',
}

const pillStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '12px 16px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  textAlign: 'left',
}

const pillLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  color: '#111827',
  marginRight: 8,
}

const pillSummaryStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#6b7280',
}

const panelStyle: React.CSSProperties = {
  padding: '0 16px 16px',
  borderTop: '1px solid #f3f4f6',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: 12,
}

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: '#374151',
}
