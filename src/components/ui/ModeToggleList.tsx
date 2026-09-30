import { CheckIcon, PlusIcon } from '@/components/ui/icons'
import { color, tab } from '@/theme'

interface Props {
  allTags: string[]
  activeTags: string[]
  onToggle: (tag: string) => void
  onClear: () => void
  clearLabel?: string
  clearActive?: boolean
}

export function ModeToggleList({
  allTags,
  activeTags,
  onToggle,
  onClear,
  clearLabel = 'none',
  clearActive,
}: Props) {
  if (allTags.length === 0) return null
  const isClearActive = clearActive !== undefined ? clearActive : activeTags.length === 0
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <button
        type={'button'}
        onClick={onClear}
        aria-pressed={isClearActive}
        style={chipStyle(isClearActive)}
      >
        {isClearActive && <CheckIcon size={16} />}
        {clearLabel}
      </button>
      {allTags.map((tag) => {
        const active = activeTags.includes(tag)
        return (
          <button
            key={tag}
            type={'button'}
            onClick={() => onToggle(tag)}
            aria-pressed={active}
            style={chipStyle(active)}
          >
            {active ? <CheckIcon size={16} /> : <PlusIcon size={16} />}
            {tag}
          </button>
        )
      })}
    </div>
  )
}

// Selected = solid fill + check; unselected = outline + plus. Never color alone.
function chipStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    padding: '0 14px 0 12px',
    borderRadius: 22,
    border: `1.5px solid ${active ? tab.recipes.accent : color.control}`,
    background: active ? tab.recipes.accent : color.surface,
    color: active ? '#FFFFFF' : color.ink,
    fontSize: 15,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
  }
}
