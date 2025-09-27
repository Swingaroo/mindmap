import { Node } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { ViewNodeData, TextStyle, DiagramFigureType, ArrowType, ImageElement, ViewElement } from './types';
import { TFunction } from './i18n';

export const viewSizeOptions = [
  { label: 'S', width: 512, height: 768 },
  { label: 'M', width: 1024, height: 768 }
];

export const getInitialNodes = (t: TFunction): Node<ViewNodeData>[] => {
  const nodes: Node<ViewNodeData>[] = [];
  let yPos = 5;
  
  for (let i = 1; i <= 50; i++) {
    const isMedium = i % 3 !== 0; // Make every 3rd node small
    const size = isMedium ? viewSizeOptions[1] : viewSizeOptions[0];
    
    const elements: ViewElement[] = [
      { id: uuidv4(), type: 'text', content: `This is the content for test view number **${i}**.`, style: TextStyle.Body }
    ];

    if (i % 5 === 0) {
      elements.push({
        id: uuidv4(),
        type: 'image',
        src: t('initialNodes.sampleImage.imageSrc'),
        caption: `Sample image in view ${i}`
      } as ImageElement);
    }
      
    const newNode: Node<ViewNodeData> = {
      id: `test-node-${i}`,
      type: 'viewNode',
      position: { x: 100, y: yPos },
      style: { width: `${size.width}px`, height: `${size.height}px` },
      data: {
        title: `Test View ${i}`,
        elements: elements,
      },
    };

    nodes.push(newNode);
    yPos += size.height + 16; // Add gap
  }
  
  return nodes;
};