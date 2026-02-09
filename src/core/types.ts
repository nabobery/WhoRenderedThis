/**
 * Shared types for the inspector
 */

import type { Fiber } from "./reactFiber"
import type { ComponentInfo } from "./componentNames"

export interface Selection {
  /** The DOM element that was hovered */
  target: Element
  /** The fiber attached to the target element */
  fiber: Fiber
  /** Component ancestry stack */
  stack: ComponentInfo[]
  /** Bounding rect of the current selection */
  bounds: DOMRect
  /** Currently selected component index in stack (0 = immediate component) */
  selectedIndex: number
}

export interface InspectorState {
  /** Whether the inspector is enabled */
  enabled: boolean
  /** Current selection (null when not hovering) */
  selection: Selection | null
  /** Whether the selection is pinned (click-to-pin) */
  isPinned: boolean
  /** Whether React was detected on the page */
  hasReact: boolean
}

export type InspectorAction =
  | { type: "SET_SELECTION"; payload: Selection | null }
  | { type: "SET_PINNED"; payload: boolean }
  | { type: "SELECT_COMPONENT"; payload: number }
  | { type: "SET_REACT_DETECTED"; payload: boolean }
  | { type: "RESET" }
