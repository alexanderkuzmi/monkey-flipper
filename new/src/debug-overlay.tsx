import { useEffect, useState } from 'react'

type LogEntry = { id: number; text: string; ts: number }
let _logId = 0
let _listeners: Array<() => void> = []
let _logs: LogEntry[] = []

export function debugLog(...args: unknown[]) {
  const text = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')
  _logs = [{ id: ++_logId, text, ts: Date.now() }, ..._logs].slice(0, 30)
  _listeners.forEach(fn => fn())
}

function useDebugLogs() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const fn = () => setTick(t => t + 1)
    _listeners.push(fn)
    return () => { _listeners = _listeners.filter(l => l !== fn) }
  }, [])
  return _logs
}

export function DebugOverlay() {
  const logs = useDebugLogs()
  const [open, setOpen] = useState(true)

  if (!import.meta.env.DEV) return null

  return (
    <div
      className="pointer-events-auto fixed top-2 right-2 z-[9999] font-mono text-[11px]"
      style={{ maxWidth: '70vw' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="mb-1 rounded bg-yellow-500 px-2 py-0.5 text-black font-bold"
      >
        {open ? 'Hide' : 'Log'} ({logs.length})
      </button>
      {open && (
        <div className="max-h-[40vh] overflow-y-auto rounded bg-black/85 p-2 backdrop-blur">
          {logs.length === 0 && <div className="text-gray-500">waiting for events...</div>}
          {logs.map(l => (
            <div key={l.id} className="border-b border-white/10 py-0.5 text-green-400">
              <span className="text-gray-500">{new Date(l.ts).toLocaleTimeString()}</span>{' '}
              {l.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
