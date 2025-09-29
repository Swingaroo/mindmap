import React, { FC, useRef, useEffect, SVGProps } from 'react';
import { RichTextElement } from '../../types';
import Button from '../ui/Button';
import { useTranslation, TFunction } from '../../i18n';
import RichTextToolbar from './RichTextToolbar';

// A component to display and edit a single rich text element
const RichTextEditor: FC<{
    element: RichTextElement;
    isEditing: boolean;
    isReadOnly: boolean;
    onStartEdit: () => void;
    onSave: (newContent: string) => void;
    t: TFunction;
}> = ({ element, isEditing, isReadOnly, onStartEdit, onSave, t }) => {
    const richTextRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isEditing && richTextRef.current) {
            richTextRef.current.focus();
            // Move cursor to the end
            const selection = window.getSelection();
            if (selection) {
                const range = document.createRange();
                range.selectNodeContents(richTextRef.current);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }, [isEditing]);

    const handleSave = () => {
        if (isEditing && richTextRef.current) {
            onSave(richTextRef.current.innerHTML);
        }
    };
    
    const handleFormat = (command: string) => {
        document.execCommand(command, false);
        richTextRef.current?.focus();
    };

    return (
        <div className="relative rich-text-content">
            {isEditing && !isReadOnly && (
                <div 
                    ref={toolbarRef}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20"
                >
                    <RichTextToolbar onSave={handleSave} onFormat={handleFormat} t={t} />
                </div>
            )}

            {!isReadOnly && !isEditing && (
                <div className="absolute top-0 right-0 z-10">
                    <Button onClick={onStartEdit} variant="outline" size="sm">
                        <EditIcon className="w-4 h-4 mr-1" />
                        {t('viewNode.editRichText')}
                    </Button>
                </div>
            )}
            
            <div
                ref={richTextRef}
                contentEditable={isEditing && !isReadOnly}
                suppressContentEditableWarning
                className={`nodrag text-sm text-gray-700 break-words
                            [&_ul]:list-disc [&_ul]:pl-5
                            [&_ol]:list-decimal [&_ol]:pl-5
                            ${isEditing && !isReadOnly
                                ? 'p-2 min-h-[80px] focus:outline-none ring-2 ring-indigo-500 rounded-md bg-white'
                                : ''
                            }`}
                dangerouslySetInnerHTML={{ __html: element.content }}
            />
        </div>
    );
};

const EditIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
);


export default RichTextEditor;