import React, { FC, MouseEvent, useState, useRef, useEffect } from 'react';
import { C4WebApplication } from '../../../types';

interface WebApplicationProps {
  element: C4WebApplication;
  isSelected: boolean;
  onMouseDown: (e: MouseEvent, element: C4WebApplication, type: 'webApplication') => void;
  onHeightChange: (id: string, height: number) => void;
  isReadOnly?: boolean;
}

const ELEMENT_WIDTH = 180;
const MIN_ELEMENT_HEIGHT = 90;
const HEADER_HEIGHT = 20;

const WebApplication: FC<WebApplicationProps> = ({ element, isSelected, onMouseDown, onHeightChange, isReadOnly }) => {
  const [dynamicHeight, setDynamicHeight] = useState(MIN_ELEMENT_HEIGHT);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        const newHeight = Math.max(MIN_ELEMENT_HEIGHT - HEADER_HEIGHT, height);
        if (newHeight !== dynamicHeight) {
            setDynamicHeight(newHeight);
            onHeightChange(element.id, newHeight + HEADER_HEIGHT);
        }
    }
  }, [element.label, element.description, onHeightChange, element.id, dynamicHeight]);

  const totalHeight = dynamicHeight + HEADER_HEIGHT;
  const bodyHeight = dynamicHeight;

  return (
    <g
      transform={`translate(${element.position.x}, ${element.position.y})`}
      onMouseDown={(e) => onMouseDown(e, element, 'webApplication')}
      className={isReadOnly ? '' : 'cursor-pointer'}
    >
      <g
        stroke={isSelected ? '#6366f1' : (element.color || '#6b7280')}
        strokeWidth={isSelected ? 3 : 1.5}
      >
        <rect
          x={-ELEMENT_WIDTH/2} y={-totalHeight/2}
          width={ELEMENT_WIDTH} height={totalHeight}
          rx="4"
          fill="white"
        />
        <line
            x1={-ELEMENT_WIDTH/2} y1={-totalHeight/2 + HEADER_HEIGHT}
            x2={ELEMENT_WIDTH/2} y2={-totalHeight/2 + HEADER_HEIGHT}
            stroke={isSelected ? '#6366f1' : (element.color || '#6b7280')}
            strokeWidth={isSelected ? 1.5 : 1}
        />
      </g>
      <circle cx={-ELEMENT_WIDTH/2 + 12} cy={-totalHeight/2 + HEADER_HEIGHT/2} r="4" fill="#ff5f57" stroke="none" />
      <circle cx={-ELEMENT_WIDTH/2 + 26} cy={-totalHeight/2 + HEADER_HEIGHT/2} r="4" fill="#febc2e" stroke="none" />
      <circle cx={-ELEMENT_WIDTH/2 + 40} cy={-totalHeight/2 + HEADER_HEIGHT/2} r="4" fill="#28c840" stroke="none" />
      
      <foreignObject x={-ELEMENT_WIDTH/2} y={-totalHeight/2 + HEADER_HEIGHT} width={ELEMENT_WIDTH} height={bodyHeight}>
        <div
          ref={contentRef}
          className="w-full p-2 flex flex-col items-center justify-center select-none h-full"
          style={{ color: element.color || '#6b7280' }}
        >
          <div className="text-xs" style={{ opacity: 0.85 }}>[Web Application]</div>
          <div className="font-bold text-center">{element.label}</div>
          <div className="text-xs text-center break-words" style={{ opacity: 0.85, whiteSpace: 'pre-wrap' }}>{element.description}</div>
        </div>
      </foreignObject>
    </g>
  );
};

export default WebApplication;
