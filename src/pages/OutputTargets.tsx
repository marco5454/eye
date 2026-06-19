import { BarChart3 } from 'lucide-react'
import PlaceholderPage from '../components/ui/PlaceholderPage'

export default function OutputTargets() {
  return (
    <PlaceholderPage
      title="Output Targets"
      phase="Phase 7 — coming soon"
      description="Track Y1, Y2 and Y3 actuals against numeric targets, with colour-coded progress thresholds."
      icon={<BarChart3 className="h-7 w-7" />}
    />
  )
}
