import type { ReactNode } from 'react'

interface IconProps {
  size?: number
  strokeWidth?: number
}

function Svg({ size = 20, strokeWidth = 2, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={'0 0 24 24'}
      fill={'none'}
      stroke={'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap={'round'}
      strokeLinejoin={'round'}
      aria-hidden={true}
      focusable={false}
    >
      {children}
    </svg>
  )
}

export const CheckIcon = (p: IconProps) => (
  <Svg strokeWidth={3} {...p}>
    <path d={'M5 12l5 5L20 7'} />
  </Svg>
)

export const PlusIcon = (p: IconProps) => (
  <Svg strokeWidth={2.25} {...p}>
    <path d={'M12 5v14M5 12h14'} />
  </Svg>
)

export const CloseIcon = (p: IconProps) => (
  <Svg strokeWidth={2.25} {...p}>
    <path d={'M6 6l12 12M18 6L6 18'} />
  </Svg>
)

export const ChevronIcon = (p: IconProps) => (
  <Svg strokeWidth={2.25} {...p}>
    <path d={'M9 6l6 6-6 6'} />
  </Svg>
)

export const AlertIcon = (p: IconProps) => (
  <Svg strokeWidth={2.5} {...p}>
    <circle cx={12} cy={12} r={9} />
    <path d={'M12 8v5M12 16.5v.5'} />
  </Svg>
)

export const BlockedIcon = (p: IconProps) => (
  <Svg strokeWidth={2.5} {...p}>
    <circle cx={12} cy={12} r={9} />
    <path d={'M5.6 5.6l12.8 12.8'} />
  </Svg>
)

export const PencilIcon = (p: IconProps) => (
  <Svg strokeWidth={2.5} {...p}>
    <path d={'M4 20h4L19 9l-4-4L4 16z'} />
  </Svg>
)

export const SlidersIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0'} />
    <circle cx={16} cy={6} r={2} />
    <circle cx={10} cy={12} r={2} />
    <circle cx={18} cy={18} r={2} />
  </Svg>
)

export const CloudCheckIcon = (p: IconProps) => (
  <Svg strokeWidth={2.25} {...p}>
    <path d={'M7 18a5 5 0 01-.6-9.96A6 6 0 0118 9a4 4 0 01-1 9z'} />
    <path d={'M9.5 13l2 2 3.5-3.5'} />
  </Svg>
)

export const BasketIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={'M3 9h18l-2 11H5z'} />
    <path d={'M8 9l4-6 4 6'} />
    <path d={'M9 13v4M15 13v4'} />
  </Svg>
)

export const BookIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d={'M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5z'} />
    <path d={'M4 20.5A2.5 2.5 0 006.5 23H20v-5'} />
    <path d={'M9 8h7M9 12h5'} />
  </Svg>
)

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x={3} y={5} width={18} height={16} rx={2} />
    <path d={'M3 10h18M8 3v4M16 3v4'} />
  </Svg>
)
