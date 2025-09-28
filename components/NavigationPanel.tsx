import React, { FC, useMemo, useState, useEffect, SVGProps } from 'react';
import { Node } from 'reactflow';
import { ViewNodeData } from '../types';
import { useTranslation } from '../i18n';

interface NavigationPanelProps {
  sortedNodes: Node<ViewNodeData>[];
  onFocus: (id: string) => void;
  selectedNodeId: string | null;
}

interface NavBranch {
  root: Node<ViewNodeData>;
  children: Node<ViewNodeData>[];
}

const NavigationPanel: FC<NavigationPanelProps> = ({ sortedNodes, onFocus, selectedNodeId }) => {
  const { t } = useTranslation();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const navTree = useMemo((): NavBranch[] => {
    if (sortedNodes.length === 0) return [];

    const tree: NavBranch[] = [];
    let currentColumnNodes: Node<ViewNodeData>[] = [];
    let lastX = -Infinity;
    // A gap larger than this (e.g., half a large node width) indicates a new column.
    const COLUMN_THRESHOLD = 512; 

    // The sortedNodes are pre-sorted by x, then y.
    sortedNodes.forEach(node => {
      if (node.position.x > lastX + COLUMN_THRESHOLD && currentColumnNodes.length > 0) {
        // Finalize the previous column and start a new one.
        const root = currentColumnNodes[0]; // First node is the top-most.
        const children = currentColumnNodes.slice(1);
        tree.push({ root, children });
        currentColumnNodes = [];
      }
      currentColumnNodes.push(node);
      lastX = node.position.x;
    });

    // Add the last processed column.
    if (currentColumnNodes.length > 0) {
      const root = currentColumnNodes[0];
      const children = currentColumnNodes.slice(1);
      tree.push({ root, children });
    }

    return tree;
  }, [sortedNodes]);
  
  // Effect to automatically expand the section containing the selected node.
  useEffect(() => {
    if (!selectedNodeId) return;

    const parentBranch = navTree.find(branch => 
        branch.root.id === selectedNodeId || branch.children.some(child => child.id === selectedNodeId)
    );

    if (parentBranch && !openSections.has(parentBranch.root.id)) {
        setOpenSections(prev => {
            const newSet = new Set(prev);
            newSet.add(parentBranch.root.id);
            return newSet;
        });
    }
  // This effect should only run when the selection changes, not when openSections is updated.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId, navTree]);

  const toggleSection = (rootId: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rootId)) {
        newSet.delete(rootId);
      } else {
        newSet.add(rootId);
      }
      return newSet;
    });
  };

  const renderNode = (node: Node<ViewNodeData>) => (
    <button
      onClick={() => onFocus(node.id)}
      className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm flex items-start ${
        selectedNodeId === node.id
          ? 'bg-indigo-100 text-indigo-800 font-semibold'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className="break-words flex-1">{node.data.title || t('navPanel.untitledView')}</span>
    </button>
  );

  return (
    <div className="absolute left-0 mt-2 w-[36rem] bg-white rounded-md shadow-lg border z-20 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">{t('navPanel.title')}</h2>
      </div>
      <div className="flex-grow overflow-y-auto max-h-[calc(100vh-200px)]">
        <ul className="p-2 space-y-1">
          {navTree.map(({ root, children }) => {
            const isOpen = openSections.has(root.id);
            return (
              <li key={root.id}>
                <div className="flex items-center gap-1">
                  <div className="flex-grow">
                    {renderNode(root)}
                  </div>
                  {children.length > 0 && (
                    <button
                      onClick={() => toggleSection(root.id)}
                      className="w-9 py-2 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 flex-shrink-0"
                      aria-expanded={isOpen}
                      aria-label={root.data.title}
                    >
                      <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {isOpen && children.length > 0 && (
                  <ul className="pl-6 mt-1 space-y-1 border-l-2 border-gray-200 ml-4">
                    {children.map((child) => (
                      <li key={child.id}>
                        {renderNode(child)}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

const ChevronDownIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);


export default NavigationPanel;