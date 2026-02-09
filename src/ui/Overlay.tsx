import type { Selection } from "~core"

interface OverlayProps {
  selection: Selection | null
  isPinned: boolean
}

export function Overlay({ selection, isPinned }: OverlayProps) {
  if (!selection) return null

  const { bounds, stack, selectedIndex } = selection
  const componentName = stack[selectedIndex]?.name ?? stack[0]?.name ?? "Unknown"

  // Position label above the element, or below if near top of viewport
  const labelTop = bounds.top > 32 ? bounds.top - 28 : bounds.bottom + 4

  return (
    <>
      {/* Highlight box */}
      <div
        className="wrt-highlight"
        style={{
          left: bounds.left,
          top: bounds.top,
          width: bounds.width,
          height: bounds.height,
        }}
      />

      {/* Corner brackets for visual effect */}
      <div
        className="wrt-corner wrt-corner-tl"
        style={{ left: bounds.left - 2, top: bounds.top - 2 }}
      />
      <div
        className="wrt-corner wrt-corner-tr"
        style={{ left: bounds.right - 8, top: bounds.top - 2 }}
      />
      <div
        className="wrt-corner wrt-corner-bl"
        style={{ left: bounds.left - 2, top: bounds.bottom - 8 }}
      />
      <div
        className="wrt-corner wrt-corner-br"
        style={{ left: bounds.right - 8, top: bounds.bottom - 8 }}
      />

      {/* Component name label */}
      <div
        className="wrt-label"
        style={{
          left: Math.max(4, bounds.left),
          top: labelTop,
        }}>
        <span className="wrt-label-icon">{"<"}</span>
        <span className="wrt-label-text">{componentName}</span>
        <span className="wrt-label-icon">{" />"}</span>
        {isPinned && <span className="wrt-pinned-badge">pinned</span>}
      </div>
    </>
  )
}
