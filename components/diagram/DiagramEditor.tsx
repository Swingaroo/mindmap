import React, { FC, useState, useRef, MouseEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DiagramState, DiagramFigure, DiagramArrow, DiagramFigureType } from '../../types';
import { FigureComponents } from './figures';
import Button from '../ui/Button';

interface DiagramEditorProps {
  diagramState: DiagramState;
  isReadOnly?: boolean;
  onChange: (newState: DiagramState) => void;
}

const DiagramEditor: FC<DiagramEditorProps> = ({ diagramState, isReadOnly = false, onChange }) => {
  const [selectedElement, setSelectedElement] = useState<{ type: 'figure' | 'arrow'; id: string } | null>(null);
  const [connecting, setConnecting] = useState<{ sourceId: string } | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [editingLabel, setEditingLabel] = useState<{ id: string; type: 'figure' | 'arrow' } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const updateState = (updates: Partial<DiagramState>) => {
    onChange({ ...diagramState, ...updates });
  };

  const addFigure = (figureType: DiagramFigureType) => {
    const newFigure: DiagramFigure = {
      id: uuidv4(),
      figureType,
      position: { x: 100, y: 100 },
      label: 'New Figure',
    };
    updateState({ figures: [...diagramState.figures, newFigure] });
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
    if (isReadOnly || editingLabel) return;
    e.stopPropagation();

    if (connecting) {
      if (connecting.sourceId !== figure.id) {
        const newArrow: DiagramArrow = {
          id: uuidv4(),
          type: 'arrow',
          sourceId: connecting.sourceId,
          targetId: figure.id,
          label: 'Connection',
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
  
  const handleSvgClick = () => {
      setSelectedElement(null);
      setConnecting(null);
  };
  
  const figureMap = new Map(diagramState.figures.map(f => [f.id, f]));

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
            case DiagramFigureType.Cloud:     yOffset = 10; break;
        }
        position = { x: figure.position.x - 60, y: figure.position.y + yOffset };
    } else { // arrow
        const arrow = diagramState.arrows.find(a => a.id === editingLabel.id);
        if (!arrow) return null;
        const source = figureMap.get(arrow.sourceId);
        const target = figureMap.get(arrow.targetId);
        if (!source || !target) return null;
        initialValue = arrow.label;
        position = {
            x: (source.position.x + target.position.x) / 2 - 60,
            y: (source.position.y + target.position.y) / 2,
        };
    }
    
    return (
        <foreignObject x={position.x} y={position.y} width="120" height="40">
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


  return (
    <div 
        className={`relative border border-gray-200 rounded-md ${!isReadOnly ? 'nodrag' : ''}`}
        style={{ height: '400px' }}
    >
      {!isReadOnly && (
        <div className="absolute top-0 left-0 right-0 z-10 p-2 bg-white/90 backdrop-blur-sm border-b rounded-t-md flex flex-wrap gap-2 items-center">
            <Button onClick={() => addFigure(DiagramFigureType.Rectangle)} variant="outline" size="sm">Rect</Button>
            <Button onClick={() => addFigure(DiagramFigureType.Circle)} variant="outline" size="sm">Circle</Button>
            <Button onClick={() => addFigure(DiagramFigureType.Cloud)} variant="outline" size="sm">Cloud</Button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <Button onClick={() => setConnecting({ sourceId: selectedElement?.id! })} disabled={!selectedElement || selectedElement.type !== 'figure'} variant={connecting ? 'secondary' : 'outline'} size="sm">
                {connecting ? 'Select Target' : 'Connect'}
            </Button>
            <Button onClick={deleteSelected} disabled={!selectedElement} variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">Delete</Button>
        </div>
      )}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 800 400"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleSvgClick}
        className={!isReadOnly ? 'cursor-grab active:cursor-grabbing' : ''}
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9.5" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" className="fill-current text-gray-600" />
          </marker>
        </defs>
        
        {/* Render Arrows */}
        {diagramState.arrows.map(arrow => {
          const source = figureMap.get(arrow.sourceId);
          const target = figureMap.get(arrow.targetId);
          if (!source || !target) return null;
          
          const isSelected = selectedElement?.type === 'arrow' && selectedElement.id === arrow.id;
          const isEditing = editingLabel?.type === 'arrow' && editingLabel.id === arrow.id;
          const strokeClass = isSelected ? 'stroke-indigo-600' : 'stroke-gray-600';

          return (
            <g key={arrow.id}>
              <line
                x1={source.position.x} y1={source.position.y}
                x2={target.position.x} y2={target.position.y}
                className={strokeClass}
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
                onClick={(e) => { e.stopPropagation(); setSelectedElement({type: 'arrow', id: arrow.id}); }}
                onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(arrow.id, 'arrow'); }}
              />
              {!isEditing && (
                <text
                  x={(source.position.x + target.position.x) / 2}
                  y={(source.position.y + target.position.y) / 2 + 15}
                  textAnchor="middle"
                  fontSize="12"
                  className="select-none fill-current cursor-pointer"
                  onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(arrow.id, 'arrow'); }}
                >
                  {arrow.label}
                </text>
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
              onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(figure.id, 'figure'); }}
              className={`cursor-pointer ${connecting ? 'cursor-crosshair' : ''}`}
            />
          );
        })}

        {/* Render Label Editor on top */}
        {renderLabelEditor()}
      </svg>
    </div>
  );
};

export default DiagramEditor;