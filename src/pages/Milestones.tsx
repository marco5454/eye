import { FileText } from 'lucide-react'
import PlaceholderPage from '../components/ui/PlaceholderPage'

export default function Milestones() {
  return (
    <PlaceholderPage
      title="Milestones"
      phase="Phase 8 — coming soon"
      description="Donor reports, internal deliverables and milestones grouped by year. Collapsible and printable."
      icon={<FileText className="h-7 w-7" />}
    />
  )
}
