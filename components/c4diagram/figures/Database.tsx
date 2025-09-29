import React, { FC, MouseEvent, useState, useRef, useEffect } from 'react';
import { C4Database } from '../../../types';

interface DatabaseProps {
  element: C4Database;
  isSelected: boolean;
  onMouseDown: (e: MouseEvent, element: C4Database, type: 'database') => void;
  onHeightChange: (id: string, height: number) => void;
  isReadOnly?: boolean;
}

const ELEMENT_WIDTH = 180;
const MIN_ELEMENT_HEIGHT = 90;
const CYLINDER_TOP_HEIGHT = 15;

const Database: FC<DatabaseProps> = ({ element, isSelected, onMouseDown, onHeightChange, isReadOnly }) => {
  const [dynamicHeight, setDynamicHeight] = useState(MIN_ELEMENT_HEIGHT);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        const newHeight = Math.max(MIN_ELEMENT_HEIGHT - CYLINDER_TOP_HEIGHT * 2, height);
        if (newHeight !== dynamicHeight) {
            setDynamicHeight(newHeight);
            onHeightChange(element.id, newHeight + CYLINDER_TOP_HEIGHT * 2);
        }
    }
  }, [element.label, element.description, element.technology, onHeightChange, element.id, dynamicHeight]);
  
  const totalHeight = dynamicHeight + CYLINDER_TOP_HEIGHT * 2;

  const topEllipsePath = `M ${-ELEMENT_WIDTH/2} ${CYLINDER_TOP_HEIGHT} C ${-ELEMENT_WIDTH/2} ${-CYLINDER_TOP_HEIGHT/2}, ${ELEMENT_WIDTH/2} ${-CYLINDER_TOP_HEIGHT/2}, ${ELEMENT_WIDTH/2} ${CYLINDER_TOP_HEIGHT}`;
  const bottomArcPath = `M ${-ELEMENT_WIDTH/2} ${CYLINDER_TOP_HEIGHT + dynamicHeight} C ${-ELEMENT_WIDTH/2} ${CYLINDER_TOP_HEIGHT*2 + dynamicHeight}, ${ELEMENT_WIDTH/2} ${CYLINDER_TOP_HEIGHT*2 + dynamicHeight}, ${ELEMENT_WIDTH/2} ${CYLINDER_TOP_HEIGHT + dynamicHeight}`;

  return (
    <g
      transform={`translate(${element.position.x}, ${element.position.y - totalHeight/2})`}
      onMouseDown={(e) => onMouseDown(e, element, 'database')}
      className={isReadOnly ? '' : 'cursor-pointer'}
    >
      <g
        stroke={isSelected ? '#6366f1' : (element.color || '#6b7280')}
        strokeWidth={isSelected ? 3 : 1.5}
      >
        <path d={topEllipsePath} fill={'white'} />
        <line x1={-ELEMENT_WIDTH/2} y1={CYLINDER_TOP_HEIGHT} x2={-ELEMENT_WIDTH/2} y2={CYLINDER_TOP_HEIGHT + dynamicHeight} />
        <line x1={ELEMENT_WIDTH/2} y1={CYLINDER_TOP_HEIGHT} x2={ELEMENT_WIDTH/2} y2={CYLINDER_TOP_HEIGHT + dynamicHeight} />
        <path d={bottomArcPath} fill="transparent" />
      </g>
      <foreignObject x={-ELEMENT_WIDTH/2} y={CYLINDER_TOP_HEIGHT} width={ELEMENT_WIDTH} height={dynamicHeight}>
        <div
          ref={contentRef}
          className="w-full p-2 flex flex-col items-center justify-center select-none h-full"
          style={{ color: element.color || '#6b7280' }}
        >
          <div className="text-xs" style={{ opacity: 0.85 }}>[Database]</div>
          <div className="font-bold text-center">{element.label}</div>
          <div className="text-xs text-center break-words" style={{ opacity: 0.85, whiteSpace: 'pre-wrap' }}>{element.description}</div>
          <div className="text-xs text-center break-words font-mono" style={{ opacity: 0.85, whiteSpace: 'pre-wrap' }}>{element.technology}</div>
        </div>
      </foreignObject>
    </g>
  );
};

export default Database;
