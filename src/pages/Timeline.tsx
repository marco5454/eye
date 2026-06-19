import { Calendar } from 'lucide-react'
import PlaceholderPage from '../components/ui/PlaceholderPage'

export default function Timeline() {
  return (
    <PlaceholderPage
      title="Timeline"
      phase="Phase 6 — coming soon"
      description="Gantt-style grid spanning the 12 grant quarters. Bars coloured by outcome. Horizontally scrollable on mobile."
      icon={<Calendar className="h-7 w-7" />}
    />
  )
}
