import type { ParentInfo } from '@/lib/bridge';
import './ParentChainList.css';

interface ParentChainListProps {
  parents: ParentInfo[];
}

function formatSource(source: ParentInfo['source']): string | null {
  if (!source) return null;
  const fileName = source.fileName.split('/').pop() ?? source.fileName;
  return `${fileName}:${source.lineNumber}`;
}

export default function ParentChainList({ parents }: ParentChainListProps) {
  if (parents.length === 0) return null;

  return (
    <div className="wrt-parent-list" role="list" aria-label="Parent components">
      {parents.map((parent, index) => (
        <div
          key={`${parent.name}-${index}`}
          className="wrt-parent-item"
          role="listitem"
          title={parent.source?.fileName}
        >
          <span className="wrt-parent-name">{parent.name}</span>
          {parent.source && (
            <span className="wrt-parent-source">{formatSource(parent.source)}</span>
          )}
        </div>
      ))}
    </div>
  );
}
