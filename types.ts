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

export type ViewElement = TextElement | ImageElement | LinkElement;

export interface ViewNodeData {
  title: string;
  elements: ViewElement[];
  onFocus?: (id: string) => void;
  isReadOnly?: boolean;
}

export interface Presentation {
  nodes: Node<ViewNodeData>[];
}