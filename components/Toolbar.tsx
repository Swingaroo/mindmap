
import React from 'react';
import Button from './ui/Button';

interface ToolbarProps {
  onAddView: () => void;
  onSave: () => void;
  onLoad: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddView, onSave, onLoad }) => {
  return (
    <div className="w-full bg-white shadow-md p-2 flex items-center justify-between z-10">
      <h1 className="text-xl font-bold text-gray-800">MindMap Presenter</h1>
      <div className="flex items-center gap-2">
        <Button onClick={onAddView}>
            <PlusIcon className="w-5 h-5 mr-1" />
            Add View
        </Button>
        <Button onClick={onSave} variant="secondary">
            <SaveIcon className="w-5 h-5 mr-1" />
            Save
        </Button>
        <Button onClick={onLoad} variant="secondary">
            <LoadIcon className="w-5 h-5 mr-1" />
            Load
        </Button>
      </div>
    </div>
  );
};

// SVG Icons
const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const SaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const LoadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);


export default Toolbar;
