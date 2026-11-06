import { useRef, useState } from 'react'
import { useCanvasAnimation } from '../hooks/useCanvasAnimation'
import { getPointerPosition, mulberry32, type CanvasSize, type Rect } from '../canvas/drawing'
import SceneHint from './SceneHint'

const COUNTDOWN_VALUES = [100, 50, 25, 10, 7, 3, 2, 1]
const COMPLETE_DELAY_MS = 1020

interface Dust {
  x: number
  y: number
  r: number
  drift: number
}

interface SceneTwoProps {
  onComplete: () => void
}

export default function SceneTwo({ onComplete }: SceneTwoProps) {
  const [step, setStep] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const finishedRef = useRef(false)
  const flashRef = useRef(0)
  const { canvasRef, sizeRef } = useCanvasAnimation((ctx, size, info) => {
    if (flashRef.current > 0) flashRef.current = Math.max(0, flashRef.current - info.delta * 1.5)
    draw(ctx, size, info.time, COUNTDOWN_VALUES[step], dust, flashRef.current)
  })

  const dust: Dust[] = (() => {
    const rnd = mulberry32(50312)
    const arr: Dust[] = []
    for (let i = 0; i < 20; i++) {
      arr.push({ x: rnd(), y: rnd(), r: 1 + rnd() * 2, drift: rnd() * Math.PI * 2 })
    }
    return arr
  })()

  const handleCountdownClick = () => {
    if (finishedRef.current) return
    if (step < COUNTDOWN_VALUES.length - 1) {
      setStep(step + 1)
    } else if (!finishedRef.current) {
      finishedRef.current = true
      setFinishing(true)
      flashRef.current = 1
      window.setTimeout(onComplete, COMPLETE_DELAY_MS)
    }
  }

  const boardRect: Rect = { x: 0.18, y: 0.12, width: 0.64, height: 0.32 }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const size = sizeRef.current
    const p = getPointerPosition(e, canvasRef.current!, size)
    if (
      p.x > boardRect.x * size.width &&
      p.x < (boardRect.x + boardRect.width) * size.width &&
      p.y > boardRect.y * size.height &&
      p.y < (boardRect.y + boardRect.height) * size.height
    ) {
      handleCountdownClick()
    }
  }

  return (
    <div className="scene classroom-scene">
      <canvas
        ref={canvasRef}
        className="scene-canvas"
        onPointerDown={handlePointerDown}
      />
      <button
        className="countdown-hit"
        onClick={handleCountdownClick}
        style={{
          left: `${(boardRect.x + boardRect.width / 2) * 100}%`,
          top: `${(boardRect.y + boardRect.height / 2) * 100}%`,
        }}
        aria-label="倒计时"
      />
      <SceneHint text={finishing ? '' : '轻触黑板上的倒计时'} />
      {flashRef.current > 0 && <div className="classroom-flash" />}
    </div>
  )
}

function draw(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  time: number,
  value: number,
  dust: Dust[],
  flash: number,
) {
  const { width: W, height: H } = size

  // 墙（暖黄灯光）
  const wall = ctx.createLinearGradient(0, 0, 0, H)
  wall.addColorStop(0, '#4a3f30')
  wall.addColorStop(0.7, '#3a3025')
  wall.addColorStop(1, '#2a2218')
  ctx.fillStyle = wall
  ctx.fillRect(0, 0, W, H)

  // 左墙窗户（深夜透进冷蓝光）
  ctx.fillStyle = '#1a2540'
  ctx.fillRect(W * 0.04, H * 0.1, W * 0.1, H * 0.35)
  ctx.strokeStyle = '#2a2018'
  ctx.lineWidth = 3
  ctx.strokeRect(W * 0.04, H * 0.1, W * 0.1, H * 0.35)
  ctx.beginPath()
  ctx.moveTo(W * 0.09, H * 0.1)
  ctx.lineTo(W * 0.09, H * 0.45)
  ctx.moveTo(W * 0.04, H * 0.275)
  ctx.lineTo(W * 0.14, H * 0.275)
  ctx.stroke()

  // 地板
  const floor = ctx.createLinearGradient(0, H * 0.78, 0, H)
  floor.addColorStop(0, '#5a4028')
  floor.addColorStop(1, '#3a2818')
  ctx.fillStyle = floor
  ctx.fillRect(0, H * 0.78, W, H * 0.22)
  // 地板缝
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'
  ctx.lineWidth = 1
  for (let i = 1; i < 6; i++) {
    ctx.beginPath()
    ctx.moveTo(0, H * 0.78 + i * H * 0.04)
    ctx.lineTo(W, H * 0.78 + i * H * 0.04)
    ctx.stroke()
  }

  // 黑板框
  const bx = 0.18 * W
  const by = 0.12 * H
  const bw = 0.64 * W
  const bh = 0.32 * H
  ctx.fillStyle = '#3a2818'
  ctx.fillRect(bx - 10, by - 10, bw + 20, bh + 20)
  // 黑板
  ctx.fillStyle = '#1e3d2f'
  ctx.fillRect(bx, by, bw, bh)
  // 黑板反光
  const bglow = ctx.createLinearGradient(bx, by, bx + bw, by + bh)
  bglow.addColorStop(0, 'rgba(255,255,255,0.04)')
  bglow.addColorStop(0.5, 'rgba(255,255,255,0)')
  bglow.addColorStop(1, 'rgba(255,255,255,0.06)')
  ctx.fillStyle = bglow
  ctx.fillRect(bx, by, bw, bh)

  // 黑板文字
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = `${Math.round(H * 0.045)}px "Microsoft YaHei", sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('高考倒计时', W / 2, by + H * 0.06)

  // 倒计时数字（带粉笔质感）
  ctx.font = `bold ${Math.round(H * 0.16)}px "Consolas", "Microsoft YaHei", monospace`
  ctx.fillStyle = '#ffe9a8'
  ctx.shadowColor = 'rgba(255,233,168,0.4)'
  ctx.shadowBlur = 8
  ctx.fillText(String(value), W / 2, by + bh * 0.62)
  ctx.shadowBlur = 0

  ctx.font = `${Math.round(H * 0.03)}px "Microsoft YaHei", sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.fillText('坚持 · 专注 · 沉着', W / 2, by + bh - H * 0.02)

  // 挂钟
  const cx = 0.88 * W
  const cy = 0.2 * H
  const cr = 0.055 * H
  ctx.fillStyle = '#e8e4d8'
  ctx.beginPath()
  ctx.arc(cx, cy, cr, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2
  ctx.stroke()
  // 钟刻度
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * (cr - 4), cy + Math.sin(a) * (cr - 4))
    ctx.lineTo(cx + Math.cos(a) * (cr - 1), cy + Math.sin(a) * (cr - 1))
    ctx.stroke()
  }
  // 时针分针
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + cr * 0.5, cy - cr * 0.3)
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx, cy - cr * 0.7)
  ctx.stroke()
  ctx.fillStyle = '#c0392b'
  ctx.beginPath()
  ctx.arc(cx, cy, 2, 0, Math.PI * 2)
  ctx.fill()

  // 加油海报（黑板右侧墙）
  const px = 0.82 * W
  const py = 0.42 * H
  ctx.fillStyle = '#f5e6c8'
  ctx.fillRect(px, py, W * 0.1, H * 0.14)
  ctx.strokeStyle = '#c9a96e'
  ctx.lineWidth = 2
  ctx.strokeRect(px, py, W * 0.1, H * 0.14)
  ctx.fillStyle = '#c0392b'
  ctx.font = `bold ${Math.round(H * 0.025)}px "Microsoft YaHei"`
  ctx.fillText('加油', px + W * 0.05, py + H * 0.05)
  ctx.fillStyle = '#333'
  ctx.font = `${Math.round(H * 0.018)}px "Microsoft YaHei"`
  ctx.fillText('必胜', px + W * 0.05, py + H * 0.09)

  // 老师（黑板右侧，剪影）
  const tx = 0.78 * W
  const ty = 0.5 * H
  ctx.fillStyle = '#2a2530'
  ctx.fillRect(tx - 8, ty, 16, H * 0.18) // 身体
  ctx.fillStyle = '#e8c9a0'
  ctx.beginPath()
  ctx.arc(tx, ty - 8, 9, 0, Math.PI * 2) // 头
  ctx.fill()
  // 手臂（拿粉笔）
  ctx.strokeStyle = '#2a2530'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(tx, ty + 5)
  ctx.lineTo(tx - 20, ty - 5)
  ctx.stroke()

  // 两侧学生剪影（靠墙坐）
  const drawStudent = (sx: number, sy: number, s: number) => {
    ctx.fillStyle = '#1a1a22'
    ctx.fillRect(sx - 6 * s, sy, 12 * s, H * 0.12 * s) // 身体
    ctx.fillStyle = '#d4a878'
    ctx.beginPath()
    ctx.arc(sx, sy - 6 * s, 6 * s, 0, Math.PI * 2)
    ctx.fill()
  }
  drawStudent(0.08 * W, 0.62 * H, 1)
  drawStudent(0.13 * W, 0.64 * H, 0.9)
  drawStudent(0.92 * W, 0.63 * H, 1)
  drawStudent(0.87 * W, 0.65 * H, 0.9)

  // 前排课桌（前景）
  ctx.fillStyle = '#5a4028'
  ctx.fillRect(0, H * 0.85, W, H * 0.15)
  ctx.fillStyle = '#3a2a18'
  ctx.fillRect(0, H * 0.85, W, 4)

  // 课桌上的书
  const bookY = H * 0.87
  ctx.fillStyle = '#c0392b'
  ctx.fillRect(W * 0.2, bookY, W * 0.12, 8)
  ctx.fillStyle = '#2980b9'
  ctx.fillRect(W * 0.22, bookY - 6, W * 0.1, 6)
  ctx.fillStyle = '#f5e6c8'
  ctx.fillRect(W * 0.22, bookY - 6, W * 0.1, 2) // 书页
  // 笔
  ctx.strokeStyle = '#2c3e50'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(W * 0.5, bookY + 4)
  ctx.lineTo(W * 0.58, bookY - 2)
  ctx.stroke()
  // 书签
  ctx.fillStyle = '#e74c3c'
  ctx.fillRect(W * 0.7, bookY, 4, 14)

  // 尘埃（暖光里飘）
  ctx.fillStyle = 'rgba(255,240,200,0.3)'
  for (const d of dust) {
    const dx = (d.x + Math.sin(time * 0.3 + d.drift) * 0.01) * W
    const dy = (d.y + Math.cos(time * 0.2 + d.drift) * 0.01) * H
    ctx.beginPath()
    ctx.arc(dx, dy, d.r, 0, Math.PI * 2)
    ctx.fill()
  }

  // 顶部灯光
  const light = ctx.createRadialGradient(W / 2, 0, 0, W / 2, H * 0.3, W * 0.7)
  light.addColorStop(0, 'rgba(255,220,150,0.25)')
  light.addColorStop(1, 'rgba(255,220,150,0)')
  ctx.fillStyle = light
  ctx.fillRect(0, 0, W, H)

  if (flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${flash * 0.9})`
    ctx.fillRect(0, 0, W, H)
  }
}
