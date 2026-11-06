import { useEffect, useRef } from 'react'
import type { CanvasSize } from '../canvas/drawing'

export type FrameInfo = {
  delta: number
  time: number
}

type DrawCallback = (
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  info: FrameInfo,
) => void

export function useCanvasAnimation(draw: DrawCallback) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sizeRef = useRef<CanvasSize>({ width: 0, height: 0 })
  const drawRef = useRef(draw)
  drawRef.current = draw

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const DPR = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const width = Math.max(1, rect.width)
      const height = Math.max(1, rect.height)
      canvas.width = Math.floor(width * DPR)
      canvas.height = Math.floor(height * DPR)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      sizeRef.current = { width, height }
    }
    resize()

    const observer = new ResizeObserver(resize)
    if (canvas.parentElement) observer.observe(canvas.parentElement)

    let raf = 0
    let last = performance.now()
    const start = last

    const tick = (now: number) => {
      const rawDelta = (now - last) / 1000
      const delta = Math.min(rawDelta, 0.05)
      last = now
      const size = sizeRef.current
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      drawRef.current(ctx, size, { delta, time: (now - start) / 1000 })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return { canvasRef, sizeRef }
}
