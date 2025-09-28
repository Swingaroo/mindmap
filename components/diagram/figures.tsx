import React, { FC, SVGProps, ReactNode } from 'react';
import { ElementData } from '../../types';
import { diagramParameterDefs } from '../../constants';

interface DataDisplayProps {
  x: number;
  y: number;
  data?: ElementData;
}

const formatNumber = (num: number | string): ReactNode => {
    const number = Number(num);
    if (isNaN(number)) {
        return String(num); // return original string if not a number
    }

    if (Math.abs(number) >= 1_000_000) {
        // Scientific notation for large numbers
        if (number === 0) return "0.0"; // Should not happen with the check above, but for safety

        const exponent = Math.floor(Math.log10(Math.abs(number)));
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
    } else {
        // Format with thousands separator for smaller numbers, using a locale that provides spaces.
        return number.toLocaleString('sv-SE');
    }
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

    const height = rows.length * 18 + 8; // ~18px line-height for 12px font + p-1 padding
    const width = 250; // A reasonably large width to contain the centered content

    return (
        <foreignObject x={x - (width / 2)} y={y} width={width} height={height}>
            <div
                style={{
                    fontFamily: 'sans-serif',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <div
                    className="bg-white/80 rounded-md p-1 text-[12px] text-gray-800"
                    style={{ display: 'inline-block' }}
                >
                    {rows.map(row => (
                      row && (
                        <div key={row.key} className="whitespace-nowrap">
                            <span className="font-bold">{row.def.abbr}:</span>
                            <span className="ml-1">{formatNumber(row.value)}</span>
                            <span className="ml-1 text-gray-600">{row.def.unit}</span>
                        </div>
                      )
                    ))}
                </div>
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
  const shouldShowData = isReadOnly ? (showData === true && !!showAllData) : (showData === true);
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
      {shouldShowData && <DataDisplay x={0} y={45 + labelHeightAddition} data={data} />}
    </g>
  );
};

const Circle: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, showData, showAllData, data, isReadOnly, ...props }) => {
  const shouldShowData = isReadOnly ? (showData === true && !!showAllData) : (showData === true);
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
      {shouldShowData && <DataDisplay x={0} y={55 + labelHeightAddition} data={data} />}
    </g>
  );
};

const Cloud: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, showData, showAllData, data, isReadOnly, ...props }) => {
  const shouldShowData = isReadOnly ? (showData === true && !!showAllData) : (showData === true);
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
      {shouldShowData && <DataDisplay x={0} y={55 + labelHeightAddition} data={data} />}
    </g>
  );
};

const Actor: FC<FigureProps> = ({ x, y, label, isSelected, isEditing, showData, showAllData, data, isReadOnly, ...props }) => {
  const shouldShowData = isReadOnly ? (showData === true && !!showAllData) : (showData === true);
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
      {shouldShowData && <DataDisplay x={0} y={45 + labelHeightAddition} data={data} />}
    </g>
  );
};


export const FigureComponents = {
  rectangle: Rectangle,
  circle: Circle,
  cloud: Cloud,
  actor: Actor,
};