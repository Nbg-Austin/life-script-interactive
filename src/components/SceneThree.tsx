import { useEffect, useRef, useState } from 'react'
import { useCanvasAnimation } from '../hooks/useCanvasAnimation'
import {
  fillGlow,
  getPointerPosition,
  mulberry32,
  pointInRect,
  type CanvasSize,
  type Point,
  type Rect,
} from '../canvas/drawing'
import SceneHint from './SceneHint'

const HOME: Point = { x: 0.155, y: 0.905 }
const BRANCH_TARGETS: Record<'cleaner' | 'office' | 'car', Point> = {
  cleaner: { x: 0.285, y: 0.89 },
  office: { x: 0.515, y: 0.855 },
  car: { x: 0.705, y: 0.885 },
}
const BRANCH_DURATIONS = { cleaner: 2.4, office: 2.8, car: 3.6 }
const OFFICE: Rect = { x: 0.355, y: 0.075, width: 0.31, height: 0.49 }
const DOOR: Rect = { x: 0.482, y: 0.43, width: 0.07, height: 0.145 }

type Branch = 'cleaner' | 'office' | 'car'

interface Vehicle {
  x: number
  y: number
  v: number
  color: string
  dir: 1 | -1
}

interface SceneThreeProps {
  onComplete: () => void
}

export default function SceneThree({ onComplete }: SceneThreeProps) {
  const [selected, setSelected] = useState(false)
  const [branch, setBranch] = useState<Branch | null>(null)
  const branchTRef = useRef(0)
  const completedRef = useRef(false)
  const { canvasRef, sizeRef } = useCanvasAnimation((ctx, size, info) => {
    // 车辆推进
    for (const v of vehicles) {
      v.x += v.v * info.delta * v.dir
      if (v.dir === 1 && v.x > 1.15) v.x = -0.15
      if (v.dir === -1 && v.x < -0.15) v.x = 1.15
    }
    // 分支行走推进
    let personPos = HOME
    if (branch) {
      branchTRef.current = Math.min(1, branchTRef.current + info.delta / BRANCH_DURATIONS[branch])
      const t = branchTRef.current
      const tx = BRANCH_TARGETS[branch].x
      const ty = BRANCH_TARGETS[branch].y
      personPos = { x: HOME.x + (tx - HOME.x) * t, y: HOME.y + (ty - HOME.y) * t }
      if (t >= 1 && !completedRef.current) {
        completedRef.current = true
        window.setTimeout(onComplete, 600)
      }
    }
    draw(ctx, size, info, vehicles, walkers, selected, branch, personPos, branchTRef.current)
  })

  const vehicles: Vehicle[] = (() => {
    const colors = ['#c0392b', '#2c3e50', '#f1c40f', '#27ae60', '#2980b9', '#8e44ad', '#e67e22']
    const arr: Vehicle[] = []
    for (let i = 0; i < 7; i++) {
      arr.push({
        x: Math.random(),
        y: 0.82 + (i % 2) * 0.04,
        v: 0.08 + Math.random() * 0.1,
        color: colors[i % colors.length],
        dir: i % 2 === 0 ? 1 : -1,
      })
    }
    return arr
  })()

  const walkers: { x: number; y: number; s: number }[] = (() => {
    const rnd = mulberry32(29117)
    const arr: { x: number; y: number; s: number }[] = []
    for (let i = 0; i < 8; i++) {
      arr.push({
        x: OFFICE.x + 0.02 + rnd() * (OFFICE.width - 0.04),
        y: OFFICE.y + 0.05 + rnd() * (OFFICE.height - 0.1),
        s: 0.6 + rnd() * 0.6,
      })
    }
    return arr
  })()

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (completedRef.current || branch) return
    const size = sizeRef.current
    const p = getPointerPosition(e, canvasRef.current!, size)
    const nx = p.x / size.width
    const ny = p.y / size.height

    if (!selected) {
      // 先点左下角自己
      const dx = nx - HOME.x
      const dy = ny - HOME.y
      if (dx * dx + dy * dy < 0.02) {
        setSelected(true)
      }
      return
    }

    // 选分支
    if (pointInRect({ x: nx, y: ny }, { x: 0.22, y: 0.82, width: 0.12, height: 0.14 })) {
      setBranch('cleaner')
    } else if (pointInRect({ x: nx, y: ny }, DOOR)) {
      setBranch('office')
    } else if (pointInRect({ x: nx, y: ny }, { x: 0.66, y: 0.82, width: 0.12, height: 0.14 })) {
      setBranch('car')
    }
  }

  return (
    <div className="scene city-scene">
      <canvas
        ref={canvasRef}
        className="scene-canvas"
        onPointerDown={handlePointerDown}
      />
      <SceneHint text={branch ? '' : selected ? '现在，选择你想去的地方' : '先轻触左下角的自己'} />
    </div>
  )
}

function draw(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  info: { time: number },
  vehicles: Vehicle[],
  walkers: { x: number; y: number; s: number }[],
  selected: boolean,
  branch: Branch | null,
  personPos: Point,
  t: number,
) {
  const { width: W, height: H } = size

  // 天空（傍晚）
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#2c3e6b')
  sky.addColorStop(0.5, '#c97b5a')
  sky.addColorStop(0.75, '#e8a578')
  sky.addColorStop(1, '#3a3a4a')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // 太阳
  fillGlow(ctx, W * 0.7, H * 0.55, W * 0.12, 'rgba(255,220,150,0.9)', 'rgba(255,180,120,0)')

  // 远景楼群
  ctx.fillStyle = '#2a2a3a'
  for (let i = 0; i < 8; i++) {
    const bx = (i / 8) * W
    const bh = H * (0.2 + (i % 3) * 0.08)
    ctx.fillRect(bx, H * 0.6 - bh, W / 9, bh)
  }

  // 办公楼
  const ox = OFFICE.x * W
  const oy = OFFICE.y * H
  const ow = OFFICE.width * W
  const oh = OFFICE.height * H
  ctx.fillStyle = '#3d3d4d'
  ctx.fillRect(ox, oy, ow, oh)
  // 窗格
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 4; c++) {
      const wx = ox + 10 + c * (ow - 20) / 4
      const wy = oy + 12 + r * (oh - 30) / 5
      ctx.fillStyle = (r + c) % 2 === 0 ? '#f5d76e' : '#4a5568'
      ctx.fillRect(wx, wy, (ow - 30) / 5, (oh - 40) / 6)
    }
  }

  // 门
  const dx = DOOR.x * W
  const dy = DOOR.y * H
  const dw = DOOR.width * W
  const dh = DOOR.height * H
  ctx.fillStyle = '#1a1a24'
  ctx.fillRect(dx, dy, dw, dh)
  if (selected && !branch) {
    ctx.strokeStyle = 'rgba(255,230,150,0.8)'
    ctx.lineWidth = 2
    ctx.strokeRect(dx - 4, dy - 4, dw + 8, dh + 8)
  }

  // 路
  ctx.fillStyle = '#2a2a30'
  ctx.fillRect(0, H * 0.78, W, H * 0.14)
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 2
  ctx.setLineDash([20, 15])
  ctx.beginPath()
  ctx.moveTo(0, H * 0.85)
  ctx.lineTo(W, H * 0.85)
  ctx.stroke()
  ctx.setLineDash([])

  // 车辆
  for (const v of vehicles) {
    const vx = v.x * W
    const vy = v.y * H
    ctx.fillStyle = v.color
    ctx.fillRect(vx - 18, vy - 6, 36, 12)
    ctx.fillStyle = 'rgba(200,230,255,0.7)'
    ctx.fillRect(vx - 10, vy - 9, 12, 6)
  }

  // 人行道
  ctx.fillStyle = '#4a4a52'
  ctx.fillRect(0, H * 0.92, W, H * 0.08)

  // 清洁工
  const clx = BRANCH_TARGETS.cleaner.x * W
  const cly = BRANCH_TARGETS.cleaner.y * H
  ctx.fillStyle = '#c9a227'
  ctx.fillRect(clx - 6, cly - 20, 12, 18)
  ctx.fillStyle = '#f0d090'
  ctx.beginPath()
  ctx.arc(clx, cly - 24, 6, 0, Math.PI * 2)
  ctx.fill()

  // 自己（小人）
  const px = personPos.x * W
  const py = personPos.y * H
  if (selected) {
    ctx.strokeStyle = 'rgba(255,230,150,0.9)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(px, py - 14, 14 + Math.sin(info.time * 3) * 2, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = '#2c3e50'
  ctx.fillRect(px - 5, py - 24, 10, 20)
  ctx.fillStyle = '#f0d090'
  ctx.beginPath()
  ctx.arc(px, py - 28, 5, 0, Math.PI * 2)
  ctx.fill()
}
