/**
 * Hook for hover-based React component inspection
 *
 * Handles:
 * - Pointer move events with capture phase
 * - Self-filtering via composedPath()
 * - requestAnimationFrame throttling
 * - Pin/unpin selection
 */

import { useCallback, useEffect, useRef, useState } from "react"

import {
  buildComponentStack,
  findNearestFiber,
  getComponentBounds,
  getElementBounds,
  hasReactOnPage,
} from "~core"
import type { Selection } from "~core"

interface UseHoverInspectResult {
  selection: Selection | null
  isPinned: boolean
  hasReact: boolean
  handlePin: () => void
  handleUnpin: () => void
  handleSelectComponent: (index: number) => void
}

export function useHoverInspect(enabled: boolean): UseHoverInspectResult {
  const [selection, setSelection] = useState<Selection | null>(null)
  const [isPinned, setIsPinned] = useState(false)
  const [hasReact, setHasReact] = useState(false)

  const rafRef = useRef<number>(0)
  const lastTargetRef = useRef<Element | null>(null)

  // Check for React on page when enabled
  useEffect(() => {
    if (enabled) {
      // Delay check to allow React to mount
      const timer = setTimeout(() => {
        setHasReact(hasReactOnPage())
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [enabled])

  // Pointer move handler
  useEffect(() => {
    if (!enabled || isPinned) return

    const handlePointerMove = (e: PointerEvent) => {
      // Filter out extension's own shadow DOM using composedPath
      const path = e.composedPath()
      const isOwnUI = path.some(
        (el) =>
          el instanceof Element &&
          (el.id?.includes("plasmo") ||
            el.tagName?.toLowerCase() === "plasmo-csui")
      )
      if (isOwnUI) return

      // Get element at pointer position
      const target = document.elementFromPoint(e.clientX, e.clientY)
      if (!target || target === lastTargetRef.current) return

      // Skip if target is part of our extension
      if (
        target.closest("[data-plasmo-csui]") ||
        target.closest("plasmo-csui")
      ) {
        return
      }

      lastTargetRef.current = target

      // Throttle with requestAnimationFrame
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const result = findNearestFiber(target)
        if (!result) {
          setSelection(null)
          return
        }

        const { fiber, element } = result
        const stack = buildComponentStack(fiber)

        if (stack.length === 0) {
          setSelection(null)
          return
        }

        const bounds = getElementBounds(element)

        setSelection({
          target: element,
          fiber,
          stack,
          bounds,
          selectedIndex: 0,
        })
      })
    }

    // Use capture phase to intercept events early
    document.addEventListener("pointermove", handlePointerMove, true)

    return () => {
      document.removeEventListener("pointermove", handlePointerMove, true)
      cancelAnimationFrame(rafRef.current)
    }
  }, [enabled, isPinned])

  // Click to pin handler
  useEffect(() => {
    if (!enabled || isPinned) return

    const handleClick = (e: MouseEvent) => {
      // Ignore clicks on our own UI
      const path = e.composedPath()
      const isOwnUI = path.some(
        (el) =>
          el instanceof Element &&
          (el.id?.includes("plasmo") ||
            el.tagName?.toLowerCase() === "plasmo-csui")
      )
      if (isOwnUI) return

      if (selection) {
        e.preventDefault()
        e.stopPropagation()
        setIsPinned(true)
      }
    }

    document.addEventListener("click", handleClick, true)

    return () => {
      document.removeEventListener("click", handleClick, true)
    }
  }, [enabled, isPinned, selection])

  // Escape to unpin handler
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isPinned) {
          setIsPinned(false)
          lastTargetRef.current = null
        } else {
          setSelection(null)
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [enabled, isPinned])

  // Update bounds on scroll/resize when pinned
  useEffect(() => {
    if (!selection || !isPinned) return

    const updateBounds = () => {
      requestAnimationFrame(() => {
        const { fiber, selectedIndex, stack } = selection

        // Get the selected component's fiber
        const selectedFiber = stack[selectedIndex]?.fiber || fiber

        // Compute bounds for the selected component
        const result = getComponentBounds(selectedFiber)
        if (result) {
          setSelection((prev) =>
            prev ? { ...prev, bounds: result.bounds } : null
          )
        }
      })
    }

    window.addEventListener("scroll", updateBounds, { passive: true })
    window.addEventListener("resize", updateBounds, { passive: true })

    return () => {
      window.removeEventListener("scroll", updateBounds)
      window.removeEventListener("resize", updateBounds)
    }
  }, [selection, isPinned])

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      setSelection(null)
      setIsPinned(false)
      lastTargetRef.current = null
    }
  }, [enabled])

  const handlePin = useCallback(() => {
    setIsPinned(true)
  }, [])

  const handleUnpin = useCallback(() => {
    setIsPinned(false)
    lastTargetRef.current = null
  }, [])

  const handleSelectComponent = useCallback(
    (index: number) => {
      if (!selection) return

      const selectedComponent = selection.stack[index]
      if (!selectedComponent) return

      // Get bounds for the selected component
      const result = getComponentBounds(selectedComponent.fiber)
      if (result) {
        setSelection((prev) =>
          prev
            ? {
                ...prev,
                selectedIndex: index,
                bounds: result.bounds,
              }
            : null
        )
      }
    },
    [selection]
  )

  return {
    selection,
    isPinned,
    hasReact,
    handlePin,
    handleUnpin,
    handleSelectComponent,
  }
}
