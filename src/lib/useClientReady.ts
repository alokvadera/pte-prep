import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

/** Wait until hydration finishes before showing browser-persisted session state. */
export function useClientReady() {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot)
}
