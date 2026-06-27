import { createLogger } from 'src/shared/logger'
import { ensureOffscreenDocument } from 'src/background/offscreen-manager'
import { startTabCapture } from 'src/background/tab-capture'
import type { ExtensionMessage } from 'src/shared/messages'

const log = createLogger('SW')

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    handleMessage(message).then(sendResponse).catch((err: unknown) => {
      log.error('Message handler failed', { type: message.type, err })
      sendResponse({ error: String(err) })
    })
    return true // keep channel open for async response
  },
)

async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case 'START_TRANSLATION': {
      await ensureOffscreenDocument()
      const streamId = await startTabCapture(message.tabId)
      await chrome.runtime.sendMessage<ExtensionMessage>({
        type: 'AUDIO_STREAM_READY',
        streamId,
      })
      return { ok: true }
    }

    case 'STOP_TRANSLATION': {
      // Forward to offscreen to stop pipeline
      await chrome.runtime.sendMessage<ExtensionMessage>({
        type: 'STOP_TRANSLATION',
        tabId: message.tabId,
      })
      return { ok: true }
    }

    case 'CHANGE_LANGUAGE': {
      await chrome.runtime.sendMessage<ExtensionMessage>({
        type: 'CHANGE_LANGUAGE',
        targetLanguage: message.targetLanguage,
      })
      return { ok: true }
    }

    case 'SUBTITLE_READY': {
      // Forward subtitle from offscreen → active Meet tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, message)
      }
      // Also forward to popup for transcript display
      await chrome.runtime.sendMessage(message).catch(() => {
        // Popup might be closed — that's fine
      })
      return { ok: true }
    }

    case 'MODEL_LOAD_PROGRESS':
    case 'PIPELINE_STATUS': {
      // Forward status updates to popup
      await chrome.runtime.sendMessage(message).catch(() => {})
      return { ok: true }
    }

    default:
      log.warn('Unhandled message type', { type: (message as ExtensionMessage).type })
      return { ok: false }
  }
}

log.info('Service worker started')
