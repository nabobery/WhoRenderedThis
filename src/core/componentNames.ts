/**
 * Component name extraction from React Fiber nodes
 *
 * Handles various component types:
 * - Function components
 * - Class components
 * - memo() wrapped components
 * - forwardRef() wrapped components
 * - lazy() loaded components
 */

import type { Fiber } from "./reactFiber"

// React element type symbols (used internally by React)
const MEMO_TYPE = Symbol.for("react.memo")
const FORWARD_REF_TYPE = Symbol.for("react.forward_ref")
const LAZY_TYPE = Symbol.for("react.lazy")

export interface ComponentInfo {
  name: string
  fiber: Fiber
  isHost: boolean
  debugSource?: {
    fileName: string
    lineNumber: number
    columnNumber?: number
  }
}

/**
 * Get the display name of a component from its fiber
 */
export function getComponentName(fiber: Fiber): string {
  const type = fiber.type

  if (!type) {
    return "Unknown"
  }

  // Host fiber (DOM element like 'div', 'span', etc.)
  if (typeof type === "string") {
    return type
  }

  // Function or class component
  if (typeof type === "function") {
    return (
      (type as { displayName?: string }).displayName ||
      (type as { name?: string }).name ||
      "Anonymous"
    )
  }

  // Object-based types (memo, forwardRef, lazy, etc.)
  if (typeof type === "object" && type !== null) {
    const typeObj = type as {
      $$typeof?: symbol
      displayName?: string
      type?: unknown
      render?: { displayName?: string; name?: string }
    }

    // memo() wrapper
    if (typeObj.$$typeof === MEMO_TYPE && typeObj.type) {
      const innerName = getComponentName({
        ...fiber,
        type: typeObj.type,
      } as Fiber)
      return typeObj.displayName || `Memo(${innerName})`
    }

    // forwardRef() wrapper
    if (typeObj.$$typeof === FORWARD_REF_TYPE) {
      return (
        typeObj.displayName ||
        typeObj.render?.displayName ||
        typeObj.render?.name ||
        "ForwardRef"
      )
    }

    // lazy() wrapper
    if (typeObj.$$typeof === LAZY_TYPE) {
      return typeObj.displayName || "Lazy"
    }

    // Context.Provider or Context.Consumer
    if (typeObj.displayName) {
      return typeObj.displayName
    }
  }

  return "Unknown"
}

/**
 * Check if a fiber represents a host (DOM) element
 */
export function isHostFiber(fiber: Fiber): boolean {
  return typeof fiber.type === "string"
}

/**
 * Check if a fiber represents a user-defined component
 */
export function isUserComponent(fiber: Fiber): boolean {
  const type = fiber.type

  if (!type) return false

  // Host fibers are not user components
  if (typeof type === "string") return false

  // Function/class components
  if (typeof type === "function") return true

  // Object types (memo, forwardRef, etc.)
  if (typeof type === "object") {
    const typeObj = type as { $$typeof?: symbol }
    return (
      typeObj.$$typeof === MEMO_TYPE ||
      typeObj.$$typeof === FORWARD_REF_TYPE ||
      typeObj.$$typeof === LAZY_TYPE
    )
  }

  return false
}

/**
 * Build a component stack from the fiber tree
 * Traverses fiber.return to find ancestor components
 */
export function buildComponentStack(
  startFiber: Fiber,
  maxDepth = 15
): ComponentInfo[] {
  const stack: ComponentInfo[] = []
  let current: Fiber | null = startFiber
  let depth = 0

  while (current && depth < maxDepth) {
    const isHost = isHostFiber(current)

    // Include user components and the immediate host fiber
    if (isUserComponent(current) || (isHost && stack.length === 0)) {
      stack.push({
        name: getComponentName(current),
        fiber: current,
        isHost,
        debugSource: current._debugSource,
      })
    }

    current = current.return
    depth++
  }

  return stack
}

/**
 * Find the first user component in the fiber ancestry
 */
export function findNearestUserComponent(fiber: Fiber): Fiber | null {
  let current: Fiber | null = fiber

  while (current) {
    if (isUserComponent(current)) {
      return current
    }
    current = current.return
  }

  return null
}

/**
 * Format component source location for display
 */
export function formatSourceLocation(
  debugSource?: ComponentInfo["debugSource"]
): string | null {
  if (!debugSource) return null

  const { fileName, lineNumber, columnNumber } = debugSource

  // Extract just the filename from the path
  const parts = fileName.split("/")
  const shortName = parts[parts.length - 1]

  if (columnNumber !== undefined) {
    return `${shortName}:${lineNumber}:${columnNumber}`
  }

  return `${shortName}:${lineNumber}`
}
