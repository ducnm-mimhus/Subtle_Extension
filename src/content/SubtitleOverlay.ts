import { MAX_SUBTITLE_LINES, SUBTITLE_TIMEOUT_MS } from 'src/shared/constants'

export class SubtitleOverlay {
  private container: HTMLDivElement
  private lines: string[] = []
  private hideTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    this.container = this.createContainer()
    document.body.appendChild(this.container)
  }

  show(text: string, isFinal: boolean): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    if (isFinal) {
      this.lines.push(text)
      if (this.lines.length > MAX_SUBTITLE_LINES) {
        this.lines.shift()
      }
    }

    this.container.textContent = isFinal ? this.lines.join('\n') : text
    this.container.style.display = 'block'

    this.hideTimer = setTimeout(() => {
      this.container.style.display = 'none'
      this.lines = []
    }, SUBTITLE_TIMEOUT_MS)
  }

  private createContainer(): HTMLDivElement {
    const el = document.createElement('div')
    el.id = 'subtle-overlay'
    Object.assign(el.style, {
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '999999',
      background: 'rgba(0,0,0,0.75)',
      color: '#fff',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '16px',
      lineHeight: '1.5',
      maxWidth: '80vw',
      textAlign: 'center',
      whiteSpace: 'pre-wrap',
      display: 'none',
      cursor: 'move',
      userSelect: 'none',
    } satisfies Partial<CSSStyleDeclaration>)
    this.enableDrag(el)
    return el
  }

  private enableDrag(el: HTMLDivElement): void {
    let offsetX = 0, offsetY = 0, startX = 0, startY = 0

    el.addEventListener('mousedown', (e) => {
      startX = e.clientX - offsetX
      startY = e.clientY - offsetY

      const onMove = (ev: MouseEvent) => {
        offsetX = ev.clientX - startX
        offsetY = ev.clientY - startY
        el.style.transform = `translateX(calc(-50% + ${offsetX}px)) translateY(${offsetY}px)`
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })
  }
}
