/* ---------------------------------------------------------------------------
   Browser globals the app reaches for but the DOM library does not declare.

   Safari and older Chrome expose prefixed forms of APIs that the app falls
   back to, and the recorder reads them by name. The test environment provides
   them, so the type declarations belong here rather than in a cast at every
   call site.
   --------------------------------------------------------------------------- */

interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: Event) => void) | null
  onerror: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onstart: ((event: Event) => void) | null
  start(): void
  stop(): void
  abort(): void
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
}

export {}
