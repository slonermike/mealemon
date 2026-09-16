interface Props {
  allTags: string[]
  activeTags: string[]
  onToggle: (tag: string) => void
}

export function ModeToggleList({ allTags, activeTags, onToggle }: Props) {
  if (allTags.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {allTags.map((tag) => {
        const active = activeTags.includes(tag)
        return (
          <button
            key={tag}
            type={'button'}
            onClick={() => onToggle(tag)}
            style={{
              padding: '4px 10px',
              borderRadius: 12,
              border: '1px solid',
              borderColor: active ? '#2563eb' : '#d1d5db',
              background: active ? '#dbeafe' : '#f9fafb',
              color: active ? '#1d4ed8' : '#374151',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: active ? 600 : 400,
            }}
          >
            {tag}
          </button>
        )
      })}
    </div>
  )
}
