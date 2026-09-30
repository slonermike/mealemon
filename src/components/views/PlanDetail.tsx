import { useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { usePlansStore } from '@/store/plansSlice'
import { PlanCard } from '@/components/ui/PlanCard'
import { color } from '@/theme'

export function PlanDetail() {
  const { planId } = useParams({ from: '/plans/$planId' })
  const setActivePlan = usePlansStore((s) => s.setActivePlan)
  const plan = usePlansStore((s) => s.plans[planId] ?? null)
  const navigate = useNavigate()

  useEffect(() => {
    setActivePlan(planId)
  }, [planId, setActivePlan])

  return (
    <div style={containerStyle}>
      <button style={backButtonStyle} onClick={() => void navigate({ to: '/plans' })}>
        {'← Plans'}
      </button>
      {plan ? (
        <PlanCard plan={plan} collapsible={false} />
      ) : (
        <p style={loadingStyle}>{'Loading…'}</p>
      )}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  maxWidth: 480,
  margin: '0 auto',
  padding: '8px 16px 32px',
}

const backButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '12px 0',
  fontSize: 15,
  fontWeight: 500,
  color: '#2563eb',
  cursor: 'pointer',
  display: 'block',
  marginBottom: 12,
}

const loadingStyle: React.CSSProperties = { color: color.muted, fontSize: 16 }
