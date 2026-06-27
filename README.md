# Subtle

Phụ đề dịch thời gian thực cho Google Meet, chạy **100% trên máy** — không byte nào rời máy.

Dành cho những người ngồi trong cuộc họp với đối tác nước ngoài nhưng không hiểu ngôn ngữ của họ.

## Tính năng

- Dịch trực tiếp trong lúc họp, không cần đợi tóm tắt sau
- Hỗ trợ Nhật → Việt, Anh → Việt (và các cặp khác)
- Mỗi người dùng máy riêng, tự chọn ngôn ngữ, không đồng bộ qua server
- Riêng tư tuyệt đối — nội dung họp không bao giờ ra khỏi máy

## Yêu cầu

- Chrome 113+
- GPU hỗ trợ WebGPU (khuyến nghị) hoặc WASM fallback
- ~1GB RAM trống cho model

## Cài đặt (dev)

```bash
pnpm install
pnpm build
```

Vào `chrome://extensions`, bật Developer mode, Load unpacked → chọn thư mục `dist/`.

## Phát triển

```bash
pnpm dev        # build watch mode
pnpm type-check # kiểm tra TypeScript
```

### Chạy spike (GĐ0 — test latency)

```bash
pnpm exec vite serve spike/
```

Mở `http://localhost:5173`, chọn file audio, bấm "Chạy pipeline" để đo latency STT + dịch.

## Tài liệu

- [`SUBTLE-TECH-SPEC.md`](./SUBTLE-TECH-SPEC.md) — kiến trúc, công nghệ, lộ trình đầy đủ
- [`CONTEXT.md`](./CONTEXT.md) — ngữ cảnh nhanh cho AI assistant
