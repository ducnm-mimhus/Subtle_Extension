import { pipeline, env } from '@huggingface/transformers'

// Use browser Cache API for model storage
env.useBrowserCache = true
env.allowLocalModels = false

const WHISPER_MODEL = 'Xenova/whisper-tiny'
const NLLB_MODEL = 'Xenova/nllb-200-distilled-600M'

const logEl = document.getElementById('log')!
const resultEl = document.getElementById('result')!
const btnRun = document.getElementById('btn-run') as HTMLButtonElement
const fileInput = document.getElementById('audio-file') as HTMLInputElement

function log(msg: string): void {
  logEl.textContent += `\n${msg}`
  logEl.scrollTop = logEl.scrollHeight
}

function ms(n: number): string {
  return `${n.toFixed(0)}ms`
}

btnRun.addEventListener('click', async () => {
  const file = fileInput.files?.[0]
  if (!file) {
    log('⚠ Chọn file audio trước')
    return
  }

  btnRun.disabled = true
  resultEl.textContent = ''
  log('=== Bắt đầu pipeline ===')

  try {
    // --- Load Whisper ---
    log(`\n[1] Tải Whisper: ${WHISPER_MODEL}`)
    let t0 = performance.now()
    const transcriber = await pipeline('automatic-speech-recognition', WHISPER_MODEL, {
      progress_callback: (p: { progress?: number; status: string }) => {
        if (p.progress) log(`  ${p.status}: ${p.progress.toFixed(1)}%`)
      },
    })
    log(`  ✓ Tải xong: ${ms(performance.now() - t0)}`)

    // --- STT ---
    log('\n[2] Chạy STT (Whisper)…')
    const audioBuffer = await file.arrayBuffer()
    const audioCtx = new AudioContext({ sampleRate: 16000 })
    const decoded = await audioCtx.decodeAudioData(audioBuffer)
    const float32 = decoded.getChannelData(0)

    t0 = performance.now()
    const sttResult = await transcriber(float32, {
      language: 'japanese', // đổi thành 'english' nếu test tiếng Anh
      task: 'transcribe',
    }) as { text: string }
    const sttMs = performance.now() - t0
    log(`  ✓ STT xong: ${ms(sttMs)}`)
    log(`  Text: ${sttResult.text}`)

    // --- Load NLLB ---
    log(`\n[3] Tải NLLB: ${NLLB_MODEL}`)
    t0 = performance.now()
    const translator = await pipeline('translation', NLLB_MODEL, {
      progress_callback: (p: { progress?: number; status: string }) => {
        if (p.progress) log(`  ${p.status}: ${p.progress.toFixed(1)}%`)
      },
    })
    log(`  ✓ Tải xong: ${ms(performance.now() - t0)}`)

    // --- Translate ---
    log('\n[4] Dịch Nhật→Việt…')
    t0 = performance.now()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translated = await (translator as any)(sttResult.text, {
      src_lang: 'jpn_Jpan',
      tgt_lang: 'vie_Latn',
    }) as Array<{ translation_text: string }>
    const transMs = performance.now() - t0
    log(`  ✓ Dịch xong: ${ms(transMs)}`)

    // --- Summary ---
    log('\n=== KẾT QUẢ ===')
    log(`STT latency  : ${ms(sttMs)}`)
    log(`Trans latency: ${ms(transMs)}`)
    log(`Tổng         : ${ms(sttMs + transMs)}`)

    resultEl.innerHTML = `
      <strong>Gốc:</strong> ${sttResult.text}<br>
      <strong>Dịch:</strong> ${translated[0]?.translation_text ?? '—'}
    `
  } catch (err) {
    log(`\n❌ Lỗi: ${String(err)}`)
  } finally {
    btnRun.disabled = false
  }
})
