import { createLogger } from 'src/shared/logger'

const log = createLogger('TabCapture')

export async function startTabCapture(tabId: number): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
      if (chrome.runtime.lastError) {
        const msg = chrome.runtime.lastError.message ?? 'tabCapture failed'
        log.error('getMediaStreamId failed', { msg })
        reject(new Error(msg))
        return
      }
      log.info('Tab capture stream acquired', { tabId })
      resolve(streamId)
    })
  })
}
