/**
 * WhoRenderedThis Content Script UI (CSUI)
 *
 * Main entry point for the inspector overlay.
 * Renders in Shadow DOM for style isolation.
 */

import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"

import { useStorage } from "@plasmohq/storage/hook"

import cssText from "data-text:../styles/inspector.css"
import { useHoverInspect } from "~hooks"
import { InspectorPanel, Overlay } from "~ui"

// Content script configuration
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true,
}

// Inject styles into Shadow DOM
export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

function Inspector() {
  // Get enabled state from storage (synced with popup)
  const [enabled] = useStorage("inspector-enabled", false)

  // Initialize hover inspection
  const {
    selection,
    isPinned,
    hasReact,
    handleUnpin,
    handleSelectComponent,
  } = useHoverInspect(enabled)

  // Don't render anything if disabled
  if (!enabled) {
    return null
  }

  return (
    <>
      <Overlay selection={selection} isPinned={isPinned} />
      <InspectorPanel
        selection={selection}
        isPinned={isPinned}
        hasReact={hasReact}
        onUnpin={handleUnpin}
        onSelectComponent={handleSelectComponent}
      />
    </>
  )
}

export default Inspector
