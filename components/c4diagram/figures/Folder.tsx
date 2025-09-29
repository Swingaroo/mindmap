import React, { FC, MouseEvent, useState, useRef, useEffect } from 'react';
import { C4Folder } from '../../../types';

interface FolderProps {
  element: C4Folder;
  isSelected: boolean;
  onMouseDown: (e: MouseEvent, element: C4Folder, type: 'folder') => void;
  onHeightChange: (id: string, height: number) => void;
  isReadOnly?: boolean;
}

const ELEMENT_WIDTH = 180;
const MIN_ELEMENT_HEIGHT = 90;
const TAB_HEIGHT = 10;
const TAB_WIDTH = 50;

const Folder: FC<FolderProps> = ({ element, isSelected, onMouseDown, onHeightChange, isReadOnly }) => {
  const [dynamicHeight, setDynamicHeight] = useState(MIN_ELEMENT_HEIGHT);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        const newHeight = Math.max(MIN_ELEMENT_HEIGHT - TAB_HEIGHT, height);
        if (newHeight !== dynamicHeight) {
            setDynamicHeight(newHeight);
            onHeightChange(element.id, newHeight + TAB_HEIGHT);
        }
    }
  }, [element.label, element.description, onHeightChange, element.id, dynamicHeight]);
  
  const totalHeight = dynamicHeight + TAB_HEIGHT;
  
  const tabPath = `
    M ${-ELEMENT_WIDTH/2} ${-totalHeight/2 + TAB_HEIGHT}
    L ${-ELEMENT_WIDTH/2} ${-totalHeight/2 + 4}
    A 4 4 0 0 1 ${-ELEMENT_WIDTH/2 + 4} ${-totalHeight/2}
    L ${-ELEMENT_WIDTH/2 + TAB_WIDTH - 4} ${-totalHeight/2}
    A 4 4 0 0 1 ${-ELEMENT_WIDTH/2 + TAB_WIDTH} ${-totalHeight/2 + 4}
    L ${-ELEMENT_WIDTH/2 + TAB_WIDTH} ${-totalHeight/2 + TAB_HEIGHT} Z`;

  return (
    <g
      transform={`translate(${element.position.x}, ${element.position.y})`}
      onMouseDown={(e) => onMouseDown(e, element, 'folder')}
      className={isReadOnly ? '' : 'cursor-pointer'}
    >
      <g
        fill="white"
        stroke={isSelected ? '#6366f1' : (element.color || '#6b7280')}
        strokeWidth={isSelected ? 3 : 1.5}
      >
        <path d={tabPath} />
        <rect
          x={-ELEMENT_WIDTH/2} y={-totalHeight/2 + TAB_HEIGHT}
          width={ELEMENT_WIDTH} height={dynamicHeight}
          rx="4"
        />
      </g>
      <foreignObject x={-ELEMENT_WIDTH/2} y={-totalHeight/2 + TAB_HEIGHT} width={ELEMENT_WIDTH} height={dynamicHeight}>
        <div
          ref={contentRef}
          className="w-full p-2 flex flex-col items-center justify-center select-none h-full"
          style={{ color: element.color || '#6b7280' }}
        >
          <div className="text-xs" style={{ opacity: 0.85 }}>[Folder]</div>
          <div className="font-bold text-center">{element.label}</div>
          <div className="text-xs text-center break-words" style={{ opacity: 0.85, whiteSpace: 'pre-wrap' }}>{element.description}</div>
        </div>
      </foreignObject>
    </g>
  );
};

export default Folder;
