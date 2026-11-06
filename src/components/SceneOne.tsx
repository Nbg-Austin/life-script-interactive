import { useRef, useState } from 'react'
import { useCanvasAnimation } from '../hooks/useCanvasAnimation'
import {
  fillGlow,
  getPointerPosition,
  mulberry32,
  type CanvasSize,
} from '../canvas/drawing'
import SceneHint from './SceneHint'

const COMPLETE_DELAY_MS = 1050

interface StaticStar {
  x: number
  y: number
  r: number
  twinkle: number
}

interface Tree {
  x: number
  y: number
  s: number
}

interface Grass {
  x: number
  y: number
  h: number
  lean: number
}

interface ShootingStar {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

interface SceneOneProps {
  onComplete: () => void
}

export default function SceneOne({ onComplete }: SceneOneProps) {
  const [hint, setHint] = useState('等一颗流星，轻轻点它')
  const completedRef = useRef(false)
  const flashRef = useRef(0)
  const shootRef = useRef<ShootingStar | null>(null)
  const spawnRef = useRef(1.0)

  const { canvasRef, sizeRef } = useCanvasAnimation((ctx, size, info) => {
    // ---- 每帧更新流星 ----
    const shoot = shootRef.current
    if (shoot) {
      shoot.x += shoot.vx * info.delta
      shoot.y += shoot.vy * info.delta
      shoot.life -= info.delta
      if (shoot.life <= 0 || shoot.y > 0.85) {
        shootRef.current = null
        spawnRef.current = 1.2 + Math.random() * 2.2
      }
    } else {
      spawnRef.current -= info.delta
      if (spawnRef.current <= 0) {
        shootRef.current = {
          x: 0.25 + Math.random() * 0.5,
          y: 0.08 + Math.random() * 0.15,
          vx: -(0.25 + Math.random() * 0.15),
          vy: 0.18 + Math.random() * 0.1,
          life: 1.4,
          maxLife: 1.4,
        }
      }
    }
    if (flashRef.current > 0) flashRef.current = Math.max(0, flashRef.current - info.delta * 1.5)

    draw(ctx, size, info.time, scenery, shootRef.current, flashRef.current)
  })

  const scenery = buildScenery()

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (completedRef.current) return
    const size = sizeRef.current
    const p = getPointerPosition(e, canvasRef.current!, size)
    const shoot = shootRef.current
    if (!shoot) return
    const sx = shoot.x * size.width
    const sy = shoot.y * size.height
    const dx = p.x - sx
    const dy = p.y - sy
    if (dx * dx + dy * dy < 70 * 70) {
      completedRef.current = true
      flashRef.current = 1
      setHint('')
      window.setTimeout(onComplete, COMPLETE_DELAY_MS)
    }
  }

  return (
    <div className="scene scene-one">
      <canvas
        ref={canvasRef}
        className="scene-canvas"
        onPointerDown={handlePointerDown}
      />
      <SceneHint text={hint} />
    </div>
  )
}

function buildScenery() {
  const rnd = mulberry32(20241106)
  const stars: StaticStar[] = []
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: rnd(),
      y: rnd() * 0.62,
      r: 0.5 + rnd() * 1.5,
      twinkle: rnd() * Math.PI * 2,
    })
  }
  const trees: Tree[] = []
  for (let i = 0; i < 7; i++) {
    trees.push({
      x: 0.04 + i * 0.15 + rnd() * 0.04,
      y: 0.74 + rnd() * 0.05,
      s: 0.7 + rnd() * 0.7,
    })
  }
  const grass: Grass[] = []
  for (let i = 0; i < 110; i++) {
    grass.push({
      x: rnd(),
      y: 0.8 + rnd() * 0.18,
      h: 4 + rnd() * 9,
      lean: (rnd() - 0.5) * 7,
    })
  }
  return { stars, trees, grass }
}

