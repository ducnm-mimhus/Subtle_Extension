import { createLogger } from 'src/shared/logger'
import { Pipeline } from 'src/offscreen/pipeline/pipeline'
import type { ExtensionMessage } from 'src/shared/messages'

const log = createLogger('Offscreen')

const pipeline = new Pipeline()

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  handleMessage(message).catch((err: unknown) => {
    log.error('Failed to handle message', { type: message.type, err })
  })
})

async function handleMessage(message: ExtensionMessage): Promise<void> {
  switch (message.type) {
    case 'AUDIO_STREAM_READY':
      await pipeline.start(message.streamId)
      break
    case 'STOP_TRANSLATION':
      await pipeline.stop()
      break
    case 'CHANGE_LANGUAGE':
      pipeline.setTargetLanguage(message.targetLanguage)
      break
  }
}

log.info('Offscreen document ready')
