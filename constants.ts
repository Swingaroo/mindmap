import { Node } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { ViewNodeData, TextStyle, DiagramFigureType, ArrowType, ImageElement, ViewElement, DiagramElement, DiagramFigure, DiagramArrow } from './types';
import { TFunction } from './i1n';

export const viewSizeOptions = [
  { label: 'S', width: 512, height: 768 },
  { label: 'M', width: 1024, height: 768 }
];

export const getInitialNodes = (t: TFunction): Node<ViewNodeData>[] => {
  const nodes: Node<ViewNodeData>[] = [];
  const size = viewSizeOptions[1]; // All views are size 'M'

  // Define column layout
  const columnCounts = [12, 7, 10, 5, 9, 7]; // 50 total nodes
  const nodeWidth = size.width;
  const nodeHeight = size.height;
  const horizontalGap = 64;
  const verticalGap = 32;
  const startX = 100;
  const startY = 5;

  const titleTemplates = [
    "Executive Summary - View {{i}}",
    "Deep Dive on Topic {{i}}",
    "Q{{q}} Financials for View {{i}}",
    "A Comprehensive Review of the Strategic Initiatives for Fiscal Year {{fy}} - Focus Area {{i}}",
    "Exploring the Synergistic Potential between Cross-Functional Teams in the Context of Agile Project Management Methodologies: A Case Study from View {{i}}",
    "Key Takeaways: View {{i}}",
    "Appendix {{i}}",
    "Market Analysis - Sector {{i}}",
    "Unpacking the Nuances of Quantum Chromodynamics and Its Unexpected Parallels with 14th-Century Renaissance Art, Specifically Focusing on the Brushstroke Techniques of Early Florentine Masters - An Esoteric Exploration (View {{i}})",
    "Quick Update #{{i}}",
  ];

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

    const template = titleTemplates[(i - 1) % titleTemplates.length];
    const title = template
      .replace('{{i}}', String(i))
      .replace('{{q}}', String((i % 4) + 1))
      .replace('{{fy}}', String(new Date().getFullYear() + Math.floor(i / 10)));
    
    // Calculate position based on column layout
    const nodeIndex = i - 1;
    let cumulativeNodes = 0;
    let targetColumn = -1;
    let nodeIndexInColumn = -1;

    for (let c = 0; c < columnCounts.length; c++) {
      if (nodeIndex < cumulativeNodes + columnCounts[c]) {
        targetColumn = c;
        nodeIndexInColumn = nodeIndex - cumulativeNodes;
        break;
      }
      cumulativeNodes += columnCounts[c];
    }
    
    const xPos = startX + targetColumn * (nodeWidth + horizontalGap);
    const yPos = startY + nodeIndexInColumn * (nodeHeight + verticalGap);

    const newNode: Node<ViewNodeData> = {
      id: `test-node-${i}`,
      type: 'viewNode',
      position: { x: xPos, y: yPos },
      style: { width: `${size.width}px`, height: `${size.height}px` },
      data: {
        title: title,
        elements: elements,
      },
    };

    nodes.push(newNode);
  }

  return nodes;
};