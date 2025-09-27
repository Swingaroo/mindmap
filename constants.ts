import { Node } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { ViewNodeData, TextStyle, DiagramFigureType } from './types';

const node1Id = '1';
const node2Id = '2';
const fig1Id = uuidv4();
const fig2Id = uuidv4();

export const viewSizeOptions = [
  { label: 'S', width: 512, height: 768 },
  { label: 'M', width: 1024, height: 768 }
];

export const initialNodes: Node<ViewNodeData>[] = [
  {
    id: node1Id,
    type: 'viewNode',
    position: { x: 250, y: 5 },
    // FIX: Corrected typo from `viewSizptions` to `viewSizeOptions`.
    style: { width: `${viewSizeOptions[1].width}px`, height: `${viewSizeOptions[1].height}px` },
    data: {
      title: 'Welcome to MindMap Presenter!',
      elements: [
        { id: uuidv4(), type: 'text', content: 'This is a Title', style: TextStyle.Title },
        { id: uuidv4(), type: 'text', content: 'This is a **body text**. You can add more content in the *editor panel* on the right when a view is selected.', style: TextStyle.Body },
        { id: uuidv4(), type: 'image', src: 'https://picsum.photos/200/100' },
        { 
          id: uuidv4(), 
          type: 'diagram', 
          diagramState: {
            figures: [
              { id: fig1Id, figureType: DiagramFigureType.Rectangle, position: { x: 150, y: 100 }, label: 'Start Here' },
              { id: fig2Id, figureType: DiagramFigureType.Circle, position: { x: 400, y: 250 }, label: 'Go Next' },
            ],
            arrows: [
              { id: uuidv4(), type: 'arrow', sourceId: fig1Id, targetId: fig2Id, label: 'Connector' }
            ]
          }
        },
        { id: uuidv4(), type: 'link', content: 'Go to the next view', targetViewId: node2Id },
      ],
    },
  },
  {
    id: node2Id,
    type: 'viewNode',
    position: { x: 100, y: 400 },
    style: { width: `${viewSizeOptions[1].width}px`, height: `${viewSizeOptions[1].height}px` },
    data: {
      title: 'How it Works',
      elements: [
        { id: uuidv4(), type: 'text', content: '* Add views with the button in the toolbar.\n* Click on a view to select and edit it.\n* Use links to navigate between views.\n* Save and load your work.', style: TextStyle.Body },
      ],
    },
  },
];