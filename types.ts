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

export interface DiagramArrow extends BaseElement {
  type: 'arrow';
  sourceId: string;
  targetId: string;
  label: string;
}

export interface DiagramState {
  figures: DiagramFigure[];
  arrows: DiagramArrow[];
}

export interface DiagramElement extends BaseElement {
  type: 'diagram';
  diagramState: DiagramState;
  caption: string;
}


export type ViewElement = TextElement | ImageElement | LinkElement | DiagramElement;

export interface ViewNodeData {
  id?: string;
  title: string;
  elements: ViewElement[];
  onFocus?: (id: string) => void;
  isReadOnly?: boolean;
  onNodeDataChange?: (nodeId: string, newData: Partial<ViewNodeData>) => void;
}

export interface Presentation {
  nodes: Node<ViewNodeData>[];
}