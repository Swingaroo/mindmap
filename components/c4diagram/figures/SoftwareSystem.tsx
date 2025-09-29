import React, { FC, MouseEvent, useState, useRef, useEffect } from 'react';
import { C4SoftwareSystem } from '../../../types';

interface SoftwareSystemProps {
  element: C4SoftwareSystem;
  isSelected: boolean;
  onMouseDown: (e: MouseEvent, element: C4SoftwareSystem) => void;
  onHeightChange: (id: string, height: number) => void;
  isReadOnly?: boolean;
}

const ELEMENT_WIDTH = 180;
const MIN_ELEMENT_HEIGHT = 90;

const SoftwareSystem: FC<SoftwareSystemProps> = ({ element, isSelected, onMouseDown, onHeightChange, isReadOnly }) => {
  const [dynamicHeight, setDynamicHeight] = useState(MIN_ELEMENT_HEIGHT);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        const newHeight = Math.max(MIN_ELEMENT_HEIGHT, height);
        if (newHeight !== dynamicHeight) {
            setDynamicHeight(newHeight);
            onHeightChange(element.id, newHeight);
        }
    }
  }, [element.label, element.description, onHeightChange, element.id, dynamicHeight]);


  return (
    <g
      transform={`translate(${element.position.x}, ${element.position.y})`}
      onMouseDown={(e) => onMouseDown(e, element)}
      className={isReadOnly ? '' : 'cursor-pointer'}
    >
      <rect
        x={-ELEMENT_WIDTH/2} y={-dynamicHeight/2}
        width={ELEMENT_WIDTH} height={dynamicHeight}
        rx="4"
        style={{
          fill: 'white',
          stroke: isSelected ? '#6366f1' : (element.color || '#6b7280'),
        }}
        strokeWidth={isSelected ? 3 : 1.5}
      />
      <foreignObject x={-ELEMENT_WIDTH/2} y={-dynamicHeight/2} width={ELEMENT_WIDTH} height={dynamicHeight}>
        <div
          ref={contentRef}
          className="w-full p-2 flex flex-col items-center justify-center select-none h-full"
          style={{ color: element.color || '#6b7280' }}
        >
          <div className="text-xs" style={{ opacity: 0.85 }}>[{element.isSystemInFocus ? 'Software System [In Focus]' : 'Software System'}]</div>
          <div className="font-bold text-center">{element.label}</div>
          <div className="text-xs text-center break-words" style={{ opacity: 0.85 }}>{element.description}</div>
        </div>
      </foreignObject>
    </g>
  );
};

export default SoftwareSystem;