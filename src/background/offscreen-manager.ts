import { OFFSCREEN_DOCUMENT_URL } from 'src/shared/constants'
import { createLogger } from 'src/shared/logger'

const log = createLogger('OffscreenManager')

export async function ensureOffscreenDocument(): Promise<void> {
  const existing = await chrome.offscreen.hasDocument()
  if (existing) return

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_URL,
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification: 'Run VAD, Whisper STT and translation pipeline on captured audio',
  })

  log.info('Offscreen document created')
}

export async function closeOffscreenDocument(): Promise<void> {
  const existing = await chrome.offscreen.hasDocument()
  if (!existing) return
  await chrome.offscreen.closeDocument()
  log.info('Offscreen document closed')
}
