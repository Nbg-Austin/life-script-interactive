interface TransitionLayerProps {
  active: boolean
  durationMs: number
}

export default function TransitionLayer({ active, durationMs }: TransitionLayerProps) {
  return (
    <div
      className="transition-layer"
      style={{
        opacity: active ? 1 : 0,
        transitionDuration: `${durationMs}ms`,
        pointerEvents: active ? 'auto' : 'none',
      }}
    />
  )
}
