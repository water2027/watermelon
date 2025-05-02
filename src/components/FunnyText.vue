<script lang="ts" setup>
import { useTemplateRef, onMounted } from 'vue'

const props = defineProps<{
  width: number
  height: number
  textSize?: number
}>()

function getRandom(min: number, max: number) {
  return Math.random() * (max - min) + min
}

class Particle {
  private ctx: CanvasRenderingContext2D
  private size: number
  private x: number
  private y: number
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.size = getRandom(2 * devicePixelRatio, 7 * devicePixelRatio)
    const r = Math.min(canvas.width, canvas.height) / 2
    const rad = (getRandom(0, 2 * Math.PI) * 180) / Math.PI
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    this.x = cx + r * Math.cos(rad)
    this.y = cy + r * Math.sin(rad)
  }

  draw() {
    this.ctx.beginPath()
    this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    this.ctx.fillStyle = '#544544a0'
    this.ctx.fill()
  }

  moveTo(tx: number, ty: number) {
    const duration = 500
    const sx = this.x
    const sy = this.y
    const xSpeed = (tx - sx) / duration
    const ySpeed = (ty - sy) / duration
    const startTime = Date.now()
    const _move = () => {
      const t = Date.now() - startTime
      const x = sx + xSpeed * t
      const y = sy + ySpeed * t
      this.x = x
      this.y = y
      if (t >= duration) {
        this.x = tx
        this.y = ty
        return
      }
      requestAnimationFrame(_move)
    }
    _move()
  }
}

class ParticleGroup {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private generator: () => string
  private particles: Particle[]
  private text: string
  private textSize: number
  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    generator: () => () => string,
    textSize: number = 70,
  ) {
    this.canvas = canvas
    this.ctx = ctx
    this.generator = generator()
    this.text = this.generator()
    this.particles = []
    this.textSize = textSize * devicePixelRatio || 70 * devicePixelRatio
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  update() {
    const curText = this.generator()
    if (this.text === curText) {
      return
    }
    this.clear()
    this.text = curText
    const { width, height } = this.canvas
    this.ctx.fillStyle = '#000'
    this.ctx.textBaseline = 'middle'
    this.ctx.font = `${this.textSize}px sans-serif`
    this.ctx.textAlign = 'center'
    this.ctx.fillText(this.text, width / 2, height / 2)

    const points = this.getPoints()
    this.clear()
    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i]
      let p = this.particles[i]
      if (!p) {
        p = new Particle(this.canvas, this.ctx)
        this.particles.push(p)
      }
      p.moveTo(x, y)
    }
    if (points.length < this.particles.length) {
      this.particles.splice(points.length)
    }
  }

  getPoints() {
    const points = []
    const { data } = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const gap = 6
    for (let i = 0; i < this.canvas.width; i += gap) {
      for (let j = 0; j < this.canvas.height; j += gap) {
        const index = (i + j * this.canvas.width) * 4
        const r = data[index]
        const g = data[index + 1]
        const b = data[index + 2]
        const a = data[index + 3]
        if (r === 0 && g === 0 && b === 0 && a > 0) {
          points.push([i, j])
        }
      }
    }
    return points
  }

  draw() {
    this.clear()
    this.update()
    for (const p of this.particles) {
      p.draw()
    }
    requestAnimationFrame(this.draw.bind(this))
  }
}

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const textGenerator = () => {
  let i = 0
  const texts = ['Hallo', 'How are you', '你好']
  let last = new Date()
  return () => {
    const now = new Date()
    if (now.getTime() - last.getTime() > 1000) {
      last = now
      i++
      if (i >= texts.length) {
        i = 0
      }
    }
    return texts[i % texts.length]
  }
}

onMounted(() => {
  if (!canvas.value) {
    console.error('canvas is null')
    return
  }
  const ctx = canvas.value.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    console.error('ctx is null')
    return
  }
  const particleGroup = new ParticleGroup(canvas.value, ctx, textGenerator, props.textSize)
  canvas.value!.height = props.height
  canvas.value!.width = props.width
  particleGroup.draw()
})
</script>

<template>
  <canvas ref="canvas"></canvas>
</template>
