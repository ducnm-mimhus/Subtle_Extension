import type { LanguageCode } from 'src/shared/types'

export const SUPPORTED_LANGUAGES: Record<LanguageCode, string> = {
  ja: '日本語',
  en: 'English',
  vi: 'Tiếng Việt',
  ko: '한국어',
  zh: '中文',
}

export const WHISPER_MODEL = 'Xenova/whisper-tiny'
export const NLLB_MODEL = 'Xenova/nllb-200-distilled-600M'
export const VAD_MODEL = 'onnx-community/silero-vad'

export const CHUNK_DURATION_MS = 3000
export const MAX_SUBTITLE_LINES = 3
export const SUBTITLE_TIMEOUT_MS = 5000

export const OFFSCREEN_DOCUMENT_URL = 'src/offscreen/offscreen.html'
