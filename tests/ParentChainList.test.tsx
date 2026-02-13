// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ParentChainList from '@/components/ParentChainList';
import type { ParentInfo } from '@/lib/bridge';

describe('ParentChainList', () => {
  it('renders nothing when parents array is empty', () => {
    const { container } = render(<ParentChainList parents={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders parent names', () => {
    const parents: ParentInfo[] = [
      { name: 'Layout', source: null },
      { name: 'App', source: null },
    ];

    render(<ParentChainList parents={parents} />);

    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('App')).toBeInTheDocument();
  });

  it('renders source locations when available', () => {
    const parents: ParentInfo[] = [
      {
        name: 'Layout',
        source: { fileName: '/src/components/Layout.tsx', lineNumber: 15, columnNumber: 1 },
      },
      { name: 'App', source: { fileName: '/src/App.tsx', lineNumber: 5, columnNumber: 3 } },
    ];

    render(<ParentChainList parents={parents} />);

    expect(screen.getByText('Layout.tsx:15')).toBeInTheDocument();
    expect(screen.getByText('App.tsx:5')).toBeInTheDocument();
  });

  it('handles mixed sources (some null, some present)', () => {
    const parents: ParentInfo[] = [
      {
        name: 'Layout',
        source: { fileName: '/src/Layout.tsx', lineNumber: 10, columnNumber: 1 },
      },
      { name: 'ThemeProvider', source: null },
      { name: 'App', source: { fileName: '/src/App.tsx', lineNumber: 1, columnNumber: 1 } },
    ];

    render(<ParentChainList parents={parents} />);

    expect(screen.getByText('Layout')).toBeInTheDocument();
    expect(screen.getByText('Layout.tsx:10')).toBeInTheDocument();
    expect(screen.getByText('ThemeProvider')).toBeInTheDocument();
    expect(screen.queryByText('ThemeProvider.tsx')).not.toBeInTheDocument();
    expect(screen.getByText('App')).toBeInTheDocument();
    expect(screen.getByText('App.tsx:1')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    const parents: ParentInfo[] = [
      { name: 'Layout', source: null },
      { name: 'App', source: null },
    ];

    render(<ParentChainList parents={parents} />);

    expect(screen.getByRole('list', { name: 'Parent components' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows full file path in title attribute', () => {
    const parents: ParentInfo[] = [
      {
        name: 'Layout',
        source: { fileName: '/src/components/Layout.tsx', lineNumber: 15, columnNumber: 1 },
      },
    ];

    render(<ParentChainList parents={parents} />);

    const listItem = screen.getByRole('listitem');
    expect(listItem).toHaveAttribute('title', '/src/components/Layout.tsx');
  });

  it('extracts filename from full path for display', () => {
    const parents: ParentInfo[] = [
      {
        name: 'Sidebar',
        source: {
          fileName: 'webpack-internal:///./src/components/Sidebar.tsx',
          lineNumber: 23,
          columnNumber: 5,
        },
      },
    ];

    render(<ParentChainList parents={parents} />);

    expect(screen.getByText('Sidebar.tsx:23')).toBeInTheDocument();
  });
});
