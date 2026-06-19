import type { ReactNode } from 'react'
import { quarterLabelFromIndex } from '../../lib/grantPeriod'
import {
  QUARTER_COUNT,
  QUARTER_INDEXES,
  TIMELINE_COL_TEMPLATE,
  YEAR_BANDS,
} from './timelineMath'

type Props = {
  /** 1..12 if the grant is currently active. */
  currentQuarter: number | null
  children: ReactNode
}

/**
 * Renders the timeline scroll container plus the sticky two-row header
 * (year bands + per-quarter labels). The body content (`children`) is
 * provided by the page so each outcome group is rendered inside the same
 * scroll context as the header.
 */
export default function TimelineGrid({ currentQuarter, children }: Props) {
  const colTemplate = TIMELINE_COL_TEMPLATE

  return (
    <div className="rounded-2xl bg-shell shadow-sm">
      <div className="overflow-x-auto">
        <div className="relative min-w-[900px]">
          {/* Current-quarter overlay strip, full body height. */}
          {currentQuarter !== null && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 z-0 h-full bg-sky/25 print:bg-sky/40"
              style={{
                left: `calc(${((currentQuarter - 1) / QUARTER_COUNT) * 100}%)`,
                width: `calc(${100 / QUARTER_COUNT}%)`,
              }}
            />
          )}

          {/* Sticky header */}
          <div className="sticky top-0 z-10 border-b border-sky/60 bg-shell/95 backdrop-blur-sm">
            {/* Year bands */}
            <div
              className="grid"
              style={{ gridTemplateColumns: colTemplate }}
            >
              {YEAR_BANDS.map((b) => (
                <div
                  key={b.year}
                  className="border-r border-sky/40 px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-dusk/70 last:border-r-0"
                  style={{ gridColumn: `${b.startCol} / ${b.endCol + 1}` }}
                >
                  Year {b.year}
                </div>
              ))}
            </div>
            {/* Quarter labels */}
            <div
              className="grid"
              style={{ gridTemplateColumns: colTemplate }}
            >
              {QUARTER_INDEXES.map((i) => (
                <div
                  key={i}
                  className={`border-r border-sky/40 px-2 py-1.5 text-center text-[11px] font-mono font-medium last:border-r-0 ${
                    i === currentQuarter
                      ? 'bg-ocean/10 text-ocean'
                      : 'text-dusk/70'
                  }`}
                >
                  {quarterLabelFromIndex(i)}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-[1]">{children}</div>
        </div>
      </div>
    </div>
  )
}
