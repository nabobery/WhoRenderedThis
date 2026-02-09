/**
 * Host bounds calculation for fiber subtrees
 *
 * Given a component fiber, traverse its subtree to collect
 * all host (DOM) nodes and compute their union bounding rect.
 */

import type { Fiber } from "./reactFiber"

const DEFAULT_HOST_CAP = 200

/**
 * Collect all host (DOM) nodes from a fiber subtree
 * Uses BFS traversal with a cap to prevent performance issues
 */
export function collectHostNodes(fiber: Fiber, cap = DEFAULT_HOST_CAP): Element[] {
  const nodes: Element[] = []
  const queue: Fiber[] = [fiber]
  const visited = new Set<Fiber>()

  while (queue.length > 0 && nodes.length < cap) {
    const current = queue.shift()!

    // Prevent infinite loops
    if (visited.has(current)) continue
    visited.add(current)

    // Host fiber with valid DOM node
    if (
      typeof current.type === "string" &&
      current.stateNode instanceof Element
    ) {
      nodes.push(current.stateNode)
    }

    // Traverse children (depth-first within this component)
    if (current.child) {
      queue.push(current.child)
    }

    // Traverse siblings
    let sibling = current.sibling
    while (sibling) {
      queue.push(sibling)
      sibling = sibling.sibling
    }
  }

  return nodes
}

/**
 * Compute the union bounding rect of multiple elements
 */
export function computeUnionBounds(nodes: Element[]): DOMRect | null {
  if (nodes.length === 0) return null

  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity

  let hasValidRect = false

  for (const node of nodes) {
    const rect = node.getBoundingClientRect()

    // Skip zero-size elements
    if (rect.width === 0 && rect.height === 0) continue

    // Skip elements that are off-screen or hidden
    if (rect.top > window.innerHeight || rect.bottom < 0) continue
    if (rect.left > window.innerWidth || rect.right < 0) continue

    hasValidRect = true
    left = Math.min(left, rect.left)
    top = Math.min(top, rect.top)
    right = Math.max(right, rect.right)
    bottom = Math.max(bottom, rect.bottom)
  }

  if (!hasValidRect) return null

  return new DOMRect(left, top, right - left, bottom - top)
}

/**
 * Get bounds for a component fiber
 * Collects all host nodes in the subtree and computes union rect
 */
export function getComponentBounds(
  fiber: Fiber,
  cap = DEFAULT_HOST_CAP
): { bounds: DOMRect; nodeCount: number; capped: boolean } | null {
  const nodes = collectHostNodes(fiber, cap)

  if (nodes.length === 0) return null

  const bounds = computeUnionBounds(nodes)
  if (!bounds) return null

  return {
    bounds,
    nodeCount: nodes.length,
    capped: nodes.length >= cap,
  }
}

/**
 * Get bounds for a single DOM element
 */
export function getElementBounds(element: Element): DOMRect {
  return element.getBoundingClientRect()
}

/**
 * Check if a rect is visible in the viewport
 */
export function isRectVisible(rect: DOMRect): boolean {
  return (
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0 &&
    rect.width > 0 &&
    rect.height > 0
  )
}

/**
 * Constrain a rect to the visible viewport
 */
export function constrainToViewport(rect: DOMRect): DOMRect {
  const left = Math.max(0, rect.left)
  const top = Math.max(0, rect.top)
  const right = Math.min(window.innerWidth, rect.right)
  const bottom = Math.min(window.innerHeight, rect.bottom)

  return new DOMRect(left, top, right - left, bottom - top)
}
