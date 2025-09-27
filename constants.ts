import { Node, Edge } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { ViewNodeData, TextStyle } from './types';

const focusFunc = (id: string) => console.log(`Focus on ${id}`);

const node1Id = '1';
const node2Id = '2';

export const initialNodes: Node<ViewNodeData>[] = [
  {
    id: node1Id,
    type: 'viewNode',
    position: { x: 250, y: 5 },
    data: {
      title: 'Welcome to MindMap Presenter!',
      elements: [
        { id: uuidv4(), type: 'text', content: 'This is a Title', style: TextStyle.Title },
        { id: uuidv4(), type: 'text', content: 'This is a body text. You can add more content in the editor panel on the right when a view is selected.', style: TextStyle.Body },
        { id: uuidv4(), type: 'image', src: 'https://picsum.photos/200/100' },
        { id: uuidv4(), type: 'link', content: 'Go to the next view', targetViewId: node2Id },
      ],
      onFocus: focusFunc,
    },
  },
  {
    id: node2Id,
    type: 'viewNode',
    position: { x: 100, y: 400 },
    data: {
      title: 'How it Works',
      elements: [
        { id: uuidv4(), type: 'text', content: '1. Add views with the button in the toolbar.', style: TextStyle.Body },
        { id: uuidv4(), type: 'text', content: '2. Click on a view to select and edit it.', style: TextStyle.Body },
        { id: uuidv4(), type: 'text', content: '3. Drag from the handles to connect views.', style: TextStyle.Body },
        { id: uuidv4(), type: 'text', content: '4. Save and load your work.', style: TextStyle.Body },
      ],
      onFocus: focusFunc,
    },
  },
];

export const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#4f46e5' } }
];