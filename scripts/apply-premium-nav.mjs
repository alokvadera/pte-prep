import fs from 'fs'

let tsx = fs.readFileSync('src/components/Layout.tsx', 'utf-8')

// The nav header in Layout.tsx currently says:
// fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[calc(100%-2rem)] sm:max-w-5xl rounded-full border shadow-sm
const navRegex =
  /fixed top-4 left-4 right-4 sm:left-1\/2 sm:right-auto sm:-translate-x-1\/2 sm:w-\[calc\(100%-2rem\)\] sm:max-w-5xl rounded-full border shadow-sm/
const premiumNav =
  'fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[calc(100%-2rem)] sm:max-w-4xl rounded-full border border-ink-200/50 bg-white/70 backdrop-blur-xl shadow-premium-light dark:border-white/10 dark:bg-ink-900/60 dark:shadow-premium-dark'

tsx = tsx.replace(navRegex, premiumNav)

fs.writeFileSync('src/components/Layout.tsx', tsx)
