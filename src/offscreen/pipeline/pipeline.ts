import { createLogger } from 'src/shared/logger'
import type { LanguageCode } from 'src/shared/types'

const log = createLogger('Pipeline')

// TODO GĐ1: wire AudioProcessor → VAD → STT → Translator
export class Pipeline {
  private targetLanguage: LanguageCode = 'vi'
  private running = false

  async start(streamId: string): Promise<void> {
    if (this.running) {
      log.warn('Pipeline already running')
      return
    }
    this.running = true
    log.info('Pipeline started', { streamId })
    // GĐ1: AudioProcessor.fromStreamId(streamId) → ...
  }

  async stop(): Promise<void> {
    if (!this.running) return
    this.running = false
    log.info('Pipeline stopped')
  }

  setTargetLanguage(lang: LanguageCode): void {
    this.targetLanguage = lang
    log.info('Target language changed', { lang })
  }
}
