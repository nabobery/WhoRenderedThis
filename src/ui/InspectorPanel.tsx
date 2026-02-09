import { formatSourceLocation } from "~core"
import type { Selection } from "~core"

import { CopyButton } from "./CopyButton"

interface InspectorPanelProps {
  selection: Selection | null
  isPinned: boolean
  hasReact: boolean
  onUnpin: () => void
  onSelectComponent: (index: number) => void
}

export function InspectorPanel({
  selection,
  isPinned,
  hasReact,
  onUnpin,
  onSelectComponent,
}: InspectorPanelProps) {
  // Show "No React" message
  if (!hasReact) {
    return (
      <div className="wrt-panel">
        <div className="wrt-panel-header">
          <span className="wrt-panel-title">WhoRenderedThis</span>
        </div>
        <div className="wrt-panel-body wrt-empty">
          <p>No React detected on this page.</p>
          <p className="wrt-hint">
            Make sure you&apos;re viewing a React application.
          </p>
        </div>
      </div>
    )
  }

  // Show hint when no selection
  if (!selection) {
    return (
      <div className="wrt-panel">
        <div className="wrt-panel-header">
          <span className="wrt-panel-title">WhoRenderedThis</span>
        </div>
        <div className="wrt-panel-body wrt-empty">
          <p>Hover any element to inspect it.</p>
          <p className="wrt-hint">Click to pin, Esc to unpin.</p>
        </div>
      </div>
    )
  }

  const { stack, selectedIndex } = selection

  return (
    <div className="wrt-panel">
      <div className="wrt-panel-header">
        <span className="wrt-panel-title">Component Stack</span>
        {isPinned && (
          <button onClick={onUnpin} className="wrt-unpin-btn" type="button">
            Unpin (Esc)
          </button>
        )}
      </div>

      <ul className="wrt-stack-list">
        {stack.map((item, index) => {
          const isSelected = index === selectedIndex
          const sourceLocation = formatSourceLocation(item.debugSource)

          return (
            <li
              key={index}
              className={`wrt-stack-item ${isSelected ? "wrt-selected" : ""} ${
                item.isHost ? "wrt-host" : ""
              }`}
              onClick={() => onSelectComponent(index)}>
              <div className="wrt-component-row">
                <span className="wrt-component-name">
                  {item.isHost ? (
                    <span className="wrt-host-tag">&lt;{item.name}&gt;</span>
                  ) : (
                    <>
                      <span className="wrt-bracket">{"<"}</span>
                      {item.name}
                      <span className="wrt-bracket">{" />"}</span>
                    </>
                  )}
                </span>
                <CopyButton text={item.name} />
              </div>
              {sourceLocation && (
                <div className="wrt-source-location">{sourceLocation}</div>
              )}
            </li>
          )
        })}
      </ul>

      <div className="wrt-panel-footer">
        <span className="wrt-depth-info">{stack.length} components</span>
      </div>
    </div>
  )
}
