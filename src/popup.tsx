import { useStorage } from "@plasmohq/storage/hook"

import "~style.css"

function Popup() {
  const [enabled, setEnabled] = useStorage("inspector-enabled", false)

  return (
    <div className="w-72 p-4 font-mono">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900">
            WhoRenderedThis
          </h1>
          <p className="text-xs text-gray-500">React Component Inspector</p>
        </div>
      </div>

      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
        <div>
          <span className="block text-sm font-medium text-gray-700">
            Enable Inspector
          </span>
          <span className="block text-xs text-gray-500 mt-0.5">
            {enabled ? "Active" : "Disabled"}
          </span>
        </div>
        <div className="relative">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
        </div>
      </label>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <h2 className="text-xs font-semibold text-blue-800 mb-2">How to use</h2>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>
            <span className="text-blue-500">1.</span> Enable the inspector above
          </li>
          <li>
            <span className="text-blue-500">2.</span> Hover any element to see
            its component
          </li>
          <li>
            <span className="text-blue-500">3.</span> Click to pin the selection
          </li>
          <li>
            <span className="text-blue-500">4.</span> Press{" "}
            <kbd className="px-1 py-0.5 bg-white rounded text-[10px] font-semibold shadow-sm">
              Esc
            </kbd>{" "}
            to unpin
          </li>
        </ul>
      </div>

      <div className="mt-3 text-center">
        <p className="text-[10px] text-gray-400">
          Keyboard shortcut:{" "}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded font-semibold">
            Cmd+Shift+I
          </kbd>
        </p>
      </div>
    </div>
  )
}

export default Popup
