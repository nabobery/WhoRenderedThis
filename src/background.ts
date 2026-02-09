/**
 * WhoRenderedThis Background Service Worker
 *
 * Handles keyboard shortcuts for toggling the inspector.
 */

import { Storage } from "@plasmohq/storage"

const storage = new Storage()

// Handle keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-inspector") {
    const currentValue = await storage.get<boolean>("inspector-enabled")
    await storage.set("inspector-enabled", !currentValue)

    // Optional: Show a notification
    const newState = !currentValue ? "enabled" : "disabled"
    console.log(`[WhoRenderedThis] Inspector ${newState}`)
  }
})

// Log when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("[WhoRenderedThis] Extension installed")
})

export {}
