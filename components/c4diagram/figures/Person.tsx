import React, { FC, MouseEvent, useState, useRef, useEffect } from 'react';
import { C4Person } from '../../../types';

interface PersonProps {
  element: C4Person;
  isSelected: boolean;
  onMouseDown: (e: MouseEvent, element: C4Person, type: 'person') => void;
  onHeightChange: (id: string, height: number) => void;
  isReadOnly?: boolean;
}

const ELEMENT_WIDTH = 180;
const MIN_BODY_HEIGHT = 90;
const HEAD_RADIUS = 39.6;
const HEAD_Y_OFFSET = -33;
const HEAD_VISIBLE_HEIGHT = Math.abs(HEAD_Y_OFFSET) + HEAD_RADIUS; // How much head is above y=0

const Person: FC<PersonProps> = ({ element, isSelected, onMouseDown, onHeightChange, isReadOnly }) => {
  const [bodyHeight, setBodyHeight] = useState(MIN_BODY_HEIGHT);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      const newBodyHeight = Math.max(MIN_BODY_HEIGHT, height);
      if (newBodyHeight !== bodyHeight) {
        setBodyHeight(newBodyHeight);
        onHeightChange(element.id, newBodyHeight + HEAD_VISIBLE_HEIGHT);
      }
    }
  }, [element.label, element.description, onHeightChange, element.id, bodyHeight]);
  
  const bodyPath = `M -90 ${bodyHeight} L -90 15 A 15 15 0 0 1 -75 0 L 75 0 A 15 15 0 0 1 90 15 L 90 ${bodyHeight} Z`;

  return (
    <g
      transform={`translate(${element.position.x}, ${element.position.y})`}
      onMouseDown={(e) => onMouseDown(e, element, 'person')}
      className={isReadOnly ? '' : 'cursor-pointer'}
    >
      <g
        fill="#ffffff"
        stroke={isSelected ? '#4f46e5' : '#166534'}
        strokeWidth={isSelected ? 3 : 2}
      >
        <path d={bodyPath} />
        <circle cx="0" cy={HEAD_Y_OFFSET} r={HEAD_RADIUS} />
      </g>
      <foreignObject x={-ELEMENT_WIDTH/2} y="0" width={ELEMENT_WIDTH} height={bodyHeight}>
        <div ref={contentRef} className="w-full p-2 pt-4 flex flex-col items-center justify-start text-center select-none" style={{ color: '#166534' }}>
          <div className="text-xs" style={{ opacity: 0.85 }}>[Person]</div>
          <div className="font-bold">{element.label}</div>
          <div className="text-xs break-words" style={{ opacity: 0.85, whiteSpace: 'pre-wrap' }}>{element.description}</div>
        </div>
      </foreignObject>
    </g>
  );
};

export default Person;