// ---------------------------------------------------------------------------
// Headless Chrome, started and stopped without leaking.
//
// Chrome is not one process. The binary spawns a tree of helpers — renderers,
// the GPU process, the network service — and killing the process Node spawned
// leaves that tree running. A script that called `chrome.kill()` and exited
// straight afterwards left a whole browser behind, and every audit that did
// it leaked one per run. Enough of them and the machine is loaded enough for
// the test suite to time out.
//
// The browser is therefore started in its own process group, the whole group
// is signalled, and the script waits for it to go before it removes the
// profile and exits.
// ---------------------------------------------------------------------------

import { spawn } from 'node:child_process'
import { rm } from 'node:fs/promises'

const IS_WINDOWS = process.platform === 'win32'

/** Starts Chrome in its own process group so the whole tree can be signalled. */
export function spawnChrome(binary, args) {
  return spawn(binary, args, {
    stdio: 'ignore',
    // A new process group is what makes `process.kill(-pid)` reach the
    // helpers as well as the browser itself.
    detached: !IS_WINDOWS,
  })
}

/**
 * Stops Chrome and removes its profile.
 *
 * Safe to call on a browser that has already gone, and safe to call twice.
 */
export async function stopChrome(chrome, profile) {
  if (chrome && chrome.exitCode === null && chrome.signalCode === null) {
    try {
      if (!IS_WINDOWS && chrome.pid) {
        // The negative pid addresses the whole group: the browser and every
        // helper it started.
        process.kill(-chrome.pid, 'SIGTERM')
      } else {
        chrome.kill('SIGTERM')
      }
    } catch {
      /* already gone */
    }
    // Wait for the browser to actually go rather than guessing at a delay. Its
    // profile cannot be removed while it is still writing to it, and a fixed
    // pause is either too short (the profile is left behind) or too long.
    await new Promise((resolve) => {
      const done = () => resolve()
      chrome.once('exit', done)
      // A browser that ignores the signal must not hang the script.
      setTimeout(done, 5000)
    })
  }
  if (profile) {
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => {})
  }
}
