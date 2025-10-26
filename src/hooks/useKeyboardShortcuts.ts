"use client"

import { useEffect } from "react"

type Shortcut = {
  key: string
  meta?: boolean
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  handler: (e: KeyboardEvent) => void
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase()
        if (!keyMatch) continue

        if (Boolean(s.meta) !== e.metaKey) {
          if (s.meta) continue
        }
        if (Boolean(s.ctrl) !== e.ctrlKey) {
          if (s.ctrl) continue
        }
        if (Boolean(s.shift) !== e.shiftKey) {
          if (s.shift) continue
        }
        if (Boolean(s.alt) !== e.altKey) {
          if (s.alt) continue
        }

        try {
          s.handler(e)
        } catch (err) {
          // swallow handler errors to avoid breaking global key handling
          // eslint-disable-next-line no-console
          console.error('Shortcut handler error', err)
        }
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [shortcuts])
}
