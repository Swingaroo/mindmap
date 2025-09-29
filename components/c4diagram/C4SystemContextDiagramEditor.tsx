import React, { FC, useState, useRef, MouseEvent, SVGProps, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { C4SystemContextDiagramState, C4Person, C4SoftwareSystem, C4Relationship } from '../../types';
import Button from '../ui/Button';
import { TFunction } from '../../i18n';
import Person from './figures/Person';
import SoftwareSystem from './figures/SoftwareSystem';

interface C4EditorProps {
  diagramState: C4SystemContextDiagramState;
  isReadOnly?: boolean;
  onChange: (newState: C4SystemContextDiagramState) => void;
  onDoneEditing?: () => void;
  height?: number;
  viewBox?: [number, number, number, number];
  t: TFunction;
}

// FIX: Define the missing C4_SYSTEM_COLORS constant array.
const C4_SYSTEM_COLORS = [
    '#2563eb', // blue-600
    '#16a34a', // green-600
    '#ca8a04', // yellow-600
    '#dc2626', // red-600
    '#9333ea', // purple-600
    '#ea580c', // orange-600
    '#db2777', // pink-600
    '#475569', // slate-600
];

const ELEMENT_WIDTH = 180;
// Default heights and person geometry constants, used for initial render and connection logic.
const MIN_ELEMENT_HEIGHT = 90;
const MIN_BODY_HEIGHT = 90;
const HEAD_RADIUS = 39.6;
const HEAD_Y_OFFSET = -40.04;
const HEAD_VISIBLE_HEIGHT = Math.abs(HEAD_Y_OFFSET) + HEAD_RADIUS;


const C4SystemContextDiagramEditor: FC<C4EditorProps> = ({ diagramState, isReadOnly = false, onChange, onDoneEditing, height, viewBox, t }) => {
  const [selectedElement, setSelectedElement] = useState<{ type: 'person' | 'system' | 'relationship'; id: string } | null>(null);
  const [connecting, setConnecting] = useState<{ sourceId: string } | null>(null);
  const [placingElementType, setPlacingElementType] = useState<'person' | 'system' | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [elementHeights, setElementHeights] = useState<Record<string, number>>({});
  const svgRef = useRef<SVGSVGElement>(null);

  const [panelPosition, setPanelPosition] = useState({ top: 64, right: 8 });
  const panelDragStartRef = useRef<{ startX: number; startY: number; initialTop: number; initialRight: number } | null>(null);

  const handleHeightChange = useCallback((id: string, newHeight: number) => {
    setElementHeights(prev => {
        if (prev[id] === newHeight) return prev;
        return { ...prev, [id]: newHeight };
    });
  }, []);

  useEffect(() => {
    if (isReadOnly) {
      setPanelPosition({ top: 64, right: 8 });
      setSelectedElement(null);
    }
  }, [isReadOnly]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlacingElementType(null);
        setConnecting(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePanelDragMove = useCallback((e: globalThis.MouseEvent) => {
    if (!panelDragStartRef.current) return;
    const dx = e.clientX - panelDragStartRef.current.startX;
    const dy = e.clientY - panelDragStartRef.current.startY;
    setPanelPosition({
        top: panelDragStartRef.current.initialTop + dy,
        right: panelDragStartRef.current.initialRight - dx,
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
        startX: e.clientX, startY: e.clientY,
        initialTop: panelPosition.top, initialRight: panelPosition.right,
    };
    window.addEventListener('mousemove', handlePanelDragMove);
    window.addEventListener('mouseup', handlePanelDragEnd);
    document.body.style.cursor = 'grabbing';
  };

  useEffect(() => {
    return () => {
        window.removeEventListener('mousemove', handlePanelDragMove);
        window.removeEventListener('mouseup', handlePanelDragEnd);
    };
  }, [handlePanelDragMove, handlePanelDragEnd]);

  const updateState = (updates: Partial<C4SystemContextDiagramState>) => {
    onChange({ ...diagramState, ...updates });
  };

  const getSVGPoint = (e: React.MouseEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    return { x: svgP.x, y: svgP.y };
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (placingElementType) {
      const { x, y } = getSVGPoint(e);
      if (placingElementType === 'person') {
        const newPerson: C4Person = {
          id: uuidv4(),
          label: t('defaults.c4NewPersonLabel'),
          description: t('defaults.c4NewPersonDescription'),
          position: { x, y },
        };
        updateState({ persons: [...diagramState.persons, newPerson] });
      } else if (placingElementType === 'system') {
        const nextColorIndex = diagramState.softwareSystems.length % C4_SYSTEM_COLORS.length;
        const newColor = C4_SYSTEM_COLORS[nextColorIndex];

        const newSystem: C4SoftwareSystem = {
          id: uuidv4(),
          label: t('defaults.c4NewExternalSystemLabel'),
          description: t('defaults.c4NewExternalSystemDescription'),
          isSystemInFocus: false,
          position: { x, y },
          color: newColor,
        };
        updateState({ softwareSystems: [...diagramState.softwareSystems, newSystem] });
      }
      setPlacingElementType(null);
    } else if (e.target === e.currentTarget) {
      // Only deselect if the click target is the SVG background itself
      setSelectedElement(null);
      setConnecting(null);
    }
  };


  const handleElementMouseDown = (e: MouseEvent, element: C4Person | C4SoftwareSystem) => {
    if (isReadOnly || placingElementType) { e.stopPropagation(); return; }
    e.stopPropagation();

    if (connecting) {
      if (connecting.sourceId !== element.id) {
        const newRel: C4Relationship = {
          id: uuidv4(),
          sourceId: connecting.sourceId,
          targetId: element.id,
          label: t('defaults.c4NewRelationshipLabel'),
          technology: t('defaults.c4NewRelationshipTechnology'),
        };
        updateState({ relationships: [...diagramState.relationships, newRel] });
      }
      setConnecting(null);
      return;
    }
    
    const elementType = 'isSystemInFocus' in element ? 'system' : 'person';
    setSelectedElement({ type: elementType, id: element.id });
    const { x, y } = getSVGPoint(e as unknown as React.MouseEvent);
    setDragging({ id: element.id, offsetX: x - element.position.x, offsetY: y - element.position.y });
  };
  
  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (isReadOnly || !dragging) return;
    const { x, y } = getSVGPoint(e as unknown as React.MouseEvent);
    const newPos = { x: x - dragging.offsetX, y: y - dragging.offsetY };
    
    const newPersons = diagramState.persons.map(p => p.id === dragging.id ? { ...p, position: newPos } : p);
    const newSystems = diagramState.softwareSystems.map(s => s.id === dragging.id ? { ...s, position: newPos } : s);
    updateState({ persons: newPersons, softwareSystems: newSystems });
  };
  
  const handleMouseUp = () => setDragging(null);

  const deleteSelected = () => {
    if (!selectedElement) return;
    const { type, id } = selectedElement;

    let newPersons = diagramState.persons;
    let newSystems = diagramState.softwareSystems;

    if (type === 'person') {
      newPersons = diagramState.persons.filter(p => p.id !== id);
    } else if (type === 'system') {
      newSystems = diagramState.softwareSystems.filter(s => s.id !== id);
    } else if (type === 'relationship') {
      updateState({ relationships: diagramState.relationships.filter(r => r.id !== id) });
    }
    
    // Also delete relationships connected to a deleted element
    if (type === 'person' || type === 'system') {
        const newRelationships = diagramState.relationships.filter(r => r.sourceId !== id && r.targetId !== id);
        updateState({
            persons: newPersons,
            softwareSystems: newSystems,
            relationships: newRelationships,
        });
    }

    setSelectedElement(null);
  };
  
  const allElementsMap = useMemo(() => {
    const map = new Map<string, C4Person | C4SoftwareSystem>();
    diagramState.persons.forEach(p => map.set(p.id, p));
    diagramState.softwareSystems.forEach(s => map.set(s.id, s));
    return map;
  }, [diagramState.persons, diagramState.softwareSystems]);

  const selectedItem = selectedElement
    ? selectedElement.type === 'relationship'
      ? diagramState.relationships.find(r => r.id === selectedElement.id)
      : allElementsMap.get(selectedElement.id)
    : null;
    
  const handlePropertyChange = (key: string, value: string | boolean) => {
    if (!selectedItem || !selectedElement) return;
    const { type, id } = selectedElement;
    
    if (type === 'person') {
        const newPersons = diagramState.persons.map(p => p.id === id ? { ...p, [key]: value } : p);
        updateState({ persons: newPersons });
    } else if (type === 'system') {
        const newSystems = diagramState.softwareSystems.map(s => s.id === id ? { ...s, [key]: value } : s);
        updateState({ softwareSystems: newSystems });
    } else if (type === 'relationship') {
        const newRels = diagramState.relationships.map(r => r.id === id ? { ...r, [key]: value } : r);
        updateState({ relationships: newRels });
    }
  };

  const svgCursorClass = placingElementType ? 'cursor-crosshair' : (isReadOnly ? '' : 'cursor-grab active:cursor-grabbing');

  return (
    <div className={`relative border border-gray-200 rounded-md ${!isReadOnly ? 'nodrag' : ''}`}>
      {!isReadOnly && (
        <div className="absolute top-0 left-0 right-0 z-10 p-2 bg-white/90 backdrop-blur-sm border-b rounded-t-md flex flex-wrap gap-2 items-center">
            <Button onClick={() => setPlacingElementType('person')} variant={placingElementType === 'person' ? 'secondary' : 'outline'} size="sm">{t('c4diagramEditor.addPerson')}</Button>
            <Button onClick={() => setPlacingElementType('system')} variant={placingElementType === 'system' ? 'secondary' : 'outline'} size="sm">{t('c4diagramEditor.addSystem')}</Button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <Button onClick={() => setConnecting({ sourceId: selectedElement?.id! })} disabled={!selectedElement || selectedElement.type === 'relationship'} variant={connecting ? 'secondary' : 'outline'} size="sm">
                {connecting ? t('c4diagramEditor.selectTarget') : t('c4diagramEditor.connect')}
            </Button>
            <Button onClick={deleteSelected} disabled={!selectedElement} variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">{t('c4diagramEditor.delete')}</Button>
            <div className="flex-grow" />
            <Button onClick={onDoneEditing} variant="secondary" size="sm"><CheckIcon className="w-4 h-4 mr-1" />{t('c4diagramEditor.done')}</Button>
        </div>
      )}

      {!isReadOnly && selectedItem && (
        <div className="absolute z-10 p-3 bg-white shadow-lg rounded-md border w-64" style={{ top: `${panelPosition.top}px`, right: `${panelPosition.right}px` }}>
            <div className="flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing" onMouseDown={handlePanelDragStart}>
              <h4 className="text-sm font-semibold truncate select-none" title={selectedItem.label}>{t('c4diagramEditor.editPropertiesFor')} "{selectedItem.label}"</h4>
              <GrabHandleIcon className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
            </div>
            <div className="space-y-2">
                <div>
                    <label className="block text-xs font-medium text-gray-500">{t('c4diagramEditor.label')}</label>
                    <input type="text" value={selectedItem.label} onChange={e => handlePropertyChange('label', e.target.value)} className="w-full mt-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                {'description' in selectedItem && (
                  <div>
                      <label className="block text-xs font-medium text-gray-500">{t('c4diagramEditor.description')}</label>
                      <textarea value={selectedItem.description} onChange={e => handlePropertyChange('description', e.target.value)} rows={3} className="w-full mt-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                )}
                {'technology' in selectedItem && (
                  <div>
                      <label className="block text-xs font-medium text-gray-500">{t('c4diagramEditor.technology')}</label>
                      <input type="text" value={selectedItem.technology || ''} onChange={e => handlePropertyChange('technology', e.target.value)} className="w-full mt-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                )}
                {'isSystemInFocus' in selectedItem && (
                  <>
                    <label className="flex items-center justify-between text-xs font-medium text-gray-600 mt-2">
                        <span>{t('c4diagramEditor.isSystemInFocus')}</span>
                        <input type="checkbox" checked={(selectedItem as C4SoftwareSystem).isSystemInFocus} onChange={e => handlePropertyChange('isSystemInFocus', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    </label>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mt-2">{t('c4diagramEditor.color')}</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {C4_SYSTEM_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => handlePropertyChange('color', color)}
                            className={`w-6 h-6 rounded-full border-2 transition-colors ${(selectedItem as C4SoftwareSystem).color === color ? 'border-indigo-600' : 'border-transparent'} hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
            </div>
        </div>
      )}
      
      <svg ref={svgRef} width="100%" height={height || 400} viewBox={viewBox ? viewBox.join(' ') : '0 0 800 400'} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={handleSvgClick} className={svgCursorClass} preserveAspectRatio="xMidYMin meet">
          <defs><marker id="c4-arrowhead" markerWidth="10" markerHeight="7" refX="9.5" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" className="fill-current text-gray-700" /></marker></defs>
          {diagramState.relationships.map(rel => {
              const source = allElementsMap.get(rel.sourceId);
              const target = allElementsMap.get(rel.targetId);
              if (!source || !target) return null;
              
              const getElementMetrics = (element: C4Person | C4SoftwareSystem) => {
                  const isPerson = !('isSystemInFocus' in element);
                  if (isPerson) {
                      const totalHeight = elementHeights[element.id] || MIN_BODY_HEIGHT + HEAD_VISIBLE_HEIGHT;
                      const bodyHeight = totalHeight - HEAD_VISIBLE_HEIGHT;
                      return {
                          center: { x: element.position.x, y: element.position.y + bodyHeight / 2 },
                          width: ELEMENT_WIDTH,
                          height: bodyHeight,
                      };
                  } else {
                      const height = elementHeights[element.id] || MIN_ELEMENT_HEIGHT;
                      return {
                          center: element.position,
                          width: ELEMENT_WIDTH,
                          height: height,
                      };
                  }
              };
              
              const getIntersectionPoint = (rect: {center: {x:number, y:number}, width: number, height: number}, externalPoint: {x:number, y:number}) => {
                  const { center, width, height } = rect;
                  const dx = externalPoint.x - center.x;
                  const dy = externalPoint.y - center.y;
                  
                  const w = width / 2;
                  const h = height / 2;

                  if (dx === 0 && dy === 0) return center;

                  const slope = dy / dx;

                  let x, y;
                  if (Math.abs(dy) * w > Math.abs(dx) * h) {
                      y = center.y + (dy > 0 ? h : -h);
                      x = center.x + (y - center.y) / slope;
                  } else {
                      x = center.x + (dx > 0 ? w : -w);
                      y = center.y + (x - center.x) * slope;
                  }
                  return { x, y };
              };

              const sourceMetrics = getElementMetrics(source);
              const targetMetrics = getElementMetrics(target);
              
              const distSq = (targetMetrics.center.x - sourceMetrics.center.x)**2 + (targetMetrics.center.y - sourceMetrics.center.y)**2;
              if (distSq === 0) return null;

              const startPoint = getIntersectionPoint(sourceMetrics, targetMetrics.center);
              const endPoint = getIntersectionPoint(targetMetrics, sourceMetrics.center);

              const startX = startPoint.x;
              const startY = startPoint.y;
              const endX = endPoint.x;
              const endY = endPoint.y;
              
              const isSelected = selectedElement?.type === 'relationship' && selectedElement.id === rel.id;
              
              return (
                  <g key={rel.id} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); if (!isReadOnly) setSelectedElement({type: 'relationship', id: rel.id}); }}>
                      <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="transparent" strokeWidth="12" />
                      <line x1={startX} y1={startY} x2={endX} y2={endY} strokeWidth="2" markerEnd="url(#c4-arrowhead)" className={isSelected ? 'stroke-indigo-600' : 'stroke-gray-700'} />
                      <foreignObject x={(startX + endX) / 2 - 75} y={(startY + endY) / 2 - 30} width="150" height="60">
                          <div className="text-center">
                              <p className="text-sm font-semibold">{rel.label}</p>
                              <p className="text-xs text-gray-500">{rel.technology || ''}</p>
                          </div>
                      </foreignObject>
                  </g>
              );
          })}
          {diagramState.persons.map(person => (
            <Person
              key={person.id}
              element={person}
              isSelected={!isReadOnly && selectedElement?.id === person.id}
              onMouseDown={handleElementMouseDown}
              onHeightChange={handleHeightChange}
              isReadOnly={isReadOnly}
            />
          ))}
          {diagramState.softwareSystems.map(system => (
            <SoftwareSystem
              key={system.id}
              element={system}
              isSelected={!isReadOnly && selectedElement?.id === system.id}
              onMouseDown={handleElementMouseDown}
              onHeightChange={handleHeightChange}
              isReadOnly={isReadOnly}
            />
          ))}
      </svg>
    </div>
  );
};

const CheckIcon: FC<SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>);
const GrabHandleIcon: FC<SVGProps<SVGSVGElement>> = (props) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>);

export default C4SystemContextDiagramEditor;