// Design tokens. See docs/DESIGN.md for the rules that go with them.
// Every text/background pairing here is WCAG AA (>= 4.5:1) — check before changing a value.

export const color = {
  ground: '#FAF7F0',
  surface: '#FFFFFF',
  ink: '#1C1B17',
  muted: '#5B574D',
  line: '#E4DED0',
  lineSoft: '#EFEAE0',
  control: '#C9C2B3',
  scrim: 'rgba(28, 27, 23, 0.5)',
} as const

// One accent + pale tint per tab.
export const tab = {
  recipes: {
    accent: '#3E6A27',
    dark: '#2C4D1B',
    tint: '#EAF0E0',
    panel: '#F4F7EE',
    edge: '#C5D3B3',
  },
  shopping: {
    accent: '#1D5C8C',
    dark: '#123F63',
    tint: '#E3EDF6',
    panel: '#F7F9FB',
    edge: '#C9DAEA',
  },
  plans: { accent: '#A34A1B', dark: '#7A3610', tint: '#F6E7DC', panel: '#FBF3EC', edge: '#EACFBD' },
} as const

export type TabKey = keyof typeof tab

export const status = {
  warn: { bg: '#FCEFD2', fg: '#8A5300' },
  danger: { bg: '#FDE8E6', fg: '#B42318', edge: '#D9A39C' },
} as const

export const font = {
  display: "Fraunces, Georgia, 'Times New Roman', serif",
  body: "Figtree, system-ui, -apple-system, 'Segoe UI', sans-serif",
} as const

export const NAV_HEIGHT = 76
export const MIN_TARGET = 44

export const eyebrowStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

export const sectionLabelStyle: React.CSSProperties = {
  ...eyebrowStyle,
  fontWeight: 700,
  margin: 0,
  padding: '0 4px',
}

export const badgeBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px 3px 8px',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.3,
}
