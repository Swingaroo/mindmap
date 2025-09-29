import { Node } from 'reactflow';

export enum TextStyle {
  Title = 'title',
  Body = 'body',
}

export interface BaseElement {
  id: string;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  style: TextStyle;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string; // base64 data URL
  caption?: string;
}

export interface LinkElement extends BaseElement {
    type: 'link';
    content: string;
    targetViewId: string;
}

export interface RichTextElement extends BaseElement {
  type: 'richtext';
  content: string; // HTML content
}

// New types for DiagramElement
export enum DiagramFigureType {
  Rectangle = 'rectangle',
  Circle = 'circle',
  Cloud = 'cloud',
  Actor = 'actor',
}

export interface ParameterDef {
  abbr: string;
  caption: string;
  unit: string;
  appliesTo: (DiagramFigureType | 'arrow')[];
}

export interface DiagramParameterDefs {
  [key: string]: ParameterDef;
}

export interface ElementData {
  [key: string]: string | number;
}

export interface DiagramFigure extends BaseElement {
  figureType: DiagramFigureType;
  position: { x: number; y: number };
  label: string;
  data?: ElementData;
  showData?: boolean;
}

export enum ArrowType {
  None = 'none',
  OneEnd = 'one-end', // Arrow at target
  OtherEnd = 'other-end', // Arrow at source
  BothEnds = 'both-ends',
}

export interface DiagramArrow extends BaseElement {
  type: 'arrow';
  sourceId: string;
  targetId: string;
  label: string;
  arrowType?: ArrowType;
  data?: ElementData;
  showData?: boolean;
}

export interface DiagramState {
  figures: DiagramFigure[];
  arrows: DiagramArrow[];
}

export interface DiagramElement extends BaseElement {
  type: 'diagram';
  diagramState: DiagramState;
  caption: string;
  height?: number;
  viewBox?: [number, number, number, number];
  showAllData?: boolean;
}

// New C4 Diagram Types
export enum C4DiagramType {
  SystemContext = 'SystemContext',
  // Container = 'Container',
  // Component = 'Component',
}

export interface C4Person extends BaseElement {
  label: string;
  description: string;
  position: { x: number; y: number };
}

export interface C4SoftwareSystem extends BaseElement {
  label: string;
  description: string;
  isSystemInFocus: boolean;
  position: { x: number; y: number };
  color?: string;
}

export interface C4Relationship extends BaseElement {
  sourceId: string;
  targetId: string;
  label: string;
  technology?: string;
}

export interface C4SystemContextDiagramState {
  persons: C4Person[];
  softwareSystems: C4SoftwareSystem[];
  relationships: C4Relationship[];
}

export interface C4DiagramElement extends BaseElement {
  type: 'c4diagram';
  diagramType: C4DiagramType;
  diagramState: C4SystemContextDiagramState;
  caption: string;
  height?: number;
  viewBox?: [number, number, number, number];
}


export type ViewElement = TextElement | ImageElement | LinkElement | DiagramElement | RichTextElement | C4DiagramElement;

export interface ViewNodeData {
  id?: string;
  title: string;
  viewNumber?: number;
  elements: ViewElement[];
  onFocus?: (id: string) => void;
  isReadOnly?: boolean;
  onNodeDataChange?: (nodeId: string, newData: Partial<ViewNodeData>) => void;
  isHighlighterActive?: boolean;
  onHighlightElement?: (element: HTMLElement | SVGElement) => void;
  printOptions?: {
    fixedDiagramWidth?: number;
  };
  isGlobalDiagramDataVisible?: boolean;
}

export interface Presentation {
  nodes: Node<ViewNodeData>[];
}