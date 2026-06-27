# CONTEXT — Extension dịch phụ đề cuộc họp (100% local)

> File này dùng làm ngữ cảnh cho AI assistant khi làm việc trên dự án.
> Tài liệu đầy đủ xem tại `docs/TECH-SPEC.md`.

---

## Dự án là gì

Chrome extension dịch phụ đề thời gian thực cho Google Meet. Chạy **100% trên máy người dùng** — không byte nào rời máy. Mỗi người cài trên máy riêng, tự chọn ngôn ngữ, không cần đồng bộ giữa các máy.

**Ngôn ngữ ưu tiên:** Nhật→Việt, Anh→Việt (và các cặp đa ngôn ngữ khác).

---

## Stack

| Hạng mục | Lựa chọn |
|---|---|
| Ngôn ngữ | TypeScript (strict) |
| Build | Vite + CRXJS plugin |
| Package manager | pnpm |
| Manifest | Chrome Manifest V3 |
| UI | Vanilla TS (không dùng React/Vue) |
| AI runtime | `@huggingface/transformers` (transformers.js) |
| Tăng tốc | WebGPU ưu tiên, fallback WASM |
| VAD | Silero VAD (ONNX/WASM) |
| STT | Whisper tiny/base |
| Dịch | NLLB-200-distilled-600M (dự phòng: Opus-MT) |
| Lưu transcript | IndexedDB (dùng thư viện `idb`) |
| Cache model | Cache API của trình duyệt |

---

## Kiến trúc — 4 context chính

```
Popup ◄──────────────────────► Service Worker
  (UI điều khiển)                (điều phối message)
                                        │
Content Script ◄────────────────────────┤
  (inject overlay phụ đề vào Meet)      │
                                        ▼
                               Offscreen Document
                               (VAD → Whisper → NLLB)
                                        │
                               IndexedDB + Cache API
```

**Nguyên tắc quan trọng nhất:**
- **Toàn bộ AI chạy trong Offscreen Document**, không phải Service Worker (SW bị Chrome cho ngủ sau 30s)
- Content Script là **nơi duy nhất** được chạm vào DOM của Meet
- Các context giao tiếp qua `chrome.runtime.sendMessage` — không gọi hàm trực tiếp

---

## Cấu trúc thư mục

```
src/
├── popup/               # UI điều khiển (bật/tắt, chọn ngôn ngữ, trạng thái)
│   ├── index.html
│   ├── Popup.ts
│   └── components/
│       ├── LanguageSelector.ts
│       ├── ModelDownloadProgress.ts
│       ├── StatusIndicator.ts
│       └── ConsentToggle.ts
│
├── content/             # chạy trong tab Meet
│   ├── content.ts
│   ├── SubtitleOverlay.ts   # div phụ đề, kéo thả, cỡ chữ
│   ├── overlay.css
│   └── meet-adapter.ts      # logic riêng cho DOM Meet
│
├── background/          # service worker
│   ├── service-worker.ts
│   ├── offscreen-manager.ts
│   └── tab-capture.ts
│
├── offscreen/           # nơi chạy AI — TRÁI TIM của dự án
│   ├── offscreen.html
│   ├── offscreen.ts
│   ├── pipeline/
│   │   ├── audio-processor.ts   # Web Audio API
│   │   ├── vad.ts               # Silero VAD, cắt chunk
│   │   ├── stt.ts               # Whisper wrapper
│   │   ├── translator.ts        # NLLB wrapper
│   │   └── pipeline.ts          # nối các bước, xử lý ca biên
│   └── model-loader.ts          # tải & cache model
│
├── shared/              # dùng chung mọi context
│   ├── messages.ts      # ⚠️ định nghĩa kiểu TẤT CẢ message — quan trọng
│   ├── types.ts
│   ├── constants.ts
│   ├── storage/
│   │   ├── transcript-db.ts
│   │   └── settings.ts
│   └── logger.ts        # không log nội dung họp
│
└── lib/
    ├── language-utils.ts
    └── perf.ts

spike/                   # code GĐ 0 — thử nghiệm, không vào extension
docs/
    TECH-SPEC.md
    CONTEXT.md           # file này
    DECISIONS.md         # nhật ký quyết định (ADR)
```

---

## Message types (shared/messages.ts)

Mọi giao tiếp giữa các context phải dùng các type này. Không tự tạo message tùy tiện.

```typescript
// Hướng: Popup → Service Worker
type StartTranslationMsg = {
  type: 'START_TRANSLATION'
  targetLanguage: LanguageCode
  tabId: number
}

type StopTranslationMsg = {
  type: 'STOP_TRANSLATION'
  tabId: number
}

type ChangeLanguageMsg = {
  type: 'CHANGE_LANGUAGE'
  targetLanguage: LanguageCode
}

// Hướng: Service Worker → Offscreen Document
type AudioStreamReadyMsg = {
  type: 'AUDIO_STREAM_READY'
  streamId: string
}

// Hướng: Offscreen Document → Service Worker → Content Script
type SubtitleReadyMsg = {
  type: 'SUBTITLE_READY'
  original: string         // text ngôn ngữ gốc
  translated: string       // text đã dịch
  timestamp: number
  isFinal: boolean         // false = interim, true = đã chắc chắn
}

// Hướng: Offscreen Document → Service Worker → Popup
type ModelLoadProgressMsg = {
  type: 'MODEL_LOAD_PROGRESS'
  modelName: string
  progress: number         // 0–100
  status: 'downloading' | 'loading' | 'ready' | 'error'
}

type PipelineStatusMsg = {
  type: 'PIPELINE_STATUS'
  status: 'idle' | 'listening' | 'processing' | 'error'
  errorMessage?: string
}

// Union type cho toàn bộ message
type ExtensionMessage =
  | StartTranslationMsg
  | StopTranslationMsg
  | ChangeLanguageMsg
  | AudioStreamReadyMsg
  | SubtitleReadyMsg
  | ModelLoadProgressMsg
  | PipelineStatusMsg
```

---

## Types cốt lõi (shared/types.ts)

```typescript
type LanguageCode =
  | 'ja'   // Nhật
  | 'en'   // Anh
  | 'vi'   // Việt
  | 'ko'   // Hàn
  | 'zh'   // Trung

type TranscriptEntry = {
  id: string
  timestamp: number
  original: string
  translated: string
  sourceLanguage: LanguageCode
  targetLanguage: LanguageCode
}

type ModelStatus = 'not-downloaded' | 'downloading' | 'loading' | 'ready' | 'error'

type PipelineStatus = 'idle' | 'listening' | 'processing' | 'error'

type AppSettings = {
  targetLanguage: LanguageCode
  subtitleFontSize: number        // px, default 16
  subtitlePosition: { x: number; y: number }
  consentGiven: boolean           // người dùng đã xác nhận thông báo ghi âm
}
```

---

## Constants (shared/constants.ts)

```typescript
const SUPPORTED_LANGUAGES: Record<LanguageCode, string> = {
  ja: '日本語',
  en: 'English',
  vi: 'Tiếng Việt',
  ko: '한국어',
  zh: '中文',
}

const WHISPER_MODEL = 'Xenova/whisper-tiny'           // nâng lên base/small sau khi đo
const NLLB_MODEL   = 'Xenova/nllb-200-distilled-600M'
const VAD_MODEL    = 'onnx-community/silero-vad'

const CHUNK_DURATION_MS = 3000   // cắt chunk mỗi 3 giây
const MAX_SUBTITLE_LINES = 3     // số dòng tối đa hiển thị đồng thời
const SUBTITLE_TIMEOUT_MS = 5000 // ẩn phụ đề sau 5s không có tiếng nói
```

---

## Ràng buộc tuyệt đối — KHÔNG được vi phạm

1. **Không gửi audio ra ngoài** dưới bất kỳ hình thức nào
2. **Không gửi nội dung họp (text đã transcribe) ra ngoài** — mọi xử lý local
3. **Không dùng localStorage** — dùng IndexedDB cho dữ liệu lớn, `chrome.storage.local` cho settings
4. **Không log nội dung họp** (transcript, audio) vào console — chỉ log metadata (latency, status)
5. **Không chạy inference trong Service Worker** — luôn dùng Offscreen Document
6. **Không import thư viện nặng vào content script** — content script phải nhẹ, chỉ xử lý DOM
7. **Không tự động capture tab** — phải có thao tác chủ động của người dùng

---

## Conventions

**Đặt tên file:** `kebab-case.ts` cho mọi file
**Đặt tên class:** `PascalCase`
**Đặt tên function/variable:** `camelCase`
**Đặt tên type/interface:** `PascalCase`, không dùng prefix `I`
**Đặt tên message type:** `SCREAMING_SNAKE_CASE` cho field `type`
**Import:** absolute từ `src/` — không dùng relative `../../`

**Comment:** comment bằng tiếng Anh trong code, comment TODO/FIXME phải có lý do cụ thể

**Error handling:** mọi thao tác với model, IndexedDB, chrome API đều phải có try/catch với error message rõ ràng

---

## Giai đoạn hiện tại

- [ ] GĐ 0 — Spike kỹ thuật: test Whisper + dịch trên máy văn phòng thật với audio tiếng Nhật thật
- [ ] GĐ 1 — Khung extension + audio capture + STT
- [ ] GĐ 2 — Dịch + overlay phụ đề (MVP đầu tiên)
- [ ] GĐ 3 — Đa ngôn ngữ
- [ ] GĐ 4 — Hoàn thiện UX cho người phổ thông
- [ ] GĐ 5 — Triển khai thử nội bộ

> Cập nhật giai đoạn hiện tại vào đây mỗi khi hoàn thành một cột mốc.

---

## Cách dùng file này

Đặt nội dung file này vào đầu mỗi cuộc trò chuyện với AI khi cần trợ giúp về dự án. AI sẽ hiểu stack, kiến trúc, convention và ràng buộc mà không cần giải thích lại từ đầu.

Khi có quyết định kiến trúc mới, cập nhật đồng thời:
1. File này (`CONTEXT.md`) — phần liên quan
2. `docs/TECH-SPEC.md` — mô tả đầy đủ
3. `docs/DECISIONS.md` — ghi lý do quyết định
