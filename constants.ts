import { Node } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { ViewNodeData, TextStyle, DiagramFigureType, ArrowType } from './types';
import { TFunction } from './i18n';

const node1Id = '1';
const node2Id = '2';
const fig1Id = uuidv4();
const fig2Id = uuidv4();

export const viewSizeOptions = [
  { label: 'S', width: 512, height: 768 },
  { label: 'M', width: 1024, height: 768 }
];

export const getInitialNodes = (t: TFunction): Node<ViewNodeData>[] => [
  {
    id: node1Id,
    type: 'viewNode',
    position: { x: 250, y: 5 },
    style: { width: `${viewSizeOptions[1].width}px`, height: `${viewSizeOptions[1].height}px` },
    data: {
      title: t('initialNodes.welcome.title'),
      elements: [
        { id: uuidv4(), type: 'text', content: t('initialNodes.welcome.element1_content'), style: TextStyle.Title },
        { id: uuidv4(), type: 'text', content: t('initialNodes.welcome.element2_content'), style: TextStyle.Body },
        { id: uuidv4(), type: 'image', src: 'https://picsum.photos/200/100' },
        { 
          id: uuidv4(), 
          type: 'diagram', 
          caption: t('initialNodes.welcome.element4_caption'),
          diagramState: {
            figures: [
              { id: fig1Id, figureType: DiagramFigureType.Rectangle, position: { x: 150, y: 100 }, label: t('initialNodes.welcome.diagramFig1_label') },
              { id: fig2Id, figureType: DiagramFigureType.Circle, position: { x: 400, y: 250 }, label: t('initialNodes.welcome.diagramFig2_label') },
            ],
            arrows: [
              { id: uuidv4(), type: 'arrow', sourceId: fig1Id, targetId: fig2Id, label: t('initialNodes.welcome.diagramArrow1_label'), arrowType: ArrowType.OneEnd }
            ]
          }
        },
        { id: uuidv4(), type: 'link', content: t('initialNodes.welcome.element5_content'), targetViewId: node2Id },
      ],
    },
  },
  {
    id: node2Id,
    type: 'viewNode',
    position: { x: 100, y: 400 },
    style: { width: `${viewSizeOptions[1].width}px`, height: `${viewSizeOptions[1].height}px` },
    data: {
      title: t('initialNodes.howItWorks.title'),
      elements: [
        { id: uuidv4(), type: 'text', content: t('initialNodes.howItWorks.element1_content'), style: TextStyle.Body },
      ],
    },
  },
];