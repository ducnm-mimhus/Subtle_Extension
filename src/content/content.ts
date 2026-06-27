import { SubtitleOverlay } from 'src/content/SubtitleOverlay'
import type { ExtensionMessage, SubtitleReadyMsg } from 'src/shared/messages'
import { createLogger } from 'src/shared/logger'

const log = createLogger('Content')

const overlay = new SubtitleOverlay()

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type === 'SUBTITLE_READY') {
    handleSubtitle(message)
  }
})

function handleSubtitle(msg: SubtitleReadyMsg): void {
  overlay.show(msg.translated, msg.isFinal)
}

log.info('Content script loaded on Meet tab')
