import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTest } from '../../store/useTest'


export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const hasActiveMock = useTest(s => s.mock !== null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open])

  if (!open) return null

  const actions = [
    { id: 'home', name: 'Go to Home', shortcut: 'G H', run: () => navigate('/') },
    { id: 'dashboard', name: 'Go to Dashboard', shortcut: 'G D', run: () => navigate('/dashboard') },
    { id: 'practice', name: 'Practice specific skills', shortcut: 'G P', run: () => navigate('/practice') },
    { id: 'mock', name: 'Start a Mock Test', shortcut: 'G M', run: () => navigate('/mock') },
    { id: 'format', name: 'Read the Format Guide', shortcut: 'G F', run: () => navigate('/format') },
    ...(hasActiveMock ? [{ id: 'resume', name: 'Resume Active Test', shortcut: 'R T', run: () => navigate('/test') }] : [])
  ]

  const filtered = query 
    ? actions.filter(a => a.name.toLowerCase().includes(query.toLowerCase())) 
    : actions

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] animate-fade-in ring-1 ring-white/5">
        <div className="flex items-center px-4 py-3 border-b border-ink-100 dark:border-white/5">
          <svg className="w-5 h-5 text-ink-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            autoFocus
            className="flex-1 bg-transparent border-0 outline-none text-ink-900 dark:text-white placeholder:text-ink-400 dark:placeholder:text-ink-500 text-lg"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline-block border border-ink-200 dark:border-white/10 rounded px-2 py-0.5 text-xs text-ink-500 font-mono">ESC</kbd>
        </div>
        
        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-ink-500">No results found.</p>
          ) : (
            filtered.map((action) => (
              <button
                key={action.id}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-ink-50 dark:hover:bg-white/5 text-left transition-colors cursor-pointer group"
                onClick={() => {
                  action.run()
                  setOpen(false)
                }}
              >
                <span className="text-ink-700 dark:text-ink-200 group-hover:text-ink-900 dark:group-hover:text-white font-medium">
                  {action.name}
                </span>
                {action.shortcut && (
                  <div className="flex gap-1 hidden sm:flex">
                    {action.shortcut.split(' ').map(key => (
                      <kbd key={key} className="bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 rounded px-1.5 py-0.5 text-[10px] font-mono border border-ink-200 dark:border-white/5">
                        {key}
                      </kbd>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
