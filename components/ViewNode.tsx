import React, { FC, memo } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import showdown from 'showdown';
import { ViewNodeData, TextStyle } from '../types';

const converter = new showdown.Converter();
converter.setOption('simpleLineBreaks', true);

const ViewNode: FC<NodeProps<ViewNodeData>> = ({ data, selected }) => {
  const { title, elements, onFocus } = data;

  return (
    <div className={`
      bg-white rounded-lg shadow-lg border-2 h-full w-full
      ${selected ? 'border-indigo-600' : 'border-gray-300'} 
      transition-colors duration-150 ease-in-out flex flex-col
    `}>
      <NodeResizer 
        minWidth={200}
        minHeight={100}
        isVisible={selected}
        lineClassName="border-indigo-600"
        handleClassName="bg-indigo-600 h-3 w-3 rounded-full border-2 border-white"
      />
      <div className="bg-gray-100 p-2 rounded-t-md border-b cursor-move">
        <h3 className="text-center font-semibold text-gray-800 break-words">{title}</h3>
      </div>
      
      <div className="p-4 space-y-2 flex-grow overflow-y-auto">
        {elements.map(element => {
          switch (element.type) {
            case 'text':
              if (element.style === TextStyle.Body) {
                const htmlContent = converter.makeHtml(element.content);
                return (
                  <div
                    key={element.id}
                    className="text-sm text-gray-700 break-words 
                               [&_ul]:list-disc [&_ul]:pl-5
                               [&_ol]:list-decimal [&_ol]:pl-5
                               [&_strong]:font-bold [&_b]:font-bold
                               [&_em]:italic [&_i]:italic
                               [&_p]:m-0"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                );
              }
              return (
                <p 
                  key={element.id} 
                  className="text-xl font-bold text-gray-900 break-words"
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
    </div>
  );
};

export default memo(ViewNode);