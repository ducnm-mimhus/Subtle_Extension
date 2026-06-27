import type { LanguageCode, ModelStatus, PipelineStatus } from 'src/shared/types'

// Popup → Service Worker
export type StartTranslationMsg = {
  type: 'START_TRANSLATION'
  targetLanguage: LanguageCode
  tabId: number
}

export type StopTranslationMsg = {
  type: 'STOP_TRANSLATION'
  tabId: number
}

export type ChangeLanguageMsg = {
  type: 'CHANGE_LANGUAGE'
  targetLanguage: LanguageCode
}

// Service Worker → Offscreen Document
export type AudioStreamReadyMsg = {
  type: 'AUDIO_STREAM_READY'
  streamId: string
}

// Offscreen Document → Service Worker → Content Script
export type SubtitleReadyMsg = {
  type: 'SUBTITLE_READY'
  original: string
  translated: string
  timestamp: number
  isFinal: boolean
}

// Offscreen Document → Service Worker → Popup
export type ModelLoadProgressMsg = {
  type: 'MODEL_LOAD_PROGRESS'
  modelName: string
  progress: number // 0–100
  status: ModelStatus
}

export type PipelineStatusMsg = {
  type: 'PIPELINE_STATUS'
  status: PipelineStatus
  errorMessage?: string
}

export type ExtensionMessage =
  | StartTranslationMsg
  | StopTranslationMsg
  | ChangeLanguageMsg
  | AudioStreamReadyMsg
  | SubtitleReadyMsg
  | ModelLoadProgressMsg
  | PipelineStatusMsg
