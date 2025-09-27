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
}

export interface LinkElement extends BaseElement {
    type: 'link';
    content: string;
    targetViewId: string;
}

// New types for DiagramElement
export enum DiagramFigureType {
  Rectangle = 'rectangle',
  Circle = 'circle',
  Cloud = 'cloud',
  Actor = 'actor',
}

export interface DiagramFigure extends BaseElement {
  figureType: DiagramFigureType;
  position: { x: number; y: number };
  label: string;
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
}


export type ViewElement = TextElement | ImageElement | LinkElement | DiagramElement;

export interface ViewNodeData {
  id?: string;
  title: string;
  elements: ViewElement[];
  onFocus?: (id: string) => void;
  isReadOnly?: boolean;
  onNodeDataChange?: (nodeId: string, newData: Partial<ViewNodeData>) => void;
  isHighlighterActive?: boolean;
  onHighlightElement?: (element: HTMLElement | SVGElement) => void;
}

export interface Presentation {
  nodes: Node<ViewNodeData>[];
}