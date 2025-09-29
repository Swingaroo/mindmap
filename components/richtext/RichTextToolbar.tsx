import React, { FC, SVGProps } from 'react';
import Button from '../ui/Button';
import { TFunction } from '../../i18n';

// A floating toolbar for the rich text editor
const RichTextToolbar: FC<{ onSave: () => void; onFormat: (command: string) => void; t: TFunction }> = ({ onSave, onFormat, t }) => {
    const FormatButton: FC<{ command: string, titleKey: string, children: React.ReactNode }> = ({ command, titleKey, children }) => (
        <button
            onMouseDown={(e) => {
                e.preventDefault();
                onFormat(command);
            }}
            title={t(titleKey)}
            className="w-8 h-8 flex items-center justify-center rounded text-gray-700 hover:bg-gray-200"
            tabIndex={-1}
        >
            {children}
        </button>
    );

    return (
        <div className="p-1 bg-white border border-gray-300 rounded-md shadow-lg flex items-center gap-1 flex-wrap">
            <FormatButton command="bold" titleKey="richTextEditor.bold"><BoldIcon className="w-5 h-5" /></FormatButton>
            <FormatButton command="italic" titleKey="richTextEditor.italic"><ItalicIcon className="w-5 h-5" /></FormatButton>
            <FormatButton command="underline" titleKey="richTextEditor.underline"><UnderlineIcon className="w-5 h-5" /></FormatButton>
            <FormatButton command="strikeThrough" titleKey="richTextEditor.strikethrough"><StrikeThroughIcon className="w-5 h-5" /></FormatButton>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <FormatButton command="insertUnorderedList" titleKey="richTextEditor.unorderedList"><ListUnorderedIcon className="w-5 h-5" /></FormatButton>
            <FormatButton command="insertOrderedList" titleKey="richTextEditor.orderedList"><ListOrderedIcon className="w-5 h-5" /></FormatButton>
            <div className="flex-grow" />
            <Button
                onMouseDown={(e) => {
                    e.preventDefault();
                    onSave();
                }}
                size="sm"
                variant="secondary"
                tabIndex={-1}
            >
                <CheckIcon className="w-4 h-4 mr-1" />
                {t('richTextEditor.done')}
            </Button>
        </div>
    );
};

// SVG Icons for Rich Text Editor
const BoldIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
  </svg>
);
const ItalicIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="19" y1="4" x2="10" y2="4"></line>
    <line x1="14" y1="20" x2="5" y2="20"></line>
    <line x1="15" y1="4" x2="9" y2="20"></line>
  </svg>
);
const UnderlineIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
    <line x1="4" y1="21" x2="20" y2="21"></line>
  </svg>
);
const StrikeThroughIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16 4H9a3 3 0 0 0-2.83 4"></path>
        <path d="M14 12a4 4 0 0 1 0 8H6"></path>
        <line x1="4" y1="12" x2="20" y2="12"></line>
    </svg>
);
const ListUnorderedIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);
const ListOrderedIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="10" y1="6" x2="21" y2="6"></line>
        <line x1="10" y1="12" x2="21" y2="12"></line>
        <line x1="10" y1="18" x2="21" y2="18"></line>
        <path d="M4 6h1v4"></path>
        <path d="M4 10h2"></path>
        <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
    </svg>
);
const CheckIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

export default RichTextToolbar;