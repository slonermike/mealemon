import type { ReactNode } from 'react'
import { color, eyebrowStyle, font, tab, type TabKey } from '@/theme'

interface Props {
  tab: TabKey
  eyebrow: string
  title: string
  /** Control aligned to the right of the title (button, status). */
  action?: ReactNode
  /** Extra rows under the title (progress, summaries). */
  children?: ReactNode
}

export function TabHeader({ tab: tabKey, eyebrow, title, action, children }: Props) {
  const t = tab[tabKey]
  return (
    <header style={{ background: t.tint, borderBottom: `1px solid ${t.edge}` }}>
      <div style={innerStyle}>
        <div style={titleRowStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ ...eyebrowStyle, color: t.accent }}>{eyebrow}</span>
            <h1 style={titleStyle}>{title}</h1>
          </div>
          {action}
        </div>
        {children}
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

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
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
