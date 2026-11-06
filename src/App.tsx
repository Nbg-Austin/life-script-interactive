import { useCallback, useRef, useState } from 'react'
import SceneOne from './components/SceneOne'
import SceneTwo from './components/SceneTwo'
import SceneThree from './components/SceneThree'
import EndingScene from './components/EndingScene'
import TransitionLayer from './components/TransitionLayer'

export type SceneKey = 'field' | 'classroom' | 'city' | 'ending'

const TRANSITION_MS = 900

export default function App() {
  const [scene, setScene] = useState<SceneKey>('field')
  const [transitioning, setTransitioning] = useState(false)
  const transitionLocked = useRef(false)

  const advanceTo = useCallback(
    (next: SceneKey) => {
      if (transitionLocked.current) return
      transitionLocked.current = true
      setTransitioning(true)
      window.setTimeout(() => {
        setScene(next)
        setTransitioning(false)
        transitionLocked.current = false
      }, TRANSITION_MS)
    },
    [],
  )

  return (
    <div className="stage">
      {scene === 'field' && (
        <SceneOne onComplete={() => advanceTo('classroom')} />
      )}
      {scene === 'classroom' && (
        <SceneTwo onComplete={() => advanceTo('city')} />
      )}
      {scene === 'city' && (
        <SceneThree onComplete={() => advanceTo('ending')} />
      )}
      {scene === 'ending' && <EndingScene />}
      <TransitionLayer active={transitioning} durationMs={TRANSITION_MS} />
    </div>
  )
}
