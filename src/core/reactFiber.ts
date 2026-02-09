/**
 * React Fiber DOM → Fiber discovery utilities
 *
 * React attaches fiber nodes to DOM elements via internal keys:
 * - __reactFiber$<randomKey> (React 16+)
 * - __reactInternalInstance$<randomKey> (legacy React)
 *
 * The random key is generated via Math.random().toString(36).slice(2)
 */

export interface Fiber {
  type: string | Function | object | null
  stateNode: Element | null
  return: Fiber | null
  child: Fiber | null
  sibling: Fiber | null
  memoizedProps?: Record<string, unknown>
  _debugSource?: {
    fileName: string
    lineNumber: number
    columnNumber?: number
  }
}

const FIBER_KEY_PREFIX = "__reactFiber$"
const INTERNAL_INSTANCE_PREFIX = "__reactInternalInstance$"

// Cache discovered fiber keys for fast lookup
const knownFiberKeys: string[] = []

/**
 * Discover the fiber key on a DOM node
 * Fast path: check known keys first
 * Slow path: scan all properties for fiber key prefix
 */
function discoverFiberKey(node: Element): string | null {
  // Fast path: check known keys
  for (const key of knownFiberKeys) {
    if (key in node) {
      return key
    }
  }

  // Slow path: scan all properties
  for (const key of Object.keys(node)) {
    if (
      key.startsWith(FIBER_KEY_PREFIX) ||
      key.startsWith(INTERNAL_INSTANCE_PREFIX)
    ) {
      knownFiberKeys.push(key)
      return key
    }
  }

  return null
}

/**
 * Get the fiber node attached to a DOM element
 */
export function getFiberFromDOM(node: Element): Fiber | null {
  const key = discoverFiberKey(node)
  if (!key) return null

  const fiber = (node as Record<string, unknown>)[key]
  return fiber ? (fiber as Fiber) : null
}

/**
 * Check if a page has React installed by looking for fiber keys
 */
export function hasReactOnPage(): boolean {
  // Check body and its first few children
  const elementsToCheck = [
    document.body,
    document.getElementById("root"),
    document.getElementById("__next"),
    document.getElementById("app"),
    ...Array.from(document.body.children).slice(0, 5),
  ].filter(Boolean) as Element[]

  for (const el of elementsToCheck) {
    if (getFiberFromDOM(el)) {
      return true
    }
    // Check first child too
    if (el.firstElementChild && getFiberFromDOM(el.firstElementChild)) {
      return true
    }
  }

  return false
}

/**
 * Find the nearest ancestor fiber that contains a DOM node
 * Useful when clicking directly on text nodes or nested elements
 */
export function findNearestFiber(
  startNode: Element | null
): { fiber: Fiber; element: Element } | null {
  let current = startNode

  while (current && current !== document.body) {
    const fiber = getFiberFromDOM(current)
    if (fiber) {
      return { fiber, element: current }
    }
    current = current.parentElement
  }

  return null
}
