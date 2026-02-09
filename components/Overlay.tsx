import { useState, useEffect, useCallback, useRef } from 'react';
import type { ComponentInfo, ProbeResponse } from '@/lib/bridge';
import { CHANNEL, isProbeResponse } from '@/lib/bridge';
import './Overlay.css';

interface OverlayProps {
  /** Called when the user clicks the close button or presses Escape */
  onClose: () => void;
}

export default function Overlay({ onClose }: OverlayProps) {
  const [component, setComponent] = useState<ComponentInfo | null>(null);
  const [rect, setRect] = useState<ProbeResponse['rect']>(null);
  const [pinned, setPinned] = useState(false);
  const [copied, setCopied] = useState(false);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const lastElRef = useRef<string>('');
  const copyTimerRef = useRef<number | null>(null);

  // ── Send probe request to main-world script ─────────────────────────────
  const sendProbe = useCallback(
    (x: number, y: number) => {
      if (pinned) return;
      window.postMessage(
        { channel: CHANNEL, type: 'probe-request', x, y },
        window.location.origin === 'null' ? '*' : window.location.origin,
      );
    },
    [pinned],
  );

  // ── Receive probe responses ─────────────────────────────────────────────
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (!isProbeResponse(event.data)) return;
      const { component: comp, rect: r } = event.data;
      setComponent(comp);
      setRect(r);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // ── Throttled mousemove via rAF ─────────────────────────────────────────
  useEffect(() => {
    if (pinned) return;

    function onMove(e: MouseEvent) {
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = 0;
          const { x, y } = lastMouseRef.current;
          const key = `${x},${y}`;
          if (key === lastElRef.current) return;
          lastElRef.current = key;
          sendProbe(x, y);
          setPanelPos({ top: y + 16, left: x + 16 });
        });
      }
    }

    document.addEventListener('mousemove', onMove, true);
    return () => {
      document.removeEventListener('mousemove', onMove, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pinned, sendProbe]);

  // ── Click to pin / Escape to unpin or close ─────────────────────────────
  useEffect(() => {
    function isClickInsidePanel(event: Event): boolean {
      return event
        .composedPath()
        .some((node) => node instanceof HTMLElement && node.hasAttribute('data-wrt-panel'));
    }

    function onClick(e: MouseEvent) {
      if (isClickInsidePanel(e)) return;

      if (pinned) {
        e.preventDefault();
        e.stopPropagation();
        setPinned(false);
        return;
      }

      if (component) {
        e.preventDefault();
        e.stopPropagation();
        setPinned(true);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (pinned) {
          setPinned(false);
        } else {
          onClose();
        }
      }
    }

    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [pinned, component, onClose]);

  // ── Copy component name ─────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (!component) return;
    const text = component.name;

    const flashCopied = () => {
      setCopied(true);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1500);
    };

    try {
      await navigator.clipboard.writeText(text);
      flashCopied();
      return;
    } catch (err) {
      // Some pages (e.g. http://) may not support Clipboard API from a content script.
      console.warn('WhoRenderedThis: Clipboard API copy failed, trying fallback', err);
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      textarea.remove();
      if (ok) flashCopied();
    } catch (err) {
      console.warn('WhoRenderedThis: copy fallback failed', err);
    }
  }, [component]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  // ── Compute safe panel position (keep inside viewport) ──────────────────
  const safePanelStyle = (() => {
    const margin = 12;
    let { top, left } = panelPos;
    const panelWidth = 320;
    const panelHeight = 80;

    if (left + panelWidth > window.innerWidth - margin) {
      left = lastMouseRef.current.x - panelWidth - 16;
    }
    if (top + panelHeight > window.innerHeight - margin) {
      top = lastMouseRef.current.y - panelHeight - 16;
    }
    if (left < margin) left = margin;
    if (top < margin) top = margin;

    return { top, left };
  })();

  return (
    <div data-wrt-overlay>
      {/* ── Highlight box ──────────────────────────────────────────────── */}
      {rect && (
        <div
          className="wrt-highlight"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}

      {/* ── Info panel ─────────────────────────────────────────────────── */}
      <div
        className="wrt-panel"
        data-wrt-panel
        style={{
          top: safePanelStyle.top,
          left: safePanelStyle.left,
        }}
      >
        {component ? (
          <>
            <div className="wrt-panel-header">
              {pinned && <span className="wrt-pinned-indicator" />}
              <span className="wrt-badge">React</span>
              <span className="wrt-component-name">
                {'<'}
                {component.name}
                {' />'}
              </span>
            </div>
            {component.source && (
              <div className="wrt-source">
                {component.source.fileName}:{component.source.lineNumber}
              </div>
            )}
            <div className="wrt-actions">
              <button
                type="button"
                className={`wrt-btn ${pinned ? 'wrt-btn-active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setPinned((p) => !p);
                }}
              >
                {pinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                type="button"
                className="wrt-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
              >
                {copied ? 'Copied!' : 'Copy name'}
              </button>
              <button
                type="button"
                className="wrt-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <span className="wrt-no-react">
            No React component found — hover over a React element
          </span>
        )}
      </div>
    </div>
  );
}
