type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// Never log meeting content — only metadata (latency, status, counts).
function log(level: LogLevel, context: string, message: string, meta?: Record<string, unknown>) {
  const prefix = `[Subtle:${context}]`
  if (level === 'error') {
    console.error(prefix, message, meta ?? '')
  } else if (level === 'warn') {
    console.warn(prefix, message, meta ?? '')
  } else {
    console.log(prefix, message, meta ?? '')
  }
}

export function createLogger(context: string) {
  return {
    debug: (msg: string, meta?: Record<string, unknown>) => log('debug', context, msg, meta),
    info: (msg: string, meta?: Record<string, unknown>) => log('info', context, msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => log('warn', context, msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log('error', context, msg, meta),
  }
}
