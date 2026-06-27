import { loadSettings, saveSettings } from 'src/shared/storage/settings'
import { createLogger } from 'src/shared/logger'
import type { ExtensionMessage } from 'src/shared/messages'

const log = createLogger('Popup')

const app = document.getElementById('app')!
app.innerHTML = `
  <h1>Subtle</h1>
  <button id="btn-start">Bắt đầu dịch</button>
  <button id="btn-stop" disabled>Dừng</button>
  <div id="status">Sẵn sàng</div>
`

const btnStart = document.getElementById('btn-start') as HTMLButtonElement
const btnStop = document.getElementById('btn-stop') as HTMLButtonElement
const statusEl = document.getElementById('status')!

function setStatus(text: string): void {
  statusEl.textContent = text
}

btnStart.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) {
    setStatus('Không tìm thấy tab Meet')
    return
  }
  const settings = await loadSettings()
  btnStart.disabled = true
  btnStop.disabled = false
  setStatus('Đang khởi động…')

  try {
    await chrome.runtime.sendMessage<ExtensionMessage>({
      type: 'START_TRANSLATION',
      targetLanguage: settings.targetLanguage,
      tabId: tab.id,
    })
  } catch (err) {
    log.error('START_TRANSLATION failed', { err })
    setStatus('Lỗi: không thể bắt đầu')
    btnStart.disabled = false
    btnStop.disabled = true
  }
})

btnStop.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) return
  btnStop.disabled = true
  btnStart.disabled = false
  setStatus('Đã dừng')

  await chrome.runtime.sendMessage<ExtensionMessage>({
    type: 'STOP_TRANSLATION',
    tabId: tab.id,
  })
})

// Listen for status updates from pipeline
chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type === 'MODEL_LOAD_PROGRESS') {
    setStatus(`Đang tải model ${message.modelName}: ${message.progress}%`)
  } else if (message.type === 'PIPELINE_STATUS') {
    const labels: Record<string, string> = {
      idle: 'Sẵn sàng',
      listening: 'Đang nghe…',
      processing: 'Đang xử lý…',
      error: `Lỗi: ${message.errorMessage ?? ''}`,
    }
    setStatus(labels[message.status] ?? message.status)
  }
})

log.info('Popup loaded')
