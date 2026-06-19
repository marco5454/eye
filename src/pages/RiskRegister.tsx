import { AlertTriangle } from 'lucide-react'
import PlaceholderPage from '../components/ui/PlaceholderPage'

export default function RiskRegister() {
  return (
    <PlaceholderPage
      title="Risk Register"
      phase="Phase 9 — coming soon"
      description="Inline-editable risk register with auto-calculated risk levels from likelihood and impact."
      icon={<AlertTriangle className="h-7 w-7" />}
    />
  )
}
