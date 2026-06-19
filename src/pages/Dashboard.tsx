import { Home } from 'lucide-react'
import PlaceholderPage from '../components/ui/PlaceholderPage'

export default function Dashboard() {
  return (
    <PlaceholderPage
      title="Dashboard"
      phase="Phase 4 — coming soon"
      description="Grant countdown, outcome cards, upcoming milestones and a risk snapshot will live here."
      icon={<Home className="h-7 w-7" />}
    />
  )
}
