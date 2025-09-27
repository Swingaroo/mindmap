import React, { FC, SVGProps } from 'react';
import Button from './ui/Button';

interface ToolbarProps {
  onAddView: () => void;
  onSave: () => void;
  onLoad: () => void;
  isReadOnly: boolean;
  onToggleReadOnly: () => void;
  isHighlighterActive?: boolean;
  onToggleHighlighter?: () => void;
  isMiniMapVisible: boolean;
  onToggleMiniMap: () => void;
}

const Toolbar: FC<ToolbarProps> = ({ onAddView, onSave, onLoad, isReadOnly, onToggleReadOnly, isHighlighterActive, onToggleHighlighter, isMiniMapVisible, onToggleMiniMap }) => {
  return (
    <div className="w-full bg-white shadow-md p-2 flex items-center justify-between z-10">
      <h1 className="text-xl font-bold text-gray-800">MindMap Presenter</h1>
      <div className="flex items-center gap-2">
         <Button onClick={onToggleReadOnly} variant="secondary">
            {isReadOnly ? (
                <>
                    <EditIcon className="w-5 h-5 mr-1" />
                    Edit Mode
                </>
            ) : (
                <>
                    <PreviewIcon className="w-5 h-5 mr-1" />
                    Preview Mode
                </>
            )}
        </Button>
        {isReadOnly ? (
            <Button onClick={onToggleHighlighter} variant={isHighlighterActive ? 'secondary' : 'outline'} title="Toggle highlighter tool">
                <HighlighterIcon className="w-5 h-5 mr-1" />
                Highlighter
            </Button>
        ) : (
            <>
                <Button onClick={onAddView}>
                    <PlusIcon className="w-5 h-5 mr-1" />
                    Add View
                </Button>
                <Button onClick={onSave} variant="secondary">
                    <SaveIcon className="w-5 h-5 mr-1" />
                    Save
                </Button>
            </>
        )}
        <div className="w-px bg-gray-300 h-8 mx-2"></div>
        <Button onClick={onLoad} variant="secondary">
            <LoadIcon className="w-5 h-5 mr-1" />
            Load
        </Button>
        <Button 
            onClick={onToggleMiniMap} 
            variant={isMiniMapVisible ? 'secondary' : 'outline'}
            title={isMiniMapVisible ? 'Hide Minimap' : 'Show Minimap'}
        >
            <MiniMapIcon className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

// SVG Icons
const PlusIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const SaveIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const LoadIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
);

const PreviewIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const EditIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

const HighlighterIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.998 15.998 0 011.622-3.385m5.043.025a15.998 15.998 0 001.622-3.385m3.388 1.62a15.998 15.998 0 00-1.622-3.385m0 0a3 3 0 10-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 00-3.388-1.62m5.043.025a15.998 15.998 0 01-1.622-3.385" />
  </svg>
);

const MiniMapIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 15.75h3.75v-3.75h-3.75v3.75z" />
  </svg>
);


export default Toolbar;