import { useEffect, useState, type ReactNode } from 'react'
import { color, eyebrowStyle, font, tab, type TabKey } from '@/theme'

interface Props {
  tab: TabKey
  eyebrow: string
  title: string
  /** Control aligned to the right of the title (button, status). */
  action?: ReactNode
  /**
   * Extra rows under the title (progress, summaries). Pass a function to render a slimmer
   * version while the header is compact; a plain node is hidden when compact.
   */
  children?: ReactNode | ((compact: boolean) => ReactNode)
}

const COMPACT_AFTER = 48
const EXPAND_BEFORE = 8
// Compacting shortens the page; only do it when there is room to spare, otherwise the
// browser clamps scrollY back to 0, we expand again, and the header flickers.
const MIN_SPARE_SCROLL = 160

function useCompactOnScroll(): boolean {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      setCompact((prev) => (prev ? y > EXPAND_BEFORE : y > COMPACT_AFTER && max > MIN_SPARE_SCROLL))
    }
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [])

  return compact
}

export function TabHeader({ tab: tabKey, eyebrow, title, action, children }: Props) {
  const t = tab[tabKey]
  const compact = useCompactOnScroll()
  const extra = typeof children === 'function' ? children(compact) : compact ? null : children

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: t.tint,
        borderBottom: `1px solid ${t.edge}`,
        boxShadow: compact ? '0 2px 8px rgba(28, 27, 23, 0.08)' : 'none',
      }}
    >
      <div style={compact ? { ...innerStyle, ...innerCompactStyle } : innerStyle}>
        <div style={{ ...titleRowStyle, alignItems: compact ? 'center' : 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!compact && <span style={{ ...eyebrowStyle, color: t.accent }}>{eyebrow}</span>}
            <h1 style={compact ? { ...titleStyle, ...titleCompactStyle } : titleStyle}>{title}</h1>
          </div>
          {action}
        </div>
        {extra}
      </div>
    </header>
  )
}

const innerStyle: React.CSSProperties = {
  maxWidth: 480,
  margin: '0 auto',
  padding: '20px 20px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const innerCompactStyle: React.CSSProperties = {
  padding: '8px 20px',
  gap: 6,
}

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: font.display,
  fontSize: 34,
  fontWeight: 600,
  lineHeight: 1.1,
  color: color.ink,
}

const titleCompactStyle: React.CSSProperties = {
  fontSize: 22,
}
