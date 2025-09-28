import { Node } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { ViewNodeData, TextStyle, DiagramFigureType, ArrowType, ImageElement, ViewElement, DiagramElement, DiagramFigure, DiagramArrow, DiagramParameterDefs } from './types';
import { TFunction } from './i18n';

export const viewSizeOptions = [
  { label: 'S', width: 512, height: 768 },
  { label: 'M', width: 1024, height: 768 }
];

export const diagramParameterDefs: DiagramParameterDefs = {
  rps: {
    abbr: "RPS",
    caption: "Requests per second",
    unit: "",
    appliesTo: [
      DiagramFigureType.Rectangle,
      DiagramFigureType.Circle,
      DiagramFigureType.Cloud,
      DiagramFigureType.Actor
    ]
  },
  traffic: {
    abbr: "Traffic",
    caption: "Traffic",
    unit: "GBps",
    appliesTo: ['arrow']
  },
  dau: {
    abbr: "DAU",
    caption: "Daily active users",
    unit: "",
    appliesTo: [DiagramFigureType.Actor]
  }
};

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
        let diagramFigures: DiagramFigure[];
        let diagramArrows: DiagramArrow[];
        let diagramCaption: string;
        let diagramHeight: number;
        let diagramViewBox: [number, number, number, number] | undefined;
        let textContent: string;

        if (i === 1) {
          textContent = t('initialNodes.welcome.element2_content_diagram');
          diagramCaption = t('initialNodes.welcome.diagram_caption');
          diagramHeight = 650;

          const users: DiagramFigure = { id: uuidv4(), figureType: DiagramFigureType.Actor, position: { x: 30, y: 300 }, label: "Users", data: { dau: 2000000 }, showData: true };
          const internet: DiagramFigure = { id: uuidv4(), figureType: DiagramFigureType.Cloud, position: { x: 163, y: 301 }, label: "Internet" };
          const lb: DiagramFigure = { id: uuidv4(), figureType: DiagramFigureType.Rectangle, position: { x: 400, y: 300 }, label: "Load Balancer\n(nginx)", data: { rps: 50000 }, showData: true };
          const web1: DiagramFigure = { id: uuidv4(), figureType: DiagramFigureType.Rectangle, position: { x: 549, y: 200 }, label: "Web Server 1\n(Node.js)", data: { rps: 25000 }, showData: true };
          const web2: DiagramFigure = { id: uuidv4(), figureType: DiagramFigureType.Rectangle, position: { x: 550, y: 400 }, label: "Web Server 2\n(Node.js)", data: { rps: 25000 }, showData: true };
          const cache: DiagramFigure = { id: uuidv4(), figureType: DiagramFigureType.Circle, position: { x: 767, y: 227 }, label: "Cache\n(Redis)" };
          const db: DiagramFigure = { id: uuidv4(), figureType: DiagramFigureType.Circle, position: { x: 764, y: 353 }, label: "Database\n(Postgres)", data: { rps: 100000 }, showData: true };

          diagramFigures = [users, internet, lb, web1, web2, cache, db];
          
          diagramArrows = [
            { id: uuidv4(), type: 'arrow', sourceId: users.id, targetId: internet.id, label: "", arrowType: ArrowType.OneEnd },
            { id: uuidv4(), type: 'arrow', sourceId: internet.id, targetId: lb.id, label: "", arrowType: ArrowType.OneEnd, data: { traffic: 500 }, showData: true },
            { id: uuidv4(), type: 'arrow', sourceId: lb.id, targetId: web1.id, label: "", arrowType: ArrowType.OneEnd },
            { id: uuidv4(), type: 'arrow', sourceId: lb.id, targetId: web2.id, label: "", arrowType: ArrowType.OneEnd },
            { id: uuidv4(), type: 'arrow', sourceId: web1.id, targetId: cache.id, label: "read/write", arrowType: ArrowType.BothEnds },
            { id: uuidv4(), type: 'arrow', sourceId: web1.id, targetId: db.id, label: "read/write", arrowType: ArrowType.BothEnds },
            { id: uuidv4(), type: 'arrow', sourceId: web2.id, targetId: cache.id, label: "read/write", arrowType: ArrowType.BothEnds },
            { id: uuidv4(), type: 'arrow', sourceId: web2.id, targetId: db.id, label: "read/write", arrowType: ArrowType.BothEnds },
          ];

          diagramViewBox = [-30.140296936035156, 135, 872.6170425415039, 359.4];
          
        } else {
          textContent = `This view (No. **${i}**) contains a sample diagram.`;
          diagramCaption = `Sample diagram in view ${i}`;
          diagramHeight = 300;
          diagramViewBox = undefined;

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

          diagramFigures = [fig1, fig2];
          diagramArrows = [arrow1];
        }

        elements = [
          { id: uuidv4(), type: 'text', content: textContent, style: TextStyle.Body },
          {
            id: uuidv4(),
            type: 'diagram',
            diagramState: { figures: diagramFigures, arrows: diagramArrows },
            caption: diagramCaption,
            height: diagramHeight,
            viewBox: diagramViewBox,
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