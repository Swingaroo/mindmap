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
    {!isEditing && <text y="40" textAnchor="middle" fontSize="12" className="select-none fill-current">{label}</text>}
  </g>
);

const Circle: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, ...props }) => (
  <g transform={`translate(${x}, ${y})`} {...props}>
    <circle 
      r="35" 
      className={`fill-white ${isSelected ? selectedStroke : commonStroke}`}
      strokeWidth="2"
    />
    {!isEditing && <text y="50" textAnchor="middle" fontSize="12" className="select-none fill-current">{label}</text>}
  </g>
);

const Cloud: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, ...props }) => (
  <g transform={`translate(${x}, ${y})`} {...props}>
    <path 
      d="M-40 10 C-60 10 -60 -20 -40 -20 C-20 -40 20 -40 40 -20 C60 -20 60 10 40 10 Z" 
      className={`fill-white ${isSelected ? selectedStroke : commonStroke}`}
      strokeWidth="2"
    />
    {!isEditing && <text y="25" textAnchor="middle" fontSize="12" className="select-none fill-current">{label}</text>}
  </g>
);

const Actor: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, ...props }) => (
  <g transform={`translate(${x}, ${y})`} {...props}>
    <g className={`${isSelected ? selectedStroke : commonStroke}`} strokeWidth="2" fill="none">
      <circle cx="0" cy="-25" r="10" className="fill-white"/>
      <line x1="0" y1="-15" x2="0" y2="10" />
      <line x1="-20" y1="0" x2="20" y2="0" />
      <line x1="0" y1="10" x2="-15" y2="25" />
      <line x1="0" y1="10" x2="15" y2="25" />
    </g>
    {!isEditing && <text y="40" textAnchor="middle" fontSize="12" className="select-none fill-current">{label}</text>}
  </g>
);


export const FigureComponents = {
  rectangle: Rectangle,
  circle: Circle,
  cloud: Cloud,
  actor: Actor,
};