import { useEffect, useState, type ReactNode } from 'react'
import { color, eyebrowStyle, font, tab, type TabKey } from '@/theme'

interface Props {
  tab: TabKey
  eyebrow: string
  title: string
  /** Control aligned to the right of the title (button, status). */
  action?: ReactNode
  /** Extra rows under the title (summaries). Collapses away when the header is compact. */
  children?: ReactNode
  /** Rows that stay visible when compact (e.g. a progress bar). */
  pinned?: ReactNode
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

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

const DURATION = '200ms'
const EASE = 'ease'

// Height animates via grid rows (0fr <-> 1fr); collapsed content is inert so it can't be
// focused or read out while hidden.
function Collapsible({
  collapsed,
  animate,
  children,
}: {
  collapsed: boolean
  animate: boolean
  children: ReactNode
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: collapsed ? '0fr' : '1fr',
        opacity: collapsed ? 0 : 1,
        transition: animate
          ? `grid-template-rows ${DURATION} ${EASE}, opacity ${DURATION} ${EASE}`
          : 'none',
      }}
    >
      <div style={{ overflow: 'hidden', minHeight: 0 }} inert={collapsed}>
        {children}
      </div>
    </div>
  )
}

export function TabHeader({ tab: tabKey, eyebrow, title, action, children, pinned }: Props) {
  const t = tab[tabKey]
  const compact = useCompactOnScroll()
  const animate = !usePrefersReducedMotion()
  const transition = (props: string) => (animate ? `${props} ${DURATION} ${EASE}` : 'none')

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: t.tint,
        borderBottom: `1px solid ${t.edge}`,
        boxShadow: compact ? '0 2px 8px rgba(28, 27, 23, 0.08)' : '0 2px 8px rgba(28, 27, 23, 0)',
        transition: transition('box-shadow'),
      }}
    >
      <div
        style={{
          ...innerStyle,
          padding: compact ? '8px 20px' : '20px 20px 16px',
          transition: transition('padding'),
        }}
      >
        <div style={titleRowStyle}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Collapsible collapsed={compact} animate={animate}>
              <span
                style={{ ...eyebrowStyle, color: t.accent, display: 'block', paddingBottom: 2 }}
              >
                {eyebrow}
              </span>
            </Collapsible>
            <h1
              style={{
                ...titleStyle,
                fontSize: compact ? 22 : 34,
                transition: transition('font-size'),
              }}
            >
              {title}
            </h1>
          </div>
          {action}
        </div>
        {children && (
          <Collapsible collapsed={compact} animate={animate}>
            <div style={{ paddingTop: 12 }}>{children}</div>
          </Collapsible>
        )}
        {pinned && (
          <div style={{ paddingTop: compact ? 6 : 12, transition: transition('padding-top') }}>
            {pinned}
          </div>
        )}
      </div>
    </header>
  )
}

const innerStyle: React.CSSProperties = {
  maxWidth: 480,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
}

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
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