function draw(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  time: number,
  scenery: ReturnType<typeof buildScenery>,
  shoot: ShootingStar | null,
  flash: number,
) {
  const { width: W, height: H } = size

  // 夜空
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#070b1e')
  sky.addColorStop(0.55, '#141c3a')
  sky.addColorStop(0.8, '#2a2f55')
  sky.addColorStop(1, '#3a3560')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // 月亮
  fillGlow(ctx, W * 0.82, H * 0.18, H * 0.12, 'rgba(245,240,210,0.95)', 'rgba(245,240,210,0)')
  ctx.fillStyle = '#f5f0d2'
  ctx.beginPath()
  ctx.arc(W * 0.82, H * 0.18, H * 0.045, 0, Math.PI * 2)
  ctx.fill()

  // 星星
  for (const s of scenery.stars) {
    const a = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * 1.5 + s.twinkle))
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.beginPath()
    ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
    ctx.fill()
  }

  // 远山
  ctx.fillStyle = '#1a1f38'
  ctx.beginPath()
  ctx.moveTo(0, H * 0.72)
  ctx.lineTo(W * 0.15, H * 0.6)
  ctx.lineTo(W * 0.3, H * 0.68)
  ctx.lineTo(W * 0.45, H * 0.58)
  ctx.lineTo(W * 0.62, H * 0.66)
  ctx.lineTo(W * 0.8, H * 0.6)
  ctx.lineTo(W, H * 0.7)
  ctx.lineTo(W, H * 0.78)
  ctx.lineTo(0, H * 0.78)
  ctx.closePath()
  ctx.fill()

  // 地面
  const ground = ctx.createLinearGradient(0, H * 0.76, 0, H)
  ground.addColorStop(0, '#1e2f22')
  ground.addColorStop(1, '#0a1410')
  ctx.fillStyle = ground
  ctx.fillRect(0, H * 0.76, W, H * 0.24)

  // 小路
  ctx.fillStyle = '#3a3528'
  ctx.beginPath()
  ctx.moveTo(W * 0.48, H)
  ctx.quadraticCurveTo(W * 0.5, H * 0.9, W * 0.42, H * 0.78)
  ctx.lineTo(W * 0.46, H * 0.78)
  ctx.quadraticCurveTo(W * 0.55, H * 0.9, W * 0.55, H)
  ctx.closePath()
  ctx.fill()

  // 松树（多层三角形）
  for (const t of scenery.trees) {
    const tx = t.x * W
    const ty = t.y * H
    const s = t.s
    // 树干
    ctx.fillStyle = '#2a1d12'
    ctx.fillRect(tx - 2.5 * s, ty - 10 * s, 5 * s, 12 * s)
    // 三层三角形
    ctx.fillStyle = '#0d2a1a'
    for (let layer = 0; layer < 3; layer++) {
      const w = (28 - layer * 7) * s
      const topY = ty - (22 + layer * 14) * s
      const botY = topY + 16 * s
      ctx.beginPath()
      ctx.moveTo(tx, topY)
      ctx.lineTo(tx - w / 2, botY)
      ctx.lineTo(tx + w / 2, botY)
      ctx.closePath()
      ctx.fill()
    }
  }

  // 草
  ctx.strokeStyle = 'rgba(50,100,65,0.85)'
  ctx.lineWidth = 1
  for (const g of scenery.grass) {
    const gx = g.x * W
    const gy = g.y * H
    ctx.beginPath()
    ctx.moveTo(gx, gy)
    ctx.quadraticCurveTo(gx + g.lean * 0.5, gy - g.h * 0.6, gx + g.lean, gy - g.h)
    ctx.stroke()
  }

  // 流星
  if (shoot) {
    const sx = shoot.x * W
    const sy = shoot.y * H
    const fade = Math.min(1, shoot.life / 0.4)
    const tailLen = 90
    const grad = ctx.createLinearGradient(sx, sy, sx - shoot.vx * tailLen, sy - shoot.vy * tailLen)
    grad.addColorStop(0, `rgba(255,255,255,${0.95 * fade})`)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.strokeStyle = grad
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx - shoot.vx * tailLen, sy - shoot.vy * tailLen)
    ctx.stroke()
    fillGlow(ctx, sx, sy, 10, `rgba(255,255,255,${0.9 * fade})`, 'rgba(255,255,255,0)')
  }

  // 闪光
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${flash * 0.85})`
    ctx.fillRect(0, 0, W, H)
  }
}
