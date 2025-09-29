import React, { FC, useState, useRef, MouseEvent, SVGProps, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DiagramState, DiagramFigure, DiagramArrow, DiagramFigureType, ArrowType } from '../../types';
import { FigureComponents, DataDisplay } from './figures';
import Button from '../ui/Button';
import { TFunction } from '../../i18n';
import { diagramParameterDefs } from '../../constants';

interface DiagramEditorProps {
  diagramState: DiagramState;
  isReadOnly?: boolean;
  onChange: (newState: DiagramState) => void;
  onDoneEditing?: () => void;
  height?: number;
  viewBox?: [number, number, number, number];
  isHighlighterActive?: boolean;
  onHighlightElement?: (element: HTMLElement | SVGElement) => void;
  t: TFunction;
  fixedWidth?: number;
  showAllData?: boolean;
}

const figureRadii: Record<DiagramFigureType, number> = {
  [DiagramFigureType.Rectangle]: 56,
  [DiagramFigureType.Circle]: 35,
  [DiagramFigureType.Cloud]: 75,
  [DiagramFigureType.Actor]: 41,
};

const DiagramEditor: FC<DiagramEditorProps> = ({ diagramState, isReadOnly = false, onChange, onDoneEditing, height, viewBox, isHighlighterActive, onHighlightElement, t, fixedWidth, showAllData }) => {
  const [selectedElement, setSelectedElement] = useState<{ type: 'figure' | 'arrow'; id: string } | null>(null);
  const [connecting, setConnecting] = useState<{ sourceId: string } | null>(null);
  const [placingFigureType, setPlacingFigureType] = useState<DiagramFigureType | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [editingLabel, setEditingLabel] = useState<{ id: string; type: 'figure' | 'arrow' } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [panelPosition, setPanelPosition] = useState({ top: 64, right: 8 });
  const panelDragStartRef = useRef<{ startX: number; startY: number; initialTop: number; initialRight: number } | null>(null);

  // Reset panel position and selection only when exiting edit mode
  useEffect(() => {
    if (isReadOnly) {
      setPanelPosition({ top: 64, right: 8 });
      setSelectedElement(null);
    }
  }, [isReadOnly]);

  // Add Escape key handler to cancel placing or connecting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlacingFigureType(null);
        setConnecting(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  const handlePanelDragMove = useCallback((e: globalThis.MouseEvent) => {
    if (!panelDragStartRef.current) return;
    
    const dx = e.clientX - panelDragStartRef.current.startX;
    const dy = e.clientY - panelDragStartRef.current.startY;

    setPanelPosition({
        top: panelDragStartRef.current.initialTop + dy,
        right: panelDragStartRef.current.initialRight - dx, // right is inverse of x
    });
  }, []);

  const handlePanelDragEnd = useCallback(() => {
    panelDragStartRef.current = null;
    window.removeEventListener('mousemove', handlePanelDragMove);
    window.removeEventListener('mouseup', handlePanelDragEnd);
    document.body.style.cursor = '';
  }, [handlePanelDragMove]);

  const handlePanelDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    panelDragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialTop: panelPosition.top,
        initialRight: panelPosition.right,
    };
    
    window.addEventListener('mousemove', handlePanelDragMove);
    window.addEventListener('mouseup', handlePanelDragEnd);
    document.body.style.cursor = 'grabbing';
  };

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
        window.removeEventListener('mousemove', handlePanelDragMove);
        window.removeEventListener('mouseup', handlePanelDragEnd);
    };
  }, [handlePanelDragMove, handlePanelDragEnd]);

  const updateState = (updates: Partial<DiagramState>) => {
    onChange({ ...diagramState, ...updates });
  };

  const handleSetPlacingFigure = (figureType: DiagramFigureType) => {
    setPlacingFigureType(prev => (prev === figureType ? null : figureType));
    setConnecting(null); // Cancel connecting mode
  };

  const deleteSelected = () => {
    if (!selectedElement) return;
    if (selectedElement.type === 'figure') {
      const newFigures = diagramState.figures.filter(f => f.id !== selectedElement.id);
      const newArrows = diagramState.arrows.filter(a => a.sourceId !== selectedElement.id && a.targetId !== selectedElement.id);
      updateState({ figures: newFigures, arrows: newArrows });
    } else {
      const newArrows = diagramState.arrows.filter(a => a.id !== selectedElement.id);
      updateState({ arrows: newArrows });
    }
    setSelectedElement(null);
  };

  const handleDoubleClick = (id: string, type: 'figure' | 'arrow') => {
    if (isReadOnly) return;
    setEditingLabel({ id, type });
  };

  const handleMouseDown = (e: MouseEvent<SVGGElement>, figure: DiagramFigure) => {
    if (placingFigureType) {
        e.stopPropagation();
        return;
    }
    if (isReadOnly || editingLabel || isHighlighterActive) return;
    e.stopPropagation();

    if (connecting) {
      if (connecting.sourceId !== figure.id) {
        const newArrow: DiagramArrow = {
          id: uuidv4(),
          type: 'arrow',
          sourceId: connecting.sourceId,
          targetId: figure.id,
          label: t('diagramEditor.newConnection'),
          arrowType: ArrowType.OneEnd,
        };
        updateState({ arrows: [...diagramState.arrows, newArrow] });
      }
      setConnecting(null);
      return;
    }

    setSelectedElement({ type: 'figure', id: figure.id });
    const pt = svgRef.current?.createSVGPoint();
    pt!.x = e.clientX;
    pt!.y = e.clientY;
    const svgP = pt!.matrixTransform(svgRef.current?.getScreenCTM()?.inverse());
    setDragging({
      id: figure.id,
      offsetX: svgP.x - figure.position.x,
      offsetY: svgP.y - figure.position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (isReadOnly || !dragging) return;
    const pt = svgRef.current?.createSVGPoint();
    pt!.x = e.clientX;
    pt!.y = e.clientY;
    const svgP = pt!.matrixTransform(svgRef.current?.getScreenCTM()?.inverse());

    const newFigures = diagramState.figures.map(f =>
      f.id === dragging.id
        ? { ...f, position: { x: svgP.x - dragging.offsetX, y: svgP.y - dragging.offsetY } }
        : f
    );
    updateState({ figures: newFigures });
  };
  
  const handleMouseUp = () => {
    if (isReadOnly) return;
    setDragging(null);
  };
  
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isHighlighterActive) return;

    if (placingFigureType) {
      if (!svgRef.current) return;
      const pt = svgRef.current.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());

      const newFigure: DiagramFigure = {
        id: uuidv4(),
        figureType: placingFigureType,
        position: { x: Math.round(svgP.x), y: Math.round(svgP.y) },
        label: t('diagramEditor.newFigure'),
      };
      updateState({ figures: [...diagramState.figures, newFigure] });

      setPlacingFigureType(null);
    } else {
      setSelectedElement(null);
      setConnecting(null);
    }
  };
  
  // FIX: Add explicit type to `figureMap` to ensure `get` method returns a typed value (`DiagramFigure | undefined`)
  // instead of `unknown`, resolving multiple downstream type errors.
  const figureMap: Map<string, DiagramFigure> = new Map(diagramState.figures.map(f => [f.id, f]));
  
  const selectedArrow = selectedElement?.type === 'arrow'
    ? diagramState.arrows.find(a => a.id === selectedElement.id)
    : null;
    
  const selectedFigure = selectedElement?.type === 'figure'
    ? diagramState.figures.find(f => f.id === selectedElement.id)
    : null;
    
  const selectedElementForData = selectedFigure || selectedArrow;

  const applicableParams = useMemo(() => {
    if (!selectedElementForData) return [];

    // The type guard checks for a property unique to DiagramArrow.
    const elementType = 'sourceId' in selectedElementForData 
        ? 'arrow' 
        : selectedElementForData.figureType;
    
    return Object.entries(diagramParameterDefs).filter(([, def]) => {
        return def.appliesTo.includes(elementType);
    });
  }, [selectedElementForData]);

  const handleDataChange = (paramKey: string, value: string) => {
      if (!selectedElementForData) return;

      const updatedData = { ...selectedElementForData.data, [paramKey]: value };

      // FIX: Use a type guard to check for a property unique to DiagramArrow ('sourceId')
      // because DiagramFigure does not have a 'type' property.
      if ('sourceId' in selectedElementForData) {
          const newArrows = diagramState.arrows.map(a => 
              a.id === selectedElementForData.id ? { ...a, data: updatedData } : a
          );
          updateState({ arrows: newArrows });
      } else { // Figure
          const newFigures = diagramState.figures.map(f => 
              f.id === selectedElementForData.id ? { ...f, data: updatedData } : f
          );
          updateState({ figures: newFigures });
      }
  };
  
  const handleShowDataToggle = (show: boolean) => {
      if (!selectedElementForData) return;
      
      // FIX: Use a type guard to check for a property unique to DiagramArrow ('sourceId')
      // because DiagramFigure does not have a 'type' property.
      if ('sourceId' in selectedElementForData) {
          const newArrows = diagramState.arrows.map(a => 
              a.id === selectedElementForData.id ? { ...a, showData: show } : a
          );
          updateState({ arrows: newArrows });
      } else { // Figure
          const newFigures = diagramState.figures.map(f => 
// FIX: Corrected a typo where 'a' was used instead of 'f'. The map parameter is 'f'.
              f.id === selectedElementForData.id ? { ...f, showData: show } : f
          );
          updateState({ figures: newFigures });
      }
  };

  const handleArrowTypeChange = (type: ArrowType) => {
    if (!selectedArrow) return;
    const newArrows = diagramState.arrows.map(a =>
      a.id === selectedArrow.id ? { ...a, arrowType: type } : a
    );
    updateState({ arrows: newArrows });
  };

  const renderLabelEditor = () => {
    if (!editingLabel) return null;

    const handleUpdate = (newValue: string) => {
        if (editingLabel.type === 'figure') {
            const newFigures = diagramState.figures.map(f => f.id === editingLabel.id ? { ...f, label: newValue } : f);
            updateState({ figures: newFigures });
        } else {
            const newArrows = diagramState.arrows.map(a => a.id === editingLabel.id ? { ...a, label: newValue } : a);
            updateState({ arrows: newArrows });
        }
        setEditingLabel(null);
    };

    const handleLiveUpdate = (newValue: string) => {
         if (editingLabel.type === 'figure') {
            const newFigures = diagramState.figures.map(f => (f.id === editingLabel.id ? { ...f, label: newValue } : f));
            updateState({ figures: newFigures });
        } else {
            const newArrows = diagramState.arrows.map(a => (a.id === editingLabel.id ? { ...a, label: newValue } : a));
            updateState({ arrows: newArrows });
        }
    };

    let position: { x: number, y: number } | null = null;
    let initialValue = '';
    
    if (editingLabel.type === 'figure') {
        const figure = figureMap.get(editingLabel.id);
        if (!figure) return null;
        initialValue = figure.label;
        let yOffset = 0;
        switch(figure.figureType) {
            case DiagramFigureType.Rectangle: yOffset = 25; break;
            case DiagramFigureType.Circle:    yOffset = 35; break;
            case DiagramFigureType.Cloud:     yOffset = 38; break;
            case DiagramFigureType.Actor:     yOffset = 25; break;
        }
        position = { x: figure.position.x - 60, y: figure.position.y + yOffset };
    } else { // arrow
        const arrow = diagramState.arrows.find(a => a.id === editingLabel.id);
        if (!arrow) return null;
        const source = figureMap.get(arrow.sourceId);
        const target = figureMap.get(arrow.targetId);
        if (!source || !target) return null;
        initialValue = arrow.label;
        const midY = (source.position.y + target.position.y) / 2;
        
        // Calculate the height of the multi-line label to position the textarea correctly
        const lines = arrow.label.split('\n');
        const lineHeight = 14.4; // 1.2em for 12px font
        const yOffset = 10;
        const totalLabelHeight = (lines.length - 1) * lineHeight;

        position = {
            x: (source.position.x + target.position.x) / 2 - 60,
            y: midY - yOffset - totalLabelHeight - 17, // 17 is a magic number for centering
        };
    }
    
    return (
        <foreignObject x={position.x} y={position.y + 2} width="120" height="40">
            <textarea
                value={initialValue}
                onChange={(e) => handleLiveUpdate(e.target.value)}
                onBlur={(e) => handleUpdate(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleUpdate((e.target as HTMLTextAreaElement).value);
                    }
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        (e.target as HTMLTextAreaElement).blur();
                    }
                }}
                className="w-full h-full p-1 text-center text-sm border border-indigo-500 rounded-md resize-none bg-white"
                autoFocus
                onFocus={(e) => e.target.select()}
            />
        </foreignObject>
    );
  };

  const svgCursorClass = useMemo(() => {
    if (placingFigureType) return 'cursor-crosshair';
    if (!isReadOnly && !isHighlighterActive) return 'cursor-grab active:cursor-grabbing';
    return '';
  }, [placingFigureType, isReadOnly, isHighlighterActive]);


  return (
    <div 
        className={`relative border border-gray-200 rounded-md ${!isReadOnly ? 'nodrag' : ''}`}
    >
      {!isReadOnly && (
        <div className="absolute top-0 left-0 right-0 z-10 p-2 bg-white/90 backdrop-blur-sm border-b rounded-t-md flex flex-wrap gap-2 items-center">
            <Button onClick={() => handleSetPlacingFigure(DiagramFigureType.Actor)} variant={placingFigureType === DiagramFigureType.Actor ? 'secondary' : 'outline'} size="sm">{t('diagramEditor.figures.actor')}</Button>            
            <Button onClick={() => handleSetPlacingFigure(DiagramFigureType.Circle)} variant={placingFigureType === DiagramFigureType.Circle ? 'secondary' : 'outline'} size="sm">{t('diagramEditor.figures.circle')}</Button>
            <Button onClick={() => handleSetPlacingFigure(DiagramFigureType.Rectangle)} variant={placingFigureType === DiagramFigureType.Rectangle ? 'secondary' : 'outline'} size="sm">{t('diagramEditor.figures.rectangle')}</Button>
            <Button onClick={() => handleSetPlacingFigure(DiagramFigureType.Cloud)} variant={placingFigureType === DiagramFigureType.Cloud ? 'secondary' : 'outline'} size="sm">{t('diagramEditor.figures.cloud')}</Button>
            
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <Button onClick={() => {
                setConnecting({ sourceId: selectedElement?.id! });
                setPlacingFigureType(null);
            }} disabled={!selectedElement || selectedElement.type !== 'figure'} variant={connecting ? 'secondary' : 'outline'} size="sm">
                {connecting ? t('diagramEditor.selectTarget') : t('diagramEditor.connect')}
            </Button>
            <Button onClick={deleteSelected} disabled={!selectedElement} variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">{t('diagramEditor.delete')}</Button>
            
            {selectedArrow && (() => {
                const activeType = selectedArrow.arrowType || ArrowType.OneEnd;
                return (
                    <>
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        <div className="flex items-center gap-1 rounded-md border border-gray-300 p-0.5">
                            <button title={t('diagramEditor.arrowTypes.none')} onClick={() => handleArrowTypeChange(ArrowType.None)} className={`p-1 rounded-sm ${activeType === ArrowType.None ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                                <ArrowNoneIcon className="w-5 h-5" />
                            </button>
                            <button title={t('diagramEditor.arrowTypes.oneEnd')} onClick={() => handleArrowTypeChange(ArrowType.OneEnd)} className={`p-1 rounded-sm ${activeType === ArrowType.OneEnd ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                                <ArrowEndIcon className="w-5 h-5" />
                            </button>
                            <button title={t('diagramEditor.arrowTypes.otherEnd')} onClick={() => handleArrowTypeChange(ArrowType.OtherEnd)} className={`p-1 rounded-sm ${activeType === ArrowType.OtherEnd ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                                <ArrowStartIcon className="w-5 h-5" />
                            </button>
                            <button title={t('diagramEditor.arrowTypes.bothEnds')} onClick={() => handleArrowTypeChange(ArrowType.BothEnds)} className={`p-1 rounded-sm ${activeType === ArrowType.BothEnds ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                                <ArrowBothIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                );
            })()}

            <div className="flex-grow" />
            <Button onClick={onDoneEditing} variant="secondary" size="sm">
                <CheckIcon className="w-4 h-4 mr-1" />
                {t('diagramEditor.done')}
            </Button>
        </div>
      )}
      {!isReadOnly && selectedElementForData && (
          <div
            className="absolute z-10 p-3 bg-white shadow-lg rounded-md border w-64"
            style={{ top: `${panelPosition.top}px`, right: `${panelPosition.right}px` }}
          >
              <div 
                className="flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing"
                onMouseDown={handlePanelDragStart}
              >
                <h4 className="text-sm font-semibold truncate select-none" title={selectedElementForData.label}>
                    {t('diagramEditor.editDataFor')} "{selectedElementForData.label}"
                </h4>
                <GrabHandleIcon className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
              </div>
              
              <label className="flex items-center justify-between text-xs font-medium text-gray-600 mb-3">
                  <span>{t('diagramEditor.showDataForElement')}</span>
                  <input
                      type="checkbox"
                      checked={selectedElementForData.showData ?? false}
                      onChange={(e) => handleShowDataToggle(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
              </label>

              <div className="space-y-2">
                  {applicableParams.length > 0 ? (
                    applicableParams.map(([key, def]) => (
                        <div key={key}>
                            <label className="block text-xs font-medium text-gray-500" title={def.caption}>
                                {def.abbr} {def.unit && `(${def.unit})`}
                            </label>
                            <input
                                type="text"
                                value={selectedElementForData.data?.[key] || ''}
                                onChange={(e) => handleDataChange(key, e.target.value)}
                                className="w-full mt-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 italic">{t('diagramEditor.noApplicableData')}</p>
                  )}
              </div>
          </div>
      )}
      <svg
        ref={svgRef}
        width={fixedWidth ?? "100%"}
        height={height || 400}
        viewBox={viewBox ? viewBox.join(' ') : '0 0 800 400'}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleSvgClick}
        className={svgCursorClass}
        preserveAspectRatio="xMidYMin meet"
      >
        <defs>
          <marker id="arrowhead-end" markerWidth="10" markerHeight="7" refX="9.5" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" className="fill-current text-gray-600" />
          </marker>
          <marker id="arrowhead-start" markerWidth="10" markerHeight="7" refX="0.5" refY="3.5" orient="auto">
            <polygon points="10 0, 0 3.5, 10 7" className="fill-current text-gray-600" />
          </marker>
        </defs>
        
        {/* Render Arrows */}
        {diagramState.arrows.map(arrow => {
          const source = figureMap.get(arrow.sourceId);
          const target = figureMap.get(arrow.targetId);
          if (!source || !target) return null;
          
          const sx = source.position.x;
          const sy = source.position.y;
          const tx = target.position.x;
          const ty = target.position.y;

          const dx = tx - sx;
          const dy = ty - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist === 0) return null;

          const sourceRadius = figureRadii[source.figureType];
          const targetRadius = figureRadii[target.figureType];

          // Don't render arrow if figures are overlapping
          if (dist <= sourceRadius + targetRadius) {
            return null;
          }

          const startX = sx + (dx * sourceRadius) / dist;
          const startY = sy + (dy * sourceRadius) / dist;
          const endX = tx - (dx * targetRadius) / dist;
          const endY = ty - (dy * targetRadius) / dist;

          const isSelected = !isReadOnly && selectedElement?.type === 'arrow' && selectedElement.id === arrow.id;
          const isEditing = editingLabel?.type === 'arrow' && editingLabel.id === arrow.id;
          const strokeClass = isSelected ? 'stroke-indigo-600' : 'stroke-gray-600';
          
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          
          const arrowType = arrow.arrowType || ArrowType.OneEnd;
          const markerProps: { markerStart?: string, markerEnd?: string } = {};
          if (arrowType === ArrowType.OneEnd || arrowType === ArrowType.BothEnds) {
              markerProps.markerEnd = "url(#arrowhead-end)";
          }
          if (arrowType === ArrowType.OtherEnd || arrowType === ArrowType.BothEnds) {
              markerProps.markerStart = "url(#arrowhead-start)";
          }

          const handleArrowClick = (e: React.MouseEvent<SVGGElement>) => {
              e.stopPropagation();
              if (placingFigureType) return;
              if (isHighlighterActive && onHighlightElement) {
                  onHighlightElement(e.currentTarget);
              } else if (!isReadOnly) {
                  setSelectedElement({ type: 'arrow', id: arrow.id });
              }
          };

          const shouldShowData = isReadOnly ? (arrow.showData === true && !!showAllData) : (arrow.showData === true);

          return (
            <g
              key={arrow.id}
              className="cursor-pointer"
              onClick={handleArrowClick}
              onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(arrow.id, 'arrow'); }}
            >
              {/* A wider, transparent line for easier clicking */}
              <line
                x1={startX} y1={startY}
                x2={endX} y2={endY}
                stroke="transparent"
                strokeWidth="12"
              />
              <line
                x1={startX} y1={startY}
                x2={endX} y2={endY}
                className={strokeClass}
                strokeWidth="2"
                {...markerProps}
              />
              {!isEditing && arrow.label && (() => {
                  const lines = arrow.label.split('\n');
                  const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), '');
                  const charWidth = 7; // Heuristic avg char width
                  const lineHeight = 14.4; // 1.2em for 12px font
                  const padding = 2;
                  const yOffset = 10; // Distance from arrow line to the bottom of the label

                  const boxWidth = longestLine.length * charWidth + padding * 2;
                  const boxHeight = lines.length * lineHeight + padding * 2;
                  const boxX = midX - boxWidth / 2;

                  // Calculate Y position for the first line of text so the entire block is above the arrow
                  const textY = midY - yOffset - (lines.length - 1) * lineHeight;

                  // Position box vertically; text 'y' is baseline of first line, so move up by approx font size
                  const boxY = textY - 12 - padding;

                  return (
                    <g>
                      <rect
                        x={boxX}
                        y={boxY + 2}
                        width={boxWidth}
                        height={boxHeight}
                        fill="white"
                        fillOpacity="0.7"
                        rx="3"
                      />
                      <text
                        x={midX}
                        y={textY + 2}
                        textAnchor="middle"
                        fontSize="12"
                        className="select-none fill-current"
                      >
                        {lines.map((line, i) => (
                          <tspan x={midX} dy={i === 0 ? 0 : '1.2em'} key={i}>{line}</tspan>
                        ))}
                      </text>
                    </g>
                  );
              })()}
              {shouldShowData && arrow.data && (
                  <DataDisplay x={midX} y={midY + 5} data={arrow.data} />
              )}
            </g>
          );
        })}

        {/* Render Figures */}
        {diagramState.figures.map(figure => {
          const FigureComponent = FigureComponents[figure.figureType];
          const isSelected = selectedElement?.type === 'figure' && selectedElement.id === figure.id;
          const isEditing = editingLabel?.type === 'figure' && editingLabel.id === figure.id;
          return (
            <FigureComponent
              key={figure.id}
              x={figure.position.x}
              y={figure.position.y}
              label={figure.label}
              isSelected={isSelected}
              isEditing={isEditing}
              onMouseDown={(e) => handleMouseDown(e, figure)}
              onClick={(e) => {
                e.stopPropagation();
                if (isHighlighterActive && onHighlightElement) {
                    onHighlightElement(e.currentTarget as SVGElement);
                }
              }}
              onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(figure.id, 'figure'); }}
              className={`cursor-pointer ${connecting ? 'cursor-crosshair' : ''}`}
              showData={figure.showData}
              showAllData={showAllData}
              data={figure.data}
              isReadOnly={isReadOnly}
            />
          );
        })}

        {/* Render Label Editor on top */}
        {renderLabelEditor()}
      </svg>
    </div>
  );
};

const CheckIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const ArrowNoneIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const ArrowEndIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const ArrowStartIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const ArrowBothIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const GrabHandleIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="9" cy="12" r="1"></circle>
        <circle cx="9" cy="5" r="1"></circle>
        <circle cx="9" cy="19" r="1"></circle>
        <circle cx="15" cy="12" r="1"></circle>
        <circle cx="15" cy="5" r="1"></circle>
        <circle cx="15" cy="19" r="1"></circle>
    </svg>
);

export default DiagramEditor;