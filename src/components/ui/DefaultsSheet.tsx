import * as Dialog from '@radix-ui/react-dialog'
import { useShallow } from 'zustand/react/shallow'
import { usePlansStore, selectActivePlan } from '@/store/plansSlice'
import { useRecipeStore, selectAllAllergenTags } from '@/store/recipeSlice'
import { CalendarIcon, CloseIcon } from '@/components/ui/icons'
import { color, eyebrowStyle, font, tab } from '@/theme'
import { ModeToggleList } from './ModeToggleList'
import { ServingsStepper } from './ServingsStepper'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DefaultsSheet({ open, onOpenChange }: Props) {
  const activePlanLabel = usePlansStore((s) =>
    s.activePlanId ? s.planIndex.find((p) => p.id === s.activePlanId)?.label : undefined,
  )
  const activeModes = usePlansStore(useShallow((s) => selectActivePlan(s)?.active_modes ?? []))
  const toggleMode = usePlansStore((s) => s.toggleMode)
  const defaultServings = usePlansStore((s) => s.default_servings)
  const setDefaultServings = usePlansStore((s) => s.setDefaultServings)
  const allTags = useRecipeStore(useShallow(selectAllAllergenTags))

  const summary = `${defaultServings} servings · ${
    activeModes.length > 0 ? `leaving out ${activeModes.join(', ')}` : 'nothing left out'
  }`

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay style={overlayStyle} />
        <Dialog.Content style={sheetStyle} aria-describedby={undefined}>
          <span aria-hidden={true} style={handleStyle} />
          <div style={titleRowStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ ...eyebrowStyle, color: tab.recipes.accent }}>{'Settings'}</span>
              <Dialog.Title style={titleStyle}>{'Plan defaults'}</Dialog.Title>
            </div>
            <Dialog.Close aria-label={'Close'} style={closeStyle}>
              <CloseIcon size={20} />
            </Dialog.Close>
          </div>

          <section style={cardStyle} aria-labelledby={'defaults-servings'}>
            <div style={cardRowStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <h3 id={'defaults-servings'} style={cardTitleStyle}>
                  {'Servings'}
                </h3>
                <span style={hintStyle}>{'New recipes start here'}</span>
              </div>
              <ServingsStepper servings={defaultServings} onChange={setDefaultServings} />
            </div>
          </section>

          {allTags.length > 0 && (
            <section style={cardStyle} aria-labelledby={'defaults-exclude'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <h3 id={'defaults-exclude'} style={cardTitleStyle}>
                  {'Leave out'}
                </h3>
                <span style={hintStyle}>{'We swap in substitutes where a recipe allows it.'}</span>
              </div>
              <ModeToggleList
                allTags={allTags}
                activeTags={activeModes}
                onToggle={toggleMode}
                onClear={() => activeModes.forEach(toggleMode)}
                clearLabel={'none'}
              />
              {activePlanLabel && (
                <span style={scopeStyle}>
                  <CalendarIcon size={14} />
                  {`Only for ${activePlanLabel}`}
                </span>
              )}
            </section>
          )}

          <p role={'status'} style={{ margin: 0, fontSize: 14 }}>
            {summary}
          </p>

          <Dialog.Close style={doneStyle}>{'Done'}</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: color.scrim,
  zIndex: 100,
}

const sheetStyle: React.CSSProperties = {
  position: 'fixed',
  left: '50%',
  transform: 'translateX(-50%)',
  bottom: 0,
  width: 'min(480px, 100vw)',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxSizing: 'border-box',
  background: color.surface,
  borderRadius: '24px 24px 0 0',
  padding: '8px 20px 28px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  boxShadow: '0 -8px 32px rgba(28, 27, 23, 0.18)',
  zIndex: 101,
}

const handleStyle: React.CSSProperties = {
  alignSelf: 'center',
  width: 40,
  height: 5,
  borderRadius: 3,
  background: '#D6D0C3',
}

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: font.display,
  fontSize: 28,
  fontWeight: 600,
  lineHeight: 1.15,
}

const closeStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  flexShrink: 0,
  borderRadius: 22,
  border: 'none',
  background: '#F2EEE6',
  color: color.ink,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
}

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 16,
  border: `1px solid ${color.line}`,
  borderRadius: 16,
  background: color.ground,
}

const cardRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
}

const cardTitleStyle: React.CSSProperties = { margin: 0, fontSize: 17, fontWeight: 600 }

const hintStyle: React.CSSProperties = { fontSize: 14, color: color.muted, lineHeight: 1.4 }

const scopeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: tab.plans.accent,
}

const doneStyle: React.CSSProperties = {
  minHeight: 52,
  borderRadius: 14,
  border: 'none',
  background: tab.recipes.accent,
  color: '#FFFFFF',
  fontSize: 17,
  fontWeight: 600,
  cursor: 'pointer',
}
