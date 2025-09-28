import React, { FC, SVGProps } from 'react';
import { ElementData } from '../../types';
import { diagramParameterDefs } from '../../constants';

interface DataDisplayProps {
  x: number;
  y: number;
  data?: ElementData;
}

export const DataDisplay: FC<DataDisplayProps> = ({ x, y, data }) => {
    if (!data) return null;
    
    const rows = Object.entries(diagramParameterDefs)
        .map(([key, def]) => {
            const value = data[key];
            if (value === undefined || value === '') return null;
            return { key, def, value };
        })
        .filter(Boolean);
        
    if (rows.length === 0) return null;

    return (
        <foreignObject x={x} y={y} width="120" height="100">
            {/* FIX: Removed xmlns attribute which is not a valid prop for a div in React's JSX and causes a TypeScript error. */}
            <div
                className="bg-white/80 border border-gray-400 rounded-md p-1 text-[10px] text-gray-800"
                style={{ fontFamily: 'sans-serif' }}
            >
                <table className="w-full">
                    <tbody>
                        {rows.map(row => (
                          row && (
                            <tr key={row.key}>
                                <td className="font-bold pr-1">{row.def.abbr}:</td>
                                <td className="text-right pr-1">{row.value}</td>
                                <td className="text-gray-600">{row.def.unit}</td>
                            </tr>
                          )
                        ))}
                    </tbody>
                </table>
            </div>
        </foreignObject>
    );
};


interface FigureProps extends SVGProps<SVGGElement> {
  x: number;
  y: number;
  label: string;
  isSelected: boolean;
  isEditing?: boolean;
  showData?: boolean;
  showAllData?: boolean;
  data?: ElementData;
}

const commonStroke = 'stroke-gray-700';
const selectedStroke = 'stroke-indigo-600';

const Rectangle: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, showData, showAllData, data, ...props }) => {
  const shouldShowData = (showData === true) || (showData !== false && showAllData);
  return (
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
      {shouldShowData && <DataDisplay x={-60} y={45} data={data} />}
    </g>
  );
};

const Circle: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, showData, showAllData, data, ...props }) => {
  const shouldShowData = (showData === true) || (showData !== false && showAllData);
  return (
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
      {shouldShowData && <DataDisplay x={-60} y={55} data={data} />}
    </g>
  );
};

const Cloud: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, showData, showAllData, data, ...props }) => {
  const shouldShowData = (showData === true) || (showData !== false && showAllData);
  return (
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
      {shouldShowData && <DataDisplay x={-60} y={55} data={data} />}
    </g>
  );
};

const Actor: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, showData, showAllData, data, ...props }) => {
  const shouldShowData = (showData === true) || (showData !== false && showAllData);
  return (
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
      {shouldShowData && <DataDisplay x={-60} y={45} data={data} />}
    </g>
  );
};


export const FigureComponents = {
  rectangle: Rectangle,
  circle: Circle,
  cloud: Cloud,
  actor: Actor,
};