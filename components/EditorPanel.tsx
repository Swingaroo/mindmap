
import React, { useState, useRef, useCallback } from 'react';
import { Node } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { ViewNodeData, ViewElement, TextStyle } from '../types';
import Button from './ui/Button';

interface EditorPanelProps {
  node: Node<ViewNodeData>;
  onNodeDataChange: (nodeId: string, newData: Partial<ViewNodeData>) => void;
  onClose: () => void;
  allNodes: Node<ViewNodeData>[];
}

const EditorPanel: React.FC<EditorPanelProps> = ({ node, onNodeDataChange, onClose, allNodes }) => {
  const [title, setTitle] = useState(node.data.title);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    onNodeDataChange(node.id, { title });
  };

  const updateElements = useCallback((newElements: ViewElement[]) => {
    onNodeDataChange(node.id, { elements: newElements });
  }, [node.id, onNodeDataChange]);

  const addElement = (type: 'text' | 'image' | 'link') => {
    let newElement: ViewElement;
    if (type === 'text') {
      newElement = { id: uuidv4(), type: 'text', content: 'New Text', style: TextStyle.Body };
      updateElements([...node.data.elements, newElement]);
    } else if (type === 'image') {
      imageInputRef.current?.click();
    } else if (type === 'link') {
        const otherNodes = allNodes.filter(n => n.id !== node.id);
        if (otherNodes.length > 0) {
            newElement = { id: uuidv4(), type: 'link', content: 'Link to another view', targetViewId: otherNodes[0].id };
            updateElements([...node.data.elements, newElement]);
        } else {
            alert("No other views to link to. Please create another view first.");
        }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newElement: ViewElement = { id: uuidv4(), type: 'image', src: reader.result as string };
        updateElements([...node.data.elements, newElement]);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleElementChange = (id: string, newContent: Partial<ViewElement>) => {
    const newElements = node.data.elements.map((el) => 
      el.id === id ? { ...el, ...newContent } : el
    );
    updateElements(newElements);
  };
  
  const deleteElement = (id: string) => {
    const newElements = node.data.elements.filter(el => el.id !== id);
    updateElements(newElements);
  };


  return (
    <div className="w-96 bg-white shadow-lg flex flex-col z-10 border-l border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Edit View</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                <CloseIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="p-4 flex-grow overflow-y-auto">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">View Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    onBlur={handleTitleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            <div className="mb-4 border-t pt-4">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Add Content</h3>
                <div className="grid grid-cols-3 gap-2">
                    <Button onClick={() => addElement('text')} variant="outline">Title Text</Button>
                    <Button onClick={() => addElement('text')} variant="outline">Body Text</Button>
                    <Button onClick={() => addElement('image')} variant="outline">Image</Button>
                    <Button onClick={() => addElement('link')} variant="outline">Link</Button>
                </div>
                 <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                />
            </div>
            
            <div className="space-y-4 border-t pt-4">
                <h3 className="text-md font-semibold text-gray-700 mb-2">Content Elements</h3>
                {node.data.elements.map((el) => (
                    <ElementEditor 
                        key={el.id} 
                        element={el} 
                        onChange={handleElementChange} 
                        onDelete={deleteElement} 
                        allNodes={allNodes}
                        currentNodeId={node.id}
                    />
                ))}
            </div>
        </div>
    </div>
  );
};

// FIX: Explicitly type ElementEditor props to resolve component type inference issue.
interface ElementEditorProps {
    element: ViewElement;
    onChange: (id: string, content: Partial<ViewElement>) => void;
    onDelete: (id: string) => void;
    allNodes: Node<ViewNodeData>[];
    currentNodeId: string;
}

const ElementEditor: React.FC<ElementEditorProps> = ({ element, onChange, onDelete, allNodes, currentNodeId }) => {
    return (
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200 relative group">
            <button onClick={() => onDelete(element.id)} className="absolute top-1 right-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <TrashIcon className="w-4 h-4" />
            </button>
            {element.type === 'text' && (
                <div>
                    <select
                        value={element.style}
                        onChange={(e) => onChange(element.id, { style: e.target.value as TextStyle })}
                        className="w-full mb-2 p-1 border border-gray-300 rounded-md text-sm"
                    >
                        <option value={TextStyle.Title}>Title</option>
                        <option value={TextStyle.Body}>Body</option>
                    </select>
                    <textarea
                        value={element.content}
                        onChange={(e) => onChange(element.id, { content: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        rows={element.style === TextStyle.Title ? 1 : 3}
                    />
                </div>
            )}
            {element.type === 'image' && (
                <img src={element.src} alt="user content" className="max-w-full h-auto rounded-md" />
            )}
            {element.type === 'link' && (
                 <div>
                    <input
                        type="text"
                        value={element.content}
                        onChange={(e) => onChange(element.id, { content: e.target.value })}
                        className="w-full mb-2 p-2 border border-gray-300 rounded-md shadow-sm"
                        placeholder="Link text"
                    />
                    <select
                        value={element.targetViewId}
                        onChange={(e) => onChange(element.id, { targetViewId: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                        {allNodes.filter(n => n.id !== currentNodeId).map(n => (
                            <option key={n.id} value={n.id}>{n.data.title || `View ${n.id}`}</option>
                        ))}
                    </select>
                 </div>
            )}
        </div>
    );
};


const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);


export default EditorPanel;