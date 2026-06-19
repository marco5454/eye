import { CheckSquare } from 'lucide-react'
import PlaceholderPage from '../components/ui/PlaceholderPage'

export default function TaskTracker() {
  return (
    <PlaceholderPage
      title="Task Tracker"
      phase="Phase 5 — coming soon"
      description="Inline-editable cards on mobile, table on desktop. Filter by outcome, status and year. CSV export included."
      icon={<CheckSquare className="h-7 w-7" />}
    />
  )
}
