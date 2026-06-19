import {
  GRANT_END,
  GRANT_START,
  getDaysRemaining,
  getGrantPhase,
  getGrantProgressPercent,
} from '../../lib/grantPeriod'

// SVG circular progress ring. Sized to fit a dashboard tile.
const SIZE = 180
const STROKE = 14
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const DATE_FMT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export default function CountdownRing() {
  const phase = getGrantPhase()
  const progress = getGrantProgressPercent()
  const daysRemaining = getDaysRemaining()
  const dashOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE

  let centerNumber: string
  let centerLabel: string
  let footnote: string

  if (phase.phase === 'pre-grant') {
    centerNumber = '—'
    centerLabel = 'Pre-grant'
    footnote = `Begins ${DATE_FMT.format(GRANT_START)}`
  } else if (phase.phase === 'ended') {
    centerNumber = '0'
    centerLabel = 'days left'
    footnote = `Ended ${DATE_FMT.format(GRANT_END)}`
  } else {
    centerNumber = daysRemaining.toLocaleString()
    centerLabel = daysRemaining === 1 ? 'day left' : 'days left'
    footnote = `Ends ${DATE_FMT.format(GRANT_END)}`
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#E0F2FE" // sky
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#0EA5C9" // ocean
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold text-dusk">{centerNumber}</span>
          <span className="text-xs text-dusk/60">{centerLabel}</span>
          <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-coral">
            {Math.round(progress)}% elapsed
          </span>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-dusk/60">{footnote}</p>
    </div>
  )
}
