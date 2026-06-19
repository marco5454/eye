import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'

type Props = {
  title: string
  phase: string
  description: string
  icon?: ReactNode
}

/**
 * Temporary stand-in for not-yet-implemented pages.
 * Replaced by real page content in Phases 4-9.
 */
export default function PlaceholderPage({ title, phase, description, icon }: Props) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-3xl bg-shell p-8 shadow-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky text-ocean">
          {icon ?? <Sparkles className="h-7 w-7" />}
        </div>
        <h2 className="text-2xl font-bold text-dusk">{title}</h2>
        <p className="mt-1 font-mono text-xs uppercase tracking-wider text-coral">
          {phase}
        </p>
        <p className="mt-4 text-sm text-dusk/70">{description}</p>
      </div>
    </div>
  )
}
