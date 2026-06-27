export type LanguageCode = 'ja' | 'en' | 'vi' | 'ko' | 'zh'

export type TranscriptEntry = {
  id: string
  timestamp: number
  original: string
  translated: string
  sourceLanguage: LanguageCode
  targetLanguage: LanguageCode
}

export type ModelStatus = 'not-downloaded' | 'downloading' | 'loading' | 'ready' | 'error'

export type PipelineStatus = 'idle' | 'listening' | 'processing' | 'error'

export type AppSettings = {
  targetLanguage: LanguageCode
  subtitleFontSize: number
  subtitlePosition: { x: number; y: number }
  consentGiven: boolean
}
