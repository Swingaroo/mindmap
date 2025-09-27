import React, { FC, SVGProps, useState, useRef, useEffect } from 'react';
import Button from './ui/Button';
import { useTranslation } from '../i18n';

interface ToolbarProps {
  onAddView: () => void;
  onSave: () => void;
  onSaveToPdf: () => void;
  onSaveToHtml: () => void;
  onLoad: () => void;
  isReadOnly: boolean;
  onToggleReadOnly: () => void;
  isHighlighterActive?: boolean;
  onToggleHighlighter?: () => void;
  isMiniMapVisible: boolean;
  onToggleMiniMap: () => void;
}

const Toolbar: FC<ToolbarProps> = ({ onAddView, onSave, onSaveToPdf, onSaveToHtml, onLoad, isReadOnly, onToggleReadOnly, isHighlighterActive, onToggleHighlighter, isMiniMapVisible, onToggleMiniMap }) => {
  const { t, locale, setLocale } = useTranslation();
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const saveMenuRef = useRef<HTMLDivElement>(null);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(event.target as Node)) {
        setIsSaveMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full bg-white shadow-md p-2 flex items-center justify-between z-30">
      <h1 className="text-xl font-bold text-gray-800">{t('appName')}</h1>
      <div className="flex items-center gap-2">
         <Button onClick={onToggleReadOnly} variant="secondary">
            {isReadOnly ? (
                <>
                    <EditIcon className="w-5 h-5 mr-1" />
                    {t('toolbar.editMode')}
                </>
            ) : (
                <>
                    <PreviewIcon className="w-5 h-5 mr-1" />
                    {t('toolbar.previewMode')}
                </>
            )}
        </Button>
        {isReadOnly ? (
            <Button onClick={onToggleHighlighter} variant={isHighlighterActive ? 'secondary' : 'outline'} title={t('toolbar.toggleHighlighter')}>
                <HighlighterIcon className="w-5 h-5 mr-1" />
                {t('toolbar.highlighter')}
            </Button>
        ) : (
            <>
                <Button onClick={onAddView}>
                    <PlusIcon className="w-5 h-5 mr-1" />
                    {t('toolbar.addView')}
                </Button>
                <div className="relative" ref={saveMenuRef}>
                    <Button onClick={() => setIsSaveMenuOpen(prev => !prev)} variant="secondary">
                        <SaveIcon className="w-5 h-5 mr-1" />
                        {t('toolbar.save.button')}
                        <ChevronDownIcon className="w-4 h-4 ml-1" />
                    </Button>
                    {isSaveMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-20">
                            <ul className="py-1">
                                <li>
                                    <button
                                        onClick={() => { onSave(); setIsSaveMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                        <FileJsonIcon className="w-4 h-4 mr-2" />
                                        {t('toolbar.save.asJson')}
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => { onSaveToPdf(); setIsSaveMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                        <FilePdfIcon className="w-4 h-4 mr-2" />
                                        {t('toolbar.save.asPdf')}
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => { onSaveToHtml(); setIsSaveMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                        <FileHtmlIcon className="w-4 h-4 mr-2" />
                                        {t('toolbar.save.asHtml')}
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </>
        )}
        <div className="w-px bg-gray-300 h-8 mx-2"></div>
        <Button onClick={onLoad} variant="secondary">
            <LoadIcon className="w-5 h-5 mr-1" />
            {t('toolbar.load')}
        </Button>
        <Button 
            onClick={onToggleMiniMap} 
            variant={isMiniMapVisible ? 'secondary' : 'outline'}
            title={isMiniMapVisible ? t('toolbar.hideMinimap') : t('toolbar.showMinimap')}
        >
            <MiniMapIcon className="w-5 h-5" />
        </Button>
        <div className="relative" ref={langMenuRef}>
            <Button onClick={() => setIsLangMenuOpen(prev => !prev)} variant="outline">
                <GlobeIcon className="w-5 h-5 mr-2" />
                {locale.toUpperCase()}
                <ChevronDownIcon className="w-4 h-4 ml-1" />
            </Button>
            {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border z-20">
                    <ul className="py-1">
                        <li>
                            <button
                                onClick={() => { setLocale('en'); setIsLangMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                {t('toolbar.languages.en')}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => { setLocale('ru'); setIsLangMenuOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                {t('toolbar.languages.ru')}
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </div>
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

const ChevronDownIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const FileJsonIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const FilePdfIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 13.5v-3a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-2.25v1.5a.75.75 0 01-1.5 0zm2.25 1.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3a.75.75 0 01.75-.75zm-3-4.5a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-4.5a.75.75 0 01.75-.75z" />
    </svg>
);

const FileHtmlIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
);

const GlobeIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.952 1.006a10.999 10.999 0 1 0 0 21.998 10.999 10.999 0 0 0 0-21.998Z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.01 1.006v21.998M23.141 12.005H.858m2.518-6.855a16.892 16.892 0 0 1 17.256 0m0 13.71a16.892 16.892 0 0 1-17.256 0M11.152 1.293A14.004 14.004 0 0 0 6.08 12.057a14.004 14.004 0 0 0 5.071 10.79m1.713 0a14.004 14.004 0 0 0 5.071-10.79 14.004 14.004 0 0 0-5.071-10.765"/>
    </svg>
);

export default Toolbar;