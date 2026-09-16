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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      <button type={'button'} onClick={onClear} style={chipStyle(isClearActive)}>
        {clearLabel}
      </button>
      {allTags.map((tag) => {
        const active = activeTags.includes(tag)
        return (
          <button key={tag} type={'button'} onClick={() => onToggle(tag)} style={chipStyle(active)}>
            {tag}
          </button>
        )
      })}
    </div>
  )
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '4px 10px',
    borderRadius: 12,
    border: '1px solid',
    borderColor: active ? '#2563eb' : '#e5e7eb',
    background: active ? '#dbeafe' : '#f3f4f6',
    color: active ? '#1d4ed8' : '#9ca3af',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
  }
}
