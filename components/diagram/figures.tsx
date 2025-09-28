import React, { FC, SVGProps, ReactNode } from 'react';
import { ElementData } from '../../types';
import { diagramParameterDefs } from '../../constants';

interface DataDisplayProps {
  x: number;
  y: number;
  data?: ElementData;
}

const formatScientific = (num: number | string): ReactNode => {
    const number = Number(num);
    if (isNaN(number)) {
        return String(num); // return original string if not a number
    }
    if (number === 0) {
        return "0.0";
    }

    const exponent = Math.floor(Math.log10(Math.abs(number)));

    // Handle numbers that don't need scientific notation (e.g., from 1.0 up to 10.0)
    if (exponent === 0) {
        return number.toFixed(1);
    }

    const absNumber = Math.abs(number);
    const sign = number < 0 ? '-' : '';
    
    const mantissa = absNumber / Math.pow(10, exponent);

    // If the mantissa is less than 1.5, we only show the order of magnitude.
    if (mantissa < 1.5) {
        return (
            <span style={{ whiteSpace: 'nowrap' }}>
                {sign}10<sup>{exponent}</sup>
            </span>
        );
    }

    // Otherwise, show the mantissa rounded to 1 decimal place.
    let roundedMantissaStr = mantissa.toFixed(1);
    let finalExponent = exponent;

    // Handle cases where rounding the mantissa bumps it to 10.0
    if (roundedMantissaStr === '10.0') {
        roundedMantissaStr = '1.0';
        finalExponent += 1;
    }
    
    return (
        <span style={{ whiteSpace: 'nowrap' }}>
            {sign}{roundedMantissaStr} &times; 10<sup>{finalExponent}</sup>
        </span>
    );
};

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
        <foreignObject x={x} y={y} width="140" height="100">
            {/* FIX: Removed xmlns attribute which is not a valid prop for a div in React's JSX and causes a TypeScript error. */}
            <div
                className="bg-white/80 rounded-md p-1 text-[10px] text-gray-800"
                style={{ fontFamily: 'sans-serif' }}
            >
                <table className="w-full">
                    <tbody>
                        {rows.map(row => (
                          row && (
                            <tr key={row.key}>
                                <td className="font-bold pr-1">{row.def.abbr}:</td>
                                <td className="text-right pr-1">{formatScientific(row.value)}</td>
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
  isReadOnly?: boolean;
}

const commonStroke = 'stroke-gray-700';
const selectedStroke = 'stroke-indigo-600';

const Rectangle: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, showData, showAllData, data, isReadOnly, ...props }) => {
  const shouldShowData = isReadOnly ? (!!showAllData && showData !== false) : (typeof showData === 'boolean' ? showData : !!showAllData);
  const numLines = label.split('\n').length;
  const labelHeightAddition = (numLines - 1) * 14.4; // 12px font * 1.2em line height
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
      {shouldShowData && <DataDisplay x={-70} y={45 + labelHeightAddition} data={data} />}
    </g>
  );
};

const Circle: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, showData, showAllData, data, isReadOnly, ...props }) => {
  const shouldShowData = isReadOnly ? (!!showAllData && showData !== false) : (typeof showData === 'boolean' ? showData : !!showAllData);
  const numLines = label.split('\n').length;
  const labelHeightAddition = (numLines - 1) * 14.4; // 12px font * 1.2em line height
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
      {shouldShowData && <DataDisplay x={-70} y={55 + labelHeightAddition} data={data} />}
    </g>
  );
};

const Cloud: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, showData, showAllData, data, isReadOnly, ...props }) => {
  const shouldShowData = isReadOnly ? (!!showAllData && showData !== false) : (typeof showData === 'boolean' ? showData : !!showAllData);
  const numLines = label.split('\n').length;
  const labelHeightAddition = (numLines - 1) * 14.4; // 12px font * 1.2em line height
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
      {shouldShowData && <DataDisplay x={-70} y={55 + labelHeightAddition} data={data} />}
    </g>
  );
};

const Actor: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, showData, showAllData, data, isReadOnly, ...props }) => {
  const shouldShowData = isReadOnly ? (!!showAllData && showData !== false) : (typeof showData === 'boolean' ? showData : !!showAllData);
  const numLines = label.split('\n').length;
  const labelHeightAddition = (numLines - 1) * 14.4; // 12px font * 1.2em line height
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
      {shouldShowData && <DataDisplay x={-70} y={45 + labelHeightAddition} data={data} />}
    </g>
  );
};


export const FigureComponents = {
  rectangle: Rectangle,
  circle: Circle,
  cloud: Cloud,
  actor: Actor,
};