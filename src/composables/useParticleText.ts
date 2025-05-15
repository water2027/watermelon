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
    this.size = getRandom(1.3 * devicePixelRatio, 4 * devicePixelRatio)
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
    this.ctx.fillStyle = '#544544f0'
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
    this.text = ''
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

export interface ParticleTextOptions {
  width?: number
  height?: number
  fontSize?: number
  textGenerator: () => () => string
}

export const renderParticleText = (canvas: HTMLCanvasElement, options: ParticleTextOptions) => {
  if (!canvas) {
    throw new Error('canvas is null')
  }
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  if (!ctx) {
    throw new Error('ctx is null')
  }

  const { width, height, fontSize, textGenerator } = options
  canvas.width = width || 800
  canvas.height = height || 600

  const particleGroup = new ParticleGroup(
    canvas,
    ctx,
    textGenerator,
    fontSize || 70 * devicePixelRatio,
  )

  return { draw: particleGroup.draw.bind(particleGroup) }
}
