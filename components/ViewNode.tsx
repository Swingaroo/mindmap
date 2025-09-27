
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ViewNodeData, TextStyle } from '../types';

const ViewNode: React.FC<NodeProps<ViewNodeData>> = ({ data, selected }) => {
  const { title, elements, onFocus } = data;

  return (
    <div className={`
      bg-white rounded-lg shadow-lg border-2 
      ${selected ? 'border-indigo-600' : 'border-gray-300'} 
      w-80 transition-all duration-150 ease-in-out
    `}>
      <Handle type="target" position={Position.Top} className="!bg-indigo-500" />
      <Handle type="target" position={Position.Left} className="!bg-indigo-500" />
      
      <div className="bg-gray-100 p-2 rounded-t-md border-b">
        <h3 className="text-center font-semibold text-gray-800 break-words">{title}</h3>
      </div>
      
      <div className="p-4 space-y-2 min-h-[50px]">
        {elements.map(element => {
          switch (element.type) {
            case 'text':
              return (
                <p 
                  key={element.id} 
                  className={`
                    break-words whitespace-pre-wrap
                    ${element.style === TextStyle.Title ? 'text-xl font-bold text-gray-900' : 'text-sm text-gray-700'}
                  `}
                >
                  {element.content}
                </p>
              );
            case 'image':
              return (
                <img 
                  key={element.id} 
                  src={element.src} 
                  alt="view content" 
                  className="max-w-full h-auto rounded"
                />
              );
            case 'link':
              return (
                 <button
                    key={element.id}
                    onClick={() => onFocus(element.targetViewId)}
                    className="w-full text-left text-sm text-indigo-600 hover:text-indigo-800 hover:underline bg-indigo-50 p-2 rounded transition-colors"
                 >
                    &rarr; {element.content}
                 </button>
              );
            default:
              return null;
          }
        })}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500" />
    </div>
  );
};

export default memo(ViewNode);
