# Tài liệu kỹ thuật — Extension dịch phụ đề cuộc họp (100% local)

> **Tài liệu này là kim chỉ nam kỹ thuật cho toàn bộ dự án.** Mọi quyết định về kiến trúc, công nghệ, cấu trúc code, và lộ trình đều ghi ở đây. Cập nhật tài liệu này mỗi khi có quyết định lớn thay đổi.

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Vấn đề & định vị](#2-vấn-đề--định-vị)
3. [Nguyên tắc thiết kế](#3-nguyên-tắc-thiết-kế)
4. [Kiến trúc tổng thể](#4-kiến-trúc-tổng-thể)
5. [Công nghệ sử dụng](#5-công-nghệ-sử-dụng)
6. [Luồng dữ liệu](#6-luồng-dữ-liệu)
7. [Cấu trúc thư mục](#7-cấu-trúc-thư-mục)
8. [Các quyết định kỹ thuật then chốt](#8-các-quyết-định-kỹ-thuật-then-chốt)
9. [Lộ trình phát triển](#9-lộ-trình-phát-triển)
10. [Rủi ro & cách giảm thiểu](#10-rủi-ro--cách-giảm-thiểu)
11. [Tiêu chí chất lượng](#11-tiêu-chí-chất-lượng)
12. [Phụ lục: thuật ngữ](#12-phụ-lục-thuật-ngữ)

---

## 1. Tổng quan dự án

### Mục tiêu MVP

Một Chrome extension dịch phụ đề thời gian thực cho cuộc họp Google Meet, chạy **hoàn toàn trên máy người dùng** (không byte nào rời máy), hỗ trợ đa ngôn ngữ, dễ cài và dễ dùng cho người không rành công nghệ.

### Một dòng mô tả

> Phụ đề dịch sống, riêng tư tuyệt đối, hiện ngay trên màn hình họp — để người yếu ngoại ngữ hiểu được khách hàng đang nói gì, ngay tại chỗ.

### Bối cảnh phát triển

- 1 lập trình viên (JavaScript/TypeScript)
- Làm ngoài giờ
- Không giới hạn thời gian — ưu tiên làm đúng phần lõi
- Tập trung hoàn thiện sản phẩm trước; kinh doanh tính sau

---

## 2. Vấn đề & định vị

### Vấn đề cốt lõi

Trong cuộc họp với đối tác nước ngoài (ví dụ khách Nhật), thường chỉ có phiên dịch viên và một vài người thực sự hiểu nội dung. Những người còn lại trong phòng — có thể cả chục người — ngồi như người ngoài cuộc, phải đợi bản tóm tắt sau cuộc họp mới nắm được chuyện gì xảy ra.

### Ba lợi ích lớn cho doanh nghiệp

1. **Tránh lãng phí thời gian** — mọi người nắm bắt ngay trong lúc khách đang nói, không còn độ trễ giữa "lúc thông tin được trao đổi" và "lúc mọi người hiểu".
2. **Giảm phụ thuộc và bổ khuyết cho phiên dịch** — người am hiểu chuyên môn có thể phát hiện và sửa ngay chỗ phiên dịch sai thuật ngữ chuyên ngành hoặc bỏ sót. Phiên dịch lo ngôn ngữ, chuyên gia lo chính xác nghiệp vụ.
3. **Hiểu và phản hồi ngay tại chỗ** — phản hồi, đặt câu hỏi, xử lý vấn đề ngay trong cuộc họp thay vì phát hiện sau khi đọc tóm tắt, lúc cơ hội đã trôi qua.

### Định vị

- **Bổ sung cho phiên dịch, không thay thế.** Không cạnh tranh với phiên dịch viên; phục vụ những người đang bị bỏ rơi trong phòng họp.
- **100% on-device.** Nội dung họp không bao giờ rời máy — quan trọng với họp có thông tin nhạy cảm.
- **Âm thầm, giữ thể diện.** Mỗi người tự xem phụ đề trên máy mình; không ai biết ai đang dùng.

### Mô hình sử dụng

Mọi người cùng vào Meet, mỗi người dùng máy riêng. Mỗi máy tự cài extension, tự capture audio, tự xử lý local, tự hiển thị phụ đề theo ngôn ngữ mỗi người chọn. Không cần máy chủ trung tâm, không cần đồng bộ giữa các máy.

---

## 3. Nguyên tắc thiết kế

Những nguyên tắc này là bất biến, dùng để giải quyết mọi tranh cãi về thiết kế sau này:

1. **Local-first tuyệt đối.** Không có bước nào gửi audio hay nội dung họp ra ngoài. Đây là lời hứa cốt lõi, không đánh đổi trong MVP.
2. **Chứng minh phần rủi ro nhất trước.** Luôn xác thực giả định khó nhất (hiệu năng, chất lượng dịch) trước khi xây phần dễ.
3. **Đơn giản cho người dùng phổ thông.** Người dùng là nhân viên văn phòng bình thường, không phải dev. Mọi ma sát đều phải được loại bỏ.
4. **Mỗi máy độc lập.** Không có trạng thái chia sẻ giữa các máy. Kiến trúc phân tán hoàn toàn.
5. **Đo, đừng đoán.** Mọi quyết định về model/hiệu năng dựa trên số đo thực tế trên máy thật, không phải lý thuyết.

---

## 4. Kiến trúc tổng thể

### Sơ đồ thành phần (theo lớp)

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension (MV3)                     │
│                                                              │
│  ┌────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │   Popup    │    │ Content Script│    │ Service Worker  │  │
│  │  (UI điều  │◄──►│ (overlay phụ  │◄──►│  (điều phối,    │  │
│  │   khiển)   │    │  đề trên Meet)│    │   message bus)  │  │
│  └────────────┘    └──────────────┘    └────────┬────────┘  │
│                                                  │           │
│                                         ┌────────▼────────┐  │
│                                         │ Offscreen Doc   │  │
│                                         │ (chạy AI nặng)  │  │
│                                         │                 │  │
│                                         │  ┌───────────┐  │  │
│                                         │  │   VAD     │  │  │
│                                         │  └─────┬─────┘  │  │
│                                         │  ┌─────▼─────┐  │  │
│                                         │  │  Whisper  │  │  │
│                                         │  │   (STT)   │  │  │
│                                         │  └─────┬─────┘  │  │
│                                         │  ┌─────▼─────┐  │  │
│                                         │  │Translation│  │  │
│                                         │  │  (NLLB)   │  │  │
│                                         │  └───────────┘  │  │
│                                         └─────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  IndexedDB (transcript song ngữ) + Cache API (model)  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │ chrome.tabCapture
                         │
                  ┌──────┴───────┐
                  │  Tab Google  │
                  │     Meet     │
                  └──────────────┘
```

### Vai trò từng thành phần

| Thành phần             | Vai trò                                                             | Lý do tồn tại                                                          |
| ---------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Popup**              | Bật/tắt dịch, chọn ngôn ngữ, cài đặt, hiển thị trạng thái tải model | Giao diện điều khiển chính của người dùng                              |
| **Content Script**     | Inject overlay phụ đề vào trang Meet, nhận text đã dịch và render   | Là cầu nối duy nhất chạm vào DOM của Meet                              |
| **Service Worker**     | Điều phối message giữa các thành phần, quản lý vòng đời             | Trung tâm điều phối của MV3                                            |
| **Offscreen Document** | Chạy toàn bộ pipeline AI (VAD → STT → dịch)                         | Service Worker bị Chrome cho ngủ; Offscreen Doc chạy nền nặng bền vững |
| **IndexedDB**          | Lưu transcript song ngữ cục bộ                                      | Lưu trữ bền, dung lượng lớn, không cần server                          |
| **Cache API**          | Lưu model đã tải về                                                 | Tránh tải lại model mỗi lần dùng                                       |

---

## 5. Công nghệ sử dụng

### Nền tảng

| Hạng mục        | Lựa chọn            | Ghi chú                                  |
| --------------- | ------------------- | ---------------------------------------- |
| Manifest        | Chrome Manifest V3  | Bắt buộc với extension mới               |
| Ngôn ngữ        | TypeScript          | Type safety cho dự án phức tạp           |
| Build tool      | Vite + CRXJS plugin | Build extension MV3 hiện đại, hot reload |
| Package manager | pnpm                | Nhanh, tiết kiệm dung lượng              |

### Lõi AI (chạy trong trình duyệt)

| Hạng mục                 | Lựa chọn chính                                | Phương án dự phòng                |
| ------------------------ | --------------------------------------------- | --------------------------------- |
| Runtime AI               | `@huggingface/transformers` (transformers.js) | —                                 |
| Tăng tốc                 | WebGPU                                        | WASM (khi không có WebGPU)        |
| Voice Activity Detection | Silero VAD (ONNX, chạy WASM)                  | —                                 |
| Speech-to-text           | Whisper `tiny` hoặc `base`                    | `whisper-small` nếu máy đủ khỏe   |
| Dịch máy                 | NLLB-200-distilled-600M                       | Opus-MT (nhẹ hơn, cho cặp cụ thể) |

### Lý do chọn từng thứ

**transformers.js**: thư viện chính thức của Hugging Face cho phép chạy model AI client-side qua WebGPU/WASM. Hỗ trợ sẵn cả Whisper lẫn các model dịch. Đây là nền tảng làm "100% local" khả thi.

**Whisper tiny/base trước**: model nhỏ để đảm bảo chạy được trên máy văn phòng phổ thông. Nâng lên `small` chỉ khi Giai đoạn 0 chứng minh máy đủ khỏe.

**NLLB-200**: hỗ trợ 200 ngôn ngữ trong một model, gồm tiếng Việt, Nhật, Anh — phù hợp mục tiêu đa ngôn ngữ. Opus-MT là dự phòng cho từng cặp cụ thể nếu cần nhẹ hơn.

**Silero VAD**: chỉ kích hoạt pipeline khi có tiếng nói, tránh lãng phí tài nguyên xử lý khoảng lặng — quan trọng khi máy phải chạy liên tục suốt cuộc họp.

### Thư viện hỗ trợ (dự kiến)

- `idb` — wrapper gọn cho IndexedDB
- `comlink` — giao tiếp gọn giữa các context (Worker/Offscreen) nếu cần
- Một thư viện UI nhẹ cho popup (cân nhắc: Preact hoặc vanilla, tránh React nặng cho extension)

---

## 6. Luồng dữ liệu

### Luồng chính (từ khi người dùng bấm "Bắt đầu dịch")

```
1. Người dùng bấm "Bắt đầu dịch" trong Popup
        │
        ▼
2. Service Worker nhận lệnh, yêu cầu chrome.tabCapture
   (Chrome hiện hộp xin phép — người dùng phải đồng ý)
        │
        ▼
3. Audio stream của tab Meet được chuyển tới Offscreen Document
        │
        ▼
4. Web Audio API xử lý stream → đưa vào VAD
        │
        ▼
5. VAD phát hiện đoạn có tiếng nói → cắt thành chunk
        │
        ▼
6. Whisper xử lý từng chunk → text ngôn ngữ gốc
        │
        ▼
7. Model dịch chuyển text → ngôn ngữ đích người dùng chọn
        │
        ▼
8. Text gốc + text dịch gửi về Service Worker
        │
        ├──► 9a. Content Script render overlay phụ đề trên Meet
        │
        └──► 9b. Lưu cặp song ngữ vào IndexedDB
```

### Nguyên tắc về luồng

- **Audio không bao giờ rời Offscreen Document** dưới dạng có thể gửi ra ngoài. Chỉ text đi qua message bus.
- Mỗi chunk xử lý độc lập, nối tiếp — không chờ cả cuộc họp.
- Xử lý các ca biên: câu cắt giữa hai chunk, người nói chồng tiếng, khoảng lặng dài.

---

## 7. Cấu trúc thư mục

```
Subtle_Extension/
├── public/
│   ├── icons/                    # icon extension các kích thước
│   └── _locales/                 # i18n cho giao diện (vi, en, ja...)
│       ├── vi/messages.json
│       └── en/messages.json
│
├── src/
│   ├── manifest.ts               # định nghĩa Manifest V3
│   │
│   ├── popup/                    # giao diện điều khiển
│   │   ├── index.html
│   │   ├── Popup.tsx             # UI chính: bật/tắt, chọn ngôn ngữ
│   │   ├── components/
│   │   │   ├── LanguageSelector.tsx
│   │   │   ├── ModelDownloadProgress.tsx
│   │   │   ├── StatusIndicator.tsx
│   │   │   └── ConsentToggle.tsx  # thông báo/đồng thuận ghi âm
│   │   └── popup.css
│   │
│   ├── content/                  # chạy trong trang Meet
│   │   ├── content.ts            # entry point content script
│   │   ├── SubtitleOverlay.ts    # overlay phụ đề (kéo thả, chỉnh cỡ chữ)
│   │   ├── overlay.css
│   │   └── meet-adapter.ts       # logic riêng cho DOM của Google Meet
│   │
│   ├── background/               # service worker
│   │   ├── service-worker.ts     # điều phối, message routing
│   │   ├── offscreen-manager.ts  # tạo & quản lý Offscreen Document
│   │   └── tab-capture.ts        # logic chrome.tabCapture
│   │
│   ├── offscreen/                # nơi chạy AI nặng
│   │   ├── offscreen.html
│   │   ├── offscreen.ts          # entry point
│   │   ├── pipeline/
│   │   │   ├── audio-processor.ts  # Web Audio API, chuẩn hóa stream
│   │   │   ├── vad.ts              # Silero VAD, cắt chunk
│   │   │   ├── stt.ts             # Whisper wrapper
│   │   │   ├── translator.ts      # model dịch wrapper
│   │   │   └── pipeline.ts        # nối các bước, xử lý ca biên
│   │   └── model-loader.ts       # tải & cache model (Cache API)
│   │
│   ├── shared/                   # dùng chung mọi context
│   │   ├── messages.ts           # định nghĩa kiểu message giữa các context
│   │   ├── types.ts              # type chung (Language, Transcript...)
│   │   ├── constants.ts          # hằng số (model URL, ngôn ngữ hỗ trợ...)
│   │   ├── storage/
│   │   │   ├── transcript-db.ts  # IndexedDB cho transcript
│   │   │   └── settings.ts       # lưu cài đặt người dùng
│   │   └── logger.ts             # log có kiểm soát (không log nội dung họp)
│   │
│   └── lib/                      # tiện ích thuần
│       ├── language-utils.ts     # tiện ích xử lý ngôn ngữ
│       └── perf.ts               # đo hiệu năng (latency...)
│
├── spike/                        # Giai đoạn 0 — code thử nghiệm, KHÔNG vào extension
│   ├── index.html                # trang test transformers.js độc lập
│   ├── spike.ts                  # đo latency STT + dịch
│   └── README.md                 # ghi lại kết quả đo
│
├── docs/
│   ├── TECH-SPEC.md              # tài liệu này
│   ├── DECISIONS.md              # nhật ký quyết định kỹ thuật (ADR)
│   └── TESTING-NOTES.md          # ghi chú test thực tế
│
├── tests/                        # test (thêm dần)
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Ghi chú về cấu trúc

- **`spike/` tách riêng**: code Giai đoạn 0 không lẫn vào extension. Mục đích duy nhất là đo đạc, có thể bỏ sau khi xác thực.
- **`offscreen/pipeline/` là trái tim**: mọi xử lý AI tập trung ở đây, dễ test và tối ưu độc lập.
- **`shared/messages.ts` rất quan trọng**: MV3 có nhiều context tách biệt (popup, content, worker, offscreen) giao tiếp qua message. Định nghĩa kiểu message rõ ràng từ đầu để tránh hỗn loạn.
- **`meet-adapter.ts` tách riêng**: khi mở rộng sang Zoom/Teams sau này, chỉ cần thêm adapter mới mà không đụng phần lõi.

---

## 8. Các quyết định kỹ thuật then chốt

### QĐ-1: Chạy AI trong Offscreen Document, không phải Service Worker

**Vấn đề:** Manifest V3 dùng Service Worker, nhưng Chrome cho nó "ngủ" sau ~30 giây không hoạt động. Chạy model nặng liên tục suốt cuộc họp trong Service Worker là không khả thi.

**Quyết định:** Dùng **Offscreen Document** — API Chrome sinh ra đúng cho xử lý nền nặng trong MV3. Service Worker chỉ làm điều phối, không chạy inference.

**Hệ quả:** Cần học kỹ vòng đời Offscreen Document (tạo, duy trì, hủy). Tài liệu còn ít — dành thời gian nghiên cứu ở Giai đoạn 1.

### QĐ-2: WebGPU ưu tiên, WASM dự phòng

**Vấn đề:** WebGPU nhanh hơn WASM nhiều lần nhưng chưa phổ biến trên mọi máy văn phòng.

**Quyết định:** Phát hiện WebGPU lúc chạy; dùng nếu có, fallback WASM nếu không. Cảnh báo người dùng nếu máy chỉ chạy được WASM và hiệu năng kém.

### QĐ-3: tabCapture cần thao tác thủ công — thiết kế UX quanh nó

**Vấn đề:** `chrome.tabCapture` bắt buộc người dùng bấm nút để khởi động; không thể tự động. Đây là chính sách bảo mật của Chrome, không vượt qua được.

**Quyết định:** Biến thành bước UX tự nhiên — nút "Bắt đầu dịch" rõ ràng, kèm giải thích ngắn vì sao cần bấm. Không cố giấu hay lách.

### QĐ-4: Model nhỏ trước, nâng cấp sau khi đo

**Vấn đề:** Model lớn dịch tốt hơn nhưng nặng, có thể không chạy nổi trên máy văn phòng.

**Quyết định:** Bắt đầu với Whisper tiny/base + NLLB-distilled. Chỉ nâng cấp khi Giai đoạn 0 chứng minh máy thật chịu được.

### QĐ-5: Tải model theo nhu cầu, cache kỹ

**Vấn đề:** Mỗi model hàng trăm MB; bắt tải hết ngay là rào cản lớn.

**Quyết định:** Chỉ tải model cho ngôn ngữ người dùng cần, lưu Cache API, hiện progress bar rõ ràng. Không tải lại lần sau.

> **Lưu ý:** Mọi quyết định mới phát sinh trong quá trình làm nên ghi vào `docs/DECISIONS.md` theo định dạng ADR (Architecture Decision Record) ngắn gọn: bối cảnh → quyết định → hệ quả.

---

## 9. Lộ trình phát triển

> 5 giai đoạn. Mỗi giai đoạn có "cổng quyết định" — không đạt thì dừng lại điều chỉnh trước khi đi tiếp. Thứ tự sắp để chứng minh phần rủi ro nhất trước.

### Giai đoạn 0 — Spike kỹ thuật: chứng minh tính khả thi

**Mục tiêu:** Trả lời "Whisper + dịch chạy local có đủ nhanh và đủ tốt không?" trước khi xây extension.

**Việc làm:**

- Dựng trang HTML đơn giản (`spike/`), dùng transformers.js load Whisper-tiny + model dịch
- **Test với audio họp THẬT, đặc biệt tiếng Nhật** — không dùng mẫu chung chung
- Đo: thời gian tải model lần đầu, latency STT mỗi chunk ~3s, latency dịch mỗi câu
- **Test trên đúng loại máy văn phòng nhân viên dùng**, không phải máy dev
- So sánh WebGPU vs WASM

**Lưu ý tiếng Nhật:** Ngôn ngữ ngữ cảnh cao, câu đảo, kính ngữ phức tạp. STT tiếng Nhật của Whisper khá tốt, nhưng dịch Nhật→Việt bằng model nhỏ có thể không mượt. Phải kiểm chứng ngay.

**Cổng quyết định:**

- ✅ Latency < 3s & dịch Nhật→Việt hiểu được → đi tiếp
- ⚠️ Latency 3–5s → chấp nhận được, đi tiếp nhưng cần tối ưu
- ❌ Latency > 5s, hoặc dịch sai nghĩa nhiều, hoặc máy văn phòng không chạy nổi → dừng, cân nhắc lại kiến trúc (hybrid?) hoặc model khác

### Giai đoạn 1 — Khung extension + Audio capture + STT

**Mục tiêu:** Extension thật capture được audio từ Meet và hiện transcript thô.

**Việc làm:**

- Dựng khung MV3: Service Worker + content script + popup
- Tích hợp `chrome.tabCapture` → Web Audio API
- Tích hợp Silero VAD cắt chunk
- **Chạy inference trong Offscreen Document**
- Chạy Whisper, hiện transcript thô trong popup để verify

**Cổng quyết định:** Nói tiếng Nhật/Anh trong Meet thật → transcript hiện với độ trễ chấp nhận được.

### Giai đoạn 2 — Dịch + Overlay phụ đề (MVP chức năng đầu tiên)

**Mục tiêu:** Phụ đề dịch hiện trên màn hình họp.

**Việc làm:**

- Nối Whisper → model dịch
- Inject overlay (div cố định, cuộn karaoke, kéo thả, chỉnh cỡ chữ)
- IndexedDB lưu transcript song ngữ
- Xử lý ca biên: câu cắt giữa chunk, chồng tiếng, lặng dài, nói nhanh

**Cổng quyết định:** Nói tiếng Nhật → phụ đề Việt đọc theo được. **Bắt đầu tự dùng trong họp thật tại công ty từ đây.**

### Giai đoạn 3 — Đa ngôn ngữ + chọn ngôn ngữ

**Mục tiêu:** Nhiều cặp ngôn ngữ, mỗi người chọn riêng.

**Việc làm:**

- Hỗ trợ nhiều cặp (Whisper tự nhận nguồn; NLLB nhiều đích)
- Giao diện chọn ngôn ngữ đơn giản
- Cài đặt mỗi máy độc lập
- Tải model theo nhu cầu, cache, xử lý khi chưa tải

**Cổng quyết định:** Chuyển mượt giữa 3-4 cặp, mỗi cặp dịch hiểu được.

### Giai đoạn 4 — Hoàn thiện cho người dùng phổ thông

**Mục tiêu:** Người không rành công nghệ tự dùng được.

**Việc làm:**

- Onboarding giải thích vì sao cần bấm capture thủ công
- Progress bar tải model rõ ràng
- Xử lý lỗi thân thiện: máy yếu, hết RAM, tải lỗi, mạng chậm
- Thông điệp riêng tư nổi bật
- Nút thông báo/đồng thuận ghi âm cho người tham gia

**Cổng quyết định:** Đồng nghiệp không rành công nghệ tự cài & dùng được trong họp thật, không cần hướng dẫn.

### Giai đoạn 5 — Đóng gói & triển khai thử nội bộ

**Mục tiêu:** Nhiều đồng nghiệp cùng dùng trong công ty.

**Việc làm:**

- Đóng gói sạch, dễ cài
- Hướng dẫn cài ngắn gọn
- Triển khai cho nhiều người trong họp với khách Nhật
- Thu thập phản hồi có hệ thống: ai dùng, máy nào chạy được/không
- Lặp lại cải tiến

**Lưu ý phần cứng:** Nhiều người cùng chạy model local sẽ lộ máy nào chạy nổi máy nào không — dữ liệu quý để biết yêu cầu phần cứng tối thiểu.

**Cổng quyết định:** Nhiều người dùng ổn định, thấy giá trị rõ (hiểu ngay thay vì đợi tóm tắt).

### Bảng tổng hợp

| GĐ  | Tên                   | Kết quả                      | Cổng quyết định                         |
| --- | --------------------- | ---------------------------- | --------------------------------------- |
| 0   | Spike kỹ thuật        | Đo latency (test tiếng Nhật) | Latency < 3s & dịch Nhật→Việt hiểu được |
| 1   | Khung + Capture + STT | Transcript thô trong popup   | STT chạy trong Meet thật                |
| 2   | Dịch + Overlay        | MVP chức năng đầu tiên       | Phụ đề Việt đọc theo được               |
| 3   | Đa ngôn ngữ           | Nhiều cặp ngôn ngữ           | Chuyển 3-4 cặp mượt                     |
| 4   | Hoàn thiện UX         | Đồng nghiệp tự dùng được     | Tự cài không cần hướng dẫn              |
| 5   | Triển khai nội bộ     | Nhiều người cùng dùng        | Dùng ổn định, thấy giá trị rõ           |

---

## 10. Rủi ro & cách giảm thiểu

| #   | Rủi ro                               | Mức độ     | Cách giảm thiểu                                           |
| --- | ------------------------------------ | ---------- | --------------------------------------------------------- |
| 1   | Chất lượng dịch tiếng Nhật local kém | Cao        | Test ngay GĐ 0 với nội dung họp thật; dự phòng model khác |
| 2   | Hiệu năng kém trên máy văn phòng     | Cao        | Test trên đúng máy nhân viên; model nhỏ trước             |
| 3   | tabCapture cần thao tác thủ công     | Trung bình | Biến thành UX tự nhiên, giải thích rõ                     |
| 4   | Offscreen Document phức tạp          | Trung bình | Nghiên cứu kỹ GĐ 1, không vội                             |
| 5   | Dung lượng model lớn                 | Trung bình | Tải theo nhu cầu, cache, progress bar                     |
| 6   | Động lực cá nhân (làm một mình)      | Trung bình | Mốc nhỏ, tự dùng sớm từ GĐ 2 để thấy giá trị              |

---

## 11. Tiêu chí chất lượng

Sản phẩm coi là "đủ tốt cho MVP" khi đạt đồng thời:

- **Độ trễ:** phụ đề xuất hiện trong vòng ~3 giây sau khi người nói dứt câu
- **Chất lượng dịch:** người đọc hiểu đúng ý chính, kể cả cặp Nhật→Việt
- **Ổn định:** chạy liên tục suốt cuộc họp 60 phút không crash, không phình RAM mất kiểm soát
- **Dễ dùng:** người không rành công nghệ tự cài và bật được trong dưới 5 phút
- **Riêng tư:** xác minh được không có request mạng nào chứa nội dung họp (kiểm tra qua Network tab)
- **Hiệu năng:** chạy được trên máy văn phòng phổ thông mà không làm lag cuộc họp

---

## 12. Phụ lục: thuật ngữ

- **STT (Speech-to-Text):** chuyển giọng nói thành văn bản. Ở đây dùng Whisper.
- **MT (Machine Translation):** dịch máy. Ở đây dùng NLLB/Opus-MT.
- **VAD (Voice Activity Detection):** phát hiện đoạn có tiếng nói để chỉ xử lý phần cần thiết.
- **MV3 (Manifest V3):** chuẩn extension hiện hành của Chrome.
- **Offscreen Document:** trang ẩn của extension MV3, dùng chạy tác vụ nền nặng mà Service Worker không làm được.
- **WebGPU / WASM:** hai cách tăng tốc tính toán trong trình duyệt; WebGPU nhanh hơn nhưng kén máy.
- **WebGPU fallback:** cơ chế tự chuyển về WASM khi máy không hỗ trợ WebGPU.
- **ADR (Architecture Decision Record):** ghi chép ngắn một quyết định kiến trúc và lý do.
- **Chunk:** một đoạn audio ngắn được cắt ra để xử lý từng phần thay vì cả cuộc họp.

---

_Tài liệu sống — cập nhật khi có quyết định lớn. Nguyên tắc xuyên suốt: nếu phần lõi (STT + dịch local chạy mượt, đặc biệt tiếng Nhật trên máy văn phòng) không chạy đủ tốt, mọi thứ khác là vô nghĩa._
