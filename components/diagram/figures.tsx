import React, { FC, SVGProps } from 'react';

interface FigureProps extends SVGProps<SVGGElement> {
  x: number;
  y: number;
  label: string;
  isSelected: boolean;
  isEditing?: boolean;
}

const commonStroke = 'stroke-gray-700';
const selectedStroke = 'stroke-indigo-600';

const Rectangle: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, ...props }) => (
  <g transform={`translate(${x}, ${y})`} {...props}>
    <rect 
      x="-50" y="-25" width="100" height="50" 
      className={`fill-white ${isSelected ? selectedStroke : commonStroke}`}
      strokeWidth="2"
    />
    {!isEditing && (
      <text y="40" textAnchor="middle" fontSize="12" className="select-none fill-current">
        {label.split('\n').map((line, i) => (
            <tspan x="0" dy={i === 0 ? 0 : '1.2em'} key={i}>{line}</tspan>
        ))}
      </text>
    )}
  </g>
);

const Circle: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, ...props }) => (
  <g transform={`translate(${x}, ${y})`} {...props}>
    <circle 
      r="35" 
      className={`fill-white ${isSelected ? selectedStroke : commonStroke}`}
      strokeWidth="2"
    />
    {!isEditing && (
        <text y="50" textAnchor="middle" fontSize="12" className="select-none fill-current">
            {label.split('\n').map((line, i) => (
                <tspan x="0" dy={i === 0 ? 0 : '1.2em'} key={i}>{line}</tspan>
            ))}
        </text>
    )}
  </g>
);

const Cloud: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, ...props }) => (
  <g transform={`translate(${x}, ${y})`} {...props}>
    <path 
      d="M -37.5 -22.5 a 30 30 1 0 0 0 60 h 75 a 30 30 1 0 0 0 -60 a 15 15 1 0 0 -22.5 -15 a 22.5 22.5 1 0 0 -52.5 15 z"
      className={`fill-white ${isSelected ? selectedStroke : commonStroke}`}
      strokeWidth="2"
    />
    {!isEditing && (
        <text y="50" textAnchor="middle" fontSize="12" className="select-none fill-current">
            {label.split('\n').map((line, i) => (
                <tspan x="0" dy={i === 0 ? 0 : '1.2em'} key={i}>{line}</tspan>
            ))}
        </text>
    )}
  </g>
);

const Actor: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, ...props }) => (
  <g transform={`translate(${x}, ${y})`} {...props}>
    <g className={`${isSelected ? selectedStroke : commonStroke}`} strokeWidth="2" fill="none">
      <circle cx="0" cy="-25" r="10" className="fill-white"/>
      <line x1="0" y1="-15" x2="0" y2="10" />
      <line x1="-20" y1="-5" x2="20" y2="-5" />
      <line x1="0" y1="10" x2="-15" y2="25" />
      <line x1="0" y1="10" x2="15" y2="25" />
    </g>
    {!isEditing && (
        <text y="40" textAnchor="middle" fontSize="12" className="select-none fill-current">
            {label.split('\n').map((line, i) => (
                <tspan x="0" dy={i === 0 ? 0 : '1.2em'} key={i}>{line}</tspan>
            ))}
        </text>
    )}
  </g>
);


export const FigureComponents = {
  rectangle: Rectangle,
  circle: Circle,
  cloud: Cloud,
  actor: Actor,
};