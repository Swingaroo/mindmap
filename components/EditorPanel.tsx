import React, { FC, useState, useRef, useCallback, SVGProps } from 'react';
import { Node } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { ViewNodeData, ViewElement, TextStyle, ImageElement, LinkElement, TextElement, DiagramElement, DiagramFigure, DiagramFigureType, DiagramArrow, ArrowType, ElementData, RichTextElement } from '../types';
import Button from './ui/Button';
import DiagramEditor from './diagram/DiagramEditor';
import { useTranslation } from '../i18n';
import { diagramParameterDefs } from '../constants';

interface EditorPanelProps {
  node: Node<ViewNodeData>;
  onNodeDataChange: (nodeId: string, newData: Partial<ViewNodeData>) => void;
  onNodeSizeChange: (nodeId: string, width: number, height: number) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
  allNodes: Node<ViewNodeData>[];
  sizeOptions: { label: string; width: number; height: number }[];
}

const EditorPanel: FC<EditorPanelProps> = ({ node, onNodeDataChange, onNodeSizeChange, onDeleteNode, onClose, allNodes, sizeOptions }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(node.data.title);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
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

  const addElement = (type: 'text' | 'image' | 'link' | 'diagram' | 'richtext', style: TextStyle = TextStyle.Body) => {
    if (type === 'text') {
      const newElement: TextElement = { id: uuidv4(), type: 'text', content: t('defaults.newTextElementContent'), style };
      updateElements([...node.data.elements, newElement]);
    } else if (type === 'image') {
      imageInputRef.current?.click();
    } else if (type === 'link') {
        const otherNodes = allNodes.filter(n => n.id !== node.id);
        if (otherNodes.length > 0) {
            const newElement: LinkElement = { id: uuidv4(), type: 'link', content: t('defaults.newLinkElementContent'), targetViewId: otherNodes[0].id };
            updateElements([...node.data.elements, newElement]);
        } else {
            alert(t('errors.noOtherViewsToLink'));
        }
    } else if (type === 'diagram') {
        const newElement: DiagramElement = { 
            id: uuidv4(), 
            type: 'diagram',
            caption: t('defaults.newDiagramElementCaption'),
            diagramState: { figures: [], arrows: [] },
            height: 400,
        };
        updateElements([...node.data.elements, newElement]);
    } else if (type === 'richtext') {
        const newElement: RichTextElement = {
            id: uuidv4(),
            type: 'richtext',
            content: t('defaults.newRichTextElementContent'),
        };
        updateElements([...node.data.elements, newElement]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newElement: ImageElement = {
          id: uuidv4(),
          type: 'image',
          src: reader.result as string,
          caption: file.name,
        };
        updateElements([...node.data.elements, newElement]);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleElementChange = (id: string, newContent: Partial<ViewElement>) => {
    const newElements = node.data.elements.map((el) =>
      el.id === id ? { ...el, ...newContent } : el
    );
    // FIX: Add type assertion. The spread operator with a partial of a union type (`Partial<ViewElement>`)
    // causes TypeScript to infer a wider, incorrect type for the new array (`newElements`).
    // The application logic in ElementEditor ensures that only valid properties are passed for each element type,
    // so this assertion is safe.
    updateElements(newElements as ViewElement[]);
  };
  
  const deleteElement = (id: string) => {
    const newElements = node.data.elements.filter(el => el.id !== id);
    updateElements(newElements);
  };


  return (
    <div className="w-96 bg-white shadow-lg flex flex-col z-10 border-l border-gray-200 h-full relative">
        {isDeleteConfirmVisible && (
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-30">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full">
                    <h3 className="text-lg font-medium text-gray-900">{t('editorPanel.deleteView.confirmTitle')}</h3>
                    <p className="mt-2 text-sm text-gray-500">{t('editorPanel.deleteView.confirm')}</p>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsDeleteConfirmVisible(false)}>
                            {t('editorPanel.deleteView.cancel')}
                        </Button>
                        <Button
                            onClick={() => {
                                onDeleteNode(node.id);
                                // No need to hide modal, component will unmount
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
                        >
                            {t('editorPanel.deleteView.confirmButton')}
                        </Button>
                    </div>
                </div>
            </div>
        )}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">{t('editorPanel.title')}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                <CloseIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="p-4 flex-grow overflow-y-auto">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('editorPanel.viewTitleLabel')}</label>
                <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    onBlur={handleTitleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('editorPanel.viewSizeLabel')}</label>
                <div className="flex items-center gap-2">
                    {sizeOptions.map(option => (
                        <Button
                            key={option.label}
                            onClick={() => onNodeSizeChange(node.id, option.width, option.height)}
                            variant={
                                node.style?.width === `${option.width}px` &&
                                node.style?.height === `${option.height}px`
                                ? 'primary'
                                : 'outline'
                            }
                            className="flex-1"
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="mb-4 border-t pt-4">
                <h3 className="text-md font-semibold text-gray-700 mb-2">{t('editorPanel.addContent.title')}</h3>
                <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => addElement('text', TextStyle.Title)} variant="outline">{t('editorPanel.addContent.titleText')}</Button>
                    <Button onClick={() => addElement('text', TextStyle.Body)} variant="outline">{t('editorPanel.addContent.bodyText')}</Button>
                    <Button onClick={() => addElement('richtext')} variant="outline" className="col-span-2" disabled>
                        <RichTextIcon className="w-4 h-4 mr-2" /> {t('editorPanel.addContent.richText')}
                    </Button>
                    <Button onClick={() => addElement('image')} variant="outline">{t('editorPanel.addContent.image')}</Button>
                    <Button onClick={() => addElement('link')} variant="outline">{t('editorPanel.addContent.link')}</Button>
                    <Button onClick={() => addElement('diagram')} variant="outline" className="col-span-2">
                      <DiagramIcon className="w-4 h-4 mr-2" /> {t('editorPanel.addContent.diagram')}
                    </Button>
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
                <h3 className="text-md font-semibold text-gray-700 mb-2">{t('editorPanel.contentElementsTitle')}</h3>
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
        <div className="p-4 border-t border-gray-200">
            <Button
                onClick={() => setIsDeleteConfirmVisible(true)}
                variant="outline"
                className="w-full text-red-600 border-red-300 hover:bg-red-50 focus:ring-red-500"
            >
                <TrashIcon className="w-4 h-4 mr-2" />
                {t('editorPanel.deleteView.button')}
            </Button>
        </div>
    </div>
  );
};

interface ElementEditorProps {
    element: ViewElement;
    onChange: (id: string, content: Partial<ViewElement>) => void;
    onDelete: (id: string) => void;
    allNodes: Node<ViewNodeData>[];
    currentNodeId: string;
}

const ElementEditor: FC<ElementEditorProps> = ({ element, onChange, onDelete, allNodes, currentNodeId }) => {
    const { t } = useTranslation();
    
    const calculateFitHeight = (figures: DiagramFigure[]): number => {
        if (figures.length === 0) {
          return 200;
        }
    
        let maxY = 0;
    
        for (const figure of figures) {
          let figureBottomY;
          const numLines = (figure.label.split('\n')).length;
          const labelHeightAddition = (numLines - 1) * 14.4; // 12px font * 1.2em line height
    
          switch (figure.figureType) {
            case DiagramFigureType.Rectangle:
            case DiagramFigureType.Actor:
              figureBottomY = figure.position.y + 40 + labelHeightAddition;
              break;
            case DiagramFigureType.Circle:
            case DiagramFigureType.Cloud:
              figureBottomY = figure.position.y + 50 + labelHeightAddition;
              break;
            default:
              figureBottomY = figure.position.y;
          }
    
          if (figureBottomY > maxY) {
            maxY = figureBottomY;
          }
        }
    
        const PADDING_BOTTOM = 20;
        const MIN_HEIGHT = 200;
    
        return Math.max(MIN_HEIGHT, Math.ceil(maxY + PADDING_BOTTOM));
    };

    const calculateFitViewBox = (figures: DiagramFigure[]): [number, number, number, number] => {
        const svgWidth = 800;
        const svgHeight = 400;

        if (figures.length === 0) {
            return [0, 0, svgWidth, svgHeight];
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        figures.forEach(figure => {
            const numLines = (figure.label.split('\n')).length;
            const labelHeight = (numLines > 1) ? (numLines - 1) * 14.4 : 0;
            const labelClearance = 15;

            let bounds;
            switch (figure.figureType) {
                case DiagramFigureType.Rectangle:
                    bounds = { left: figure.position.x - 50, right: figure.position.x + 50, top: figure.position.y - 25, bottom: figure.position.y + 25 + labelClearance + labelHeight };
                    break;
                case DiagramFigureType.Circle:
                    bounds = { left: figure.position.x - 35, right: figure.position.x + 35, top: figure.position.y - 35, bottom: figure.position.y + 35 + labelClearance + labelHeight };
                    break;
                case DiagramFigureType.Cloud:
                    bounds = { left: figure.position.x - 75, right: figure.position.x + 75, top: figure.position.y - 30, bottom: figure.position.y + 15 + labelClearance + labelHeight };
                    break;
                case DiagramFigureType.Actor:
                    bounds = { left: figure.position.x - 20, right: figure.position.x + 20, top: figure.position.y - 35, bottom: figure.position.y + 25 + labelClearance + labelHeight };
                    break;
            }
            if (bounds) {
                minX = Math.min(minX, bounds.left);
                maxX = Math.max(maxX, bounds.right);
                minY = Math.min(minY, bounds.top);
                maxY = Math.max(maxY, bounds.bottom);
            }
        });

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        if (contentWidth <= 0 || contentHeight <= 0) {
            return [0, 0, svgWidth, svgHeight];
        }
        
        const PADDING = 40;
        const newVbX = minX - PADDING;
        const newVbY = minY - PADDING;
        const newVbWidth = contentWidth + PADDING * 2;
        const newVbHeight = contentHeight + PADDING * 2;

        return [newVbX, newVbY, newVbWidth, newVbHeight];
    };

    const handleDiagramZoom = (factor: number) => {
        if (element.type !== 'diagram') return;
        const svgWidth = 800;
        const svgHeight = 400;
        const currentVb = element.viewBox ?? [0, 0, svgWidth, svgHeight];
        
        const [vx, vy, vw, vh] = currentVb;
        const newWidth = vw * factor;
        const newHeight = vh * factor;
        const newX = vx + (vw - newWidth) / 2;
        const newY = vy + (vh - newHeight) / 2;
        onChange(element.id, { viewBox: [newX, newY, newWidth, newHeight] });
    };
    
    const handleExportToDrawIo = () => {
        if (element.type !== 'diagram') return;

        const { figures, arrows } = element.diagramState;
        const caption = element.caption;

        const escapeXml = (str: string) => {
            return str.replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;')
                      .replace(/'/g, '&apos;');
        };

        const formatNumberForDrawIo = (num: number | string): string => {
            const number = Number(num);
            if (isNaN(number)) return String(num);

            if (Math.abs(number) >= 1_000_000) {
                // Scientific notation for large numbers
                if (number === 0) return "0.0";
                const exponent = Math.floor(Math.log10(Math.abs(number)));
                const absNumber = Math.abs(number);
                const sign = number < 0 ? '-' : '';
                const mantissa = absNumber / Math.pow(10, exponent);
                if (mantissa < 1.5) return `${sign}10<sup>${exponent}</sup>`;
                
                let roundedMantissaStr = mantissa.toFixed(1);
                let finalExponent = exponent;
                if (roundedMantissaStr === '10.0') {
                    roundedMantissaStr = '1.0';
                    finalExponent += 1;
                }
                return `${sign}${roundedMantissaStr} &times; 10<sup>${finalExponent}</sup>`;
            } else {
                // Format with thousands separator for smaller numbers, using a locale that provides spaces.
                return number.toLocaleString('sv-SE');
            }
        };

        const dataTableToMxCell = (
            el: DiagramFigure | DiagramArrow,
            geom: { x: number; y: number },
            elementType: DiagramFigureType | 'arrow'
        ): string | null => {
            if (!el.showData || !el.data) return null;

            const rows = Object.entries(diagramParameterDefs)
                .map(([key, def]) => {
                    if (!def.appliesTo.includes(elementType)) return null;
                    const value = el.data![key];
                    if (value === undefined || value === '') return null;
                    return { key, def, value };
                })
                .filter((row): row is { key: string; def: any; value: string | number } => row !== null);

            if (rows.length === 0) return null;

            const rowsHtml = rows.map(row => `
                <div style="white-space: nowrap;">
                    <span style="font-weight: bold;">${escapeXml(row.def.abbr)}:</span>
                    <span style="margin-left: 4px;">${formatNumberForDrawIo(row.value)}</span>
                    <span style="margin-left: 4px; color: #6b7280;">${escapeXml(row.def.unit)}</span>
                </div>
            `).join('');

            const cellWidth = 250;
            const cellHeight = rows.length * 18 + 8;

            const tableHtml = `<div style="width: ${cellWidth}px; height: ${cellHeight}px; display: flex; justify-content: center; align-items: center;">
                <div style="font-family: sans-serif; font-size: 12px; background-color: rgba(255, 255, 255, 0.8); border-radius: 4px; padding: 4px; display: inline-block;">
                    ${rowsHtml}
                </div>
            </div>`;

            const dataCellId = `${el.id}-data`;
            const style = 'html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;';

            return `        <mxCell id="${dataCellId}" value="${escapeXml(tableHtml)}" style="${style}" vertex="1" parent="1">
          <mxGeometry x="${geom.x}" y="${geom.y}" width="${cellWidth}" height="${cellHeight}" as="geometry" />
        </mxCell>`;
        };

        const figureToMxCell = (fig: DiagramFigure): string => {
            let style = 'whiteSpace=wrap;html=1;';
            let geom = { x: 0, y: 0, width: 0, height: 0 };

            switch (fig.figureType) {
                case DiagramFigureType.Rectangle:
                    style += 'shape=rectangle;';
                    geom = { x: fig.position.x - 50, y: fig.position.y - 25, width: 100, height: 50 };
                    break;
                case DiagramFigureType.Circle:
                    style += 'shape=ellipse;perimeter=ellipsePerimeter;';
                    geom = { x: fig.position.x - 35, y: fig.position.y - 35, width: 70, height: 70 };
                    break;
                case DiagramFigureType.Cloud:
                    style += 'shape=cloud;';
                    geom = { x: fig.position.x - 75, y: fig.position.y - 30, width: 150, height: 60 };
                    break;
                case DiagramFigureType.Actor:
                    style += 'shape=actor;';
                    geom = { x: fig.position.x - 20, y: fig.position.y - 35, width: 40, height: 60 };
                    break;
            }

            return `        <mxCell id="${fig.id}" value="${escapeXml(fig.label)}" style="${style}" vertex="1" parent="1">
          <mxGeometry x="${geom.x}" y="${geom.y}" width="${geom.width}" height="${geom.height}" as="geometry" />
        </mxCell>`;
        };
        
        const arrowToMxCell = (arrow: DiagramArrow): string => {
            let style = 'edgeStyle=entityRelationEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;';
            
            const arrowType = arrow.arrowType || ArrowType.OneEnd;
            if (arrowType === ArrowType.None) {
                style += 'startArrow=none;endArrow=none;';
            } else if (arrowType === ArrowType.OneEnd) {
                style += 'startArrow=none;endArrow=classic;';
            } else if (arrowType === ArrowType.OtherEnd) {
                style += 'startArrow=classic;endArrow=none;';
            } else if (arrowType === ArrowType.BothEnds) {
                style += 'startArrow=classic;endArrow=classic;';
            }
            
            return `        <mxCell id="${arrow.id}" value="${escapeXml(arrow.label)}" style="${style}" edge="1" parent="1" source="${arrow.sourceId}" target="${arrow.targetId}">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>`;
        };

        const cells: (string | null)[] = [];
        figures.forEach(fig => {
            cells.push(figureToMxCell(fig));
            const numLines = fig.label.split('\n').length;
            const labelHeightAddition = (numLines - 1) * 14.4;
            let dataYOffset = 0;
            switch (fig.figureType) {
                case DiagramFigureType.Rectangle:
                case DiagramFigureType.Actor: dataYOffset = 45; break;
                case DiagramFigureType.Circle:
                case DiagramFigureType.Cloud: dataYOffset = 55; break;
            }
            const geom = { x: fig.position.x - 125, y: fig.position.y + dataYOffset + labelHeightAddition };
            cells.push(dataTableToMxCell(fig, geom, fig.figureType));
        });
        arrows.forEach(arrow => {
            cells.push(arrowToMxCell(arrow));
            const source = figures.find(f => f.id === arrow.sourceId);
            const target = figures.find(f => f.id === arrow.targetId);
            if (source && target) {
                const midX = (source.position.x + target.position.x) / 2;
                const midY = (source.position.y + target.position.y) / 2;
                const geom = { x: midX - 125, y: midY + 30 };
                cells.push(dataTableToMxCell(arrow, geom, 'arrow'));
            }
        });
        const cellsXml = cells.filter(Boolean).join('\n');

        const xmlContent = `<mxfile host="app.diagrams.net" version="21.0.0" type="device">
  <diagram name="${escapeXml(caption) || 'Page-1'}" id="${uuidv4()}">
    <mxGraphModel dx="1434" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
${cellsXml}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

        const blob = new Blob([xmlContent], { type: 'application/vnd.jgraph.mxfile' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeFilename = caption.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'diagram';
        a.download = `${safeFilename}.drawio`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-3 bg-gray-50 rounded-md border border-gray-200 relative group">
            <button onClick={() => onDelete(element.id)} className="absolute top-1 right-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <TrashIcon className="w-4 h-4" />
            </button>
            {element.type === 'text' && (
                <div>
                    <select
                        value={element.style}
                        onChange={(e) => onChange(element.id, { style: e.target.value as TextStyle })}
                        className="w-full mb-2 p-1 border border-gray-300 rounded-md text-sm"
                    >
                        <option value={TextStyle.Title}>{t('editorPanel.textElement.styleTitle')}</option>
                        <option value={TextStyle.Body}>{t('editorPanel.textElement.styleBody')}</option>
                    </select>
                    {element.style === TextStyle.Title ? (
                        <textarea
                            value={element.content}
                            onChange={(e) => onChange(element.id, { content: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            rows={1}
                        />
                    ) : (
                         <textarea
                            value={element.content}
                            onChange={(e) => onChange(element.id, { content: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                            rows={8}
                            placeholder={t('editorPanel.textElement.bodyPlaceholder')}
                         />
                    )}
                </div>
            )}
            {element.type === 'image' && (
                <div>
                    <img src={element.src} alt={t('editorPanel.imageElement.alt')} className="max-w-full h-auto rounded-md" />
                    <label className="block text-xs font-medium text-gray-500 mt-2 mb-1">{t('editorPanel.imageElement.captionLabel')}</label>
                    <textarea
                        value={element.caption || ''}
                        onChange={(e) => onChange(element.id, { caption: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        rows={2}
                        placeholder={t('editorPanel.imageElement.captionPlaceholder')}
                    />
                </div>
            )}
            {element.type === 'link' && (
                 <div>
                    <input
                        type="text"
                        value={element.content}
                        onChange={(e) => onChange(element.id, { content: e.target.value })}
                        className="w-full mb-2 p-2 border border-gray-300 rounded-md shadow-sm"
                        placeholder={t('editorPanel.linkElement.placeholder')}
                    />
                    <select
                        value={element.targetViewId}
                        onChange={(e) => onChange(element.id, { targetViewId: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                        {allNodes.filter(n => n.id !== currentNodeId).map(n => (
                            <option key={n.id} value={n.id}>{n.data.title || `${t('editorPanel.linkElement.viewOptionPrefix')} ${n.id}`}</option>
                        ))}
                    </select>
                 </div>
            )}
            {element.type === 'richtext' && (
                <div>
                    <p className="text-sm text-gray-600 p-2 bg-indigo-50 rounded-md border border-indigo-200">
                        {t('editorPanel.richTextElement.editHint')}
                    </p>
                </div>
            )}
            {element.type === 'diagram' && (
                 <div>
                    <p className="text-sm text-gray-600 mb-2 p-2 bg-indigo-50 rounded-md border border-indigo-200">
                        {t('editorPanel.diagramElement.editHint')}
                    </p>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('editorPanel.diagramElement.captionLabel')}</label>
                    <textarea
                        value={element.caption}
                        onChange={(e) => onChange(element.id, { caption: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        rows={2}
                        placeholder={t('editorPanel.diagramElement.captionPlaceholder')}
                    />
                    <div className="mt-2 pt-2 border-t border-gray-200">
                        <label className="block text-xs font-medium text-gray-500 mb-2">{t('editorPanel.diagramElement.heightLabel')}</label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                onClick={() => onChange(element.id, { height: Math.max(200, (element.height || 400) - 50) })}
                                variant="outline" size="sm" title={t('editorPanel.diagramElement.decreaseHeight')}
                            >
                                <ArrowUpIcon className="w-4 h-4 m-auto" />
                            </Button>
                            <Button
                                onClick={() => onChange(element.id, { height: calculateFitHeight(element.diagramState.figures) })}
                                variant="outline" size="sm" title={t('editorPanel.diagramElement.fitToContentHeight')}
                            >
                               <ArrowsUpDownIcon className="w-4 h-4 m-auto" />
                            </Button>
                            <Button
                                onClick={() => onChange(element.id, { height: (element.height || 400) + 50 })}
                                variant="outline" size="sm" title={t('editorPanel.diagramElement.increaseHeight')}
                            >
                                
                                <ArrowDownIcon className="w-4 h-4 m-auto" />
                            </Button>
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                        <label className="flex items-center justify-between text-xs font-medium text-gray-500">
                            <span>{t('editorPanel.diagramElement.showAllDataLabel')}</span>
                            <input
                                type="checkbox"
                                checked={element.showAllData ?? false}
                                onChange={(e) => onChange(element.id, { showAllData: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                        </label>
                    </div>
                     <div className="mt-2 pt-2 border-t border-gray-200">
                        <label className="block text-xs font-medium text-gray-500 mb-2">{t('editorPanel.diagramElement.viewLabel')}</label>
                        <div className="grid grid-cols-4 gap-2">
                            <Button onClick={() => handleDiagramZoom(1 / 1.25)} variant="outline" size="sm" title={t('editorPanel.diagramElement.zoomIn')}>
                                <ZoomInIcon className="w-4 h-4 m-auto" />
                            </Button>
                             <Button onClick={() => handleDiagramZoom(1.25)} variant="outline" size="sm" title={t('editorPanel.diagramElement.zoomOut')}>
                                <ZoomOutIcon className="w-4 h-4 m-auto" />
                            </Button>
                            <Button onClick={() => onChange(element.id, { viewBox: calculateFitViewBox(element.diagramState.figures) })} variant="outline" size="sm" title={t('editorPanel.diagramElement.fitToContentView')}>
                                <FitIcon className="w-4 h-4 m-auto" />
                            </Button>
                             <Button onClick={() => onChange(element.id, { viewBox: [0, 0, 800, 400] })} variant="outline" size="sm" title={t('editorPanel.diagramElement.resetView')}>
                                <ResetIcon className="w-4 h-4 m-auto" />
                            </Button>
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                        <label className="block text-xs font-medium text-gray-500 mb-2">{t('editorPanel.diagramElement.exportLabel')}</label>
                        <Button onClick={handleExportToDrawIo} variant="outline" size="sm" className="w-full">
                            <ExportIcon className="w-4 h-4 mr-2" />
                            {t('editorPanel.diagramElement.exportToDrawIo')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};


const CloseIcon: FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const TrashIcon: FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

const DiagramIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.75A2.25 2.25 0 018.25 6h7.5a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5A2.25 2.25 0 016 15.75v-7.5A2.25 2.25 0 016 6V3.75z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12h-7.5" />
  </svg>
);

const RichTextIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12.75L18 15l2.25-2.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 15V9.75" />
    </svg>
);


const ArrowDownIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
  </svg>
);

const ArrowUpIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
  </svg>
);

const ArrowsUpDownIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
  </svg>
);

const ZoomInIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
  </svg>
);

const ZoomOutIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
  </svg>
);

const FitIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m-11.25 11.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25 0h-4.5m4.5 0v-4.5m0 4.5L15 15" />
  </svg>
);

const ResetIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.18-3.185m-11.665-5.156a8.25 8.25 0 0111.665 0l3.18 3.184a8.25 8.25 0 01-11.665 0L2.985 9.644z" />
    </svg>
);

const ExportIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5 4.5V3m0 0L9 6m4.5-3l4.5 3" />
  </svg>
);


export default EditorPanel;