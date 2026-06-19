type Size = 'sm' | 'md'

type Props = {
  /** 0..100. Values outside this range are clamped. */
  value: number
  /** CSS color (hex or token-resolved). Defaults to ocean. */
  color?: string
  size?: Size
  showLabel?: boolean
  className?: string
}

const TRACK_HEIGHT: Record<Size, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
}

export default function ProgressBar({
  value,
  color = '#0EA5C9', // ocean
  size = 'md',
  showLabel = false,
  className = '',
}: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative w-full overflow-hidden rounded-full bg-sky/60 ${TRACK_HEIGHT[size]}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-right font-mono text-xs text-dusk/70">{pct}%</div>
      )}
    </div>
  )
}
