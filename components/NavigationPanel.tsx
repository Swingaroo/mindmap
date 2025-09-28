import React, { FC } from 'react';
import { Node } from 'reactflow';
import { ViewNodeData } from '../types';
import { useTranslation } from '../i18n';

interface NavigationPanelProps {
  sortedNodes: Node<ViewNodeData>[];
  onFocus: (id: string) => void;
  selectedNodeId: string | null;
}

const NavigationPanel: FC<NavigationPanelProps> = ({ sortedNodes, onFocus, selectedNodeId }) => {
  const { t } = useTranslation();

  return (
    <div className="absolute left-0 mt-2 w-80 bg-white rounded-md shadow-lg border z-20 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">{t('navPanel.title')}</h2>
      </div>
      <div className="flex-grow overflow-y-auto max-h-[calc(100vh-200px)]">
        <ul className="p-2 space-y-1">
          {sortedNodes.map((node, index) => (
            <li key={node.id}>
              <button
                onClick={() => onFocus(node.id)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm flex items-start ${
                  selectedNodeId === node.id
                    ? 'bg-indigo-100 text-indigo-800 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-gray-500 w-8 flex-shrink-0">{index + 1}.</span>
                <span className="break-words flex-1">{node.data.title || t('navPanel.untitledView')}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NavigationPanel;