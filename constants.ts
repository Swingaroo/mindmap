import { DiagramFigureType, DiagramParameterDefs } from './types';

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
