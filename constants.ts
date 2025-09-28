import { Node } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { ViewNodeData, TextStyle, DiagramFigureType, ArrowType, ImageElement, ViewElement, DiagramElement, DiagramFigure, DiagramArrow } from './types';
import { TFunction } from './i18n';

export const viewSizeOptions = [
  { label: 'S', width: 512, height: 768 },
  { label: 'M', width: 1024, height: 768 }
];

export const getInitialNodes = (t: TFunction): Node<ViewNodeData>[] => {
  const nodes: Node<ViewNodeData>[] = [];
  let yPos = 5;
  const size = viewSizeOptions[1]; // All views are size 'M'

  for (let i = 1; i <= 50; i++) {
    let elements: ViewElement[] = [];
    const viewType = (i - 1) % 3;

    switch (viewType) {
      // Case 0: Diagram View
      case 0: {
        const fig1: DiagramFigure = {
          id: uuidv4(),
          figureType: DiagramFigureType.Rectangle,
          position: { x: 150, y: 150 },
          label: t('initialNodes.welcome.diagramFig1_label'),
        };
        const fig2: DiagramFigure = {
          id: uuidv4(),
          figureType: DiagramFigureType.Circle,
          position: { x: 450, y: 150 },
          label: t('initialNodes.welcome.diagramFig2_label'),
        };
        const arrow1: DiagramArrow = {
          id: uuidv4(),
          type: 'arrow',
          sourceId: fig1.id,
          targetId: fig2.id,
          label: t('initialNodes.welcome.diagramArrow1_label'),
          arrowType: ArrowType.OneEnd,
        };

        elements = [
          { id: uuidv4(), type: 'text', content: `This view (No. **${i}**) contains a sample diagram.`, style: TextStyle.Body },
          {
            id: uuidv4(),
            type: 'diagram',
            diagramState: { figures: [fig1, fig2], arrows: [arrow1] },
            caption: `Sample diagram in view ${i}`,
            height: 300,
          } as DiagramElement,
        ];
        break;
      }

      // Case 1: Markdown View
      case 1: {
        const originalMarkdown = t('initialNodes.howItWorks.element1_content');
        const updatedMarkdown = originalMarkdown.replace('# Markdown Samples', `# Markdown Samples (View ${i})`);
        elements = [
          {
            id: uuidv4(),
            type: 'text',
            content: updatedMarkdown,
            style: TextStyle.Body
          },
        ];
        break;
      }

      // Case 2: Image View
      case 2: {
        elements = [
          { id: uuidv4(), type: 'text', content: `This view (No. **${i}**) contains a sample image.`, style: TextStyle.Body },
          {
            id: uuidv4(),
            type: 'image',
            src: t('initialNodes.sampleImage.imageSrc'),
            caption: `Sample image in view ${i}`
          } as ImageElement,
        ];
        break;
      }
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
