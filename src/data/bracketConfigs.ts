export type BracketNodeType = 'swissGroup' | 'swissResult' | 'playoffsSlot' | 'playoffsHeader';

export interface BracketNode {
  id: string;
  x: number;
  y: number;
  type: BracketNodeType;
  // swiss args
  score?: string;
  count?: number;
  win?: boolean;
  // playoffs args
  title?: string; // for header
  matchIndex?: number; // for playoffs header
  disableDragDrop?: boolean;
  hasDropStub?: boolean;
}

export interface BracketEdge {
  from: string;
  to: string;
  type?: 'swiss' | 'playoffs';
  win?: boolean;
}

export interface BracketConfig {
  width: number;
  height: number;
  nodes: BracketNode[];
  edges: BracketEdge[];
}

export const SWISS_CONFIG: BracketConfig = {
  width: 1400,
  height: 1000,
  nodes: [
    { id: "g00", x: 90, y: 500, type: "swissGroup", score: "0:0", count: 8 },
    { id: "g10", x: 320, y: 310, type: "swissGroup", score: "1:0", count: 4 },
    { id: "g01", x: 320, y: 690, type: "swissGroup", score: "0:1", count: 4 },
    { id: "g20", x: 550, y: 210, type: "swissGroup", score: "2:0", count: 2 },
    { id: "g11", x: 550, y: 500, type: "swissGroup", score: "1:1", count: 4 },
    { id: "g02", x: 550, y: 790, type: "swissGroup", score: "0:2", count: 2 },
    { id: "g30", x: 780, y: 100, type: "swissResult", score: "3:0", count: 2, win: true },
    { id: "g21", x: 780, y: 356, type: "swissGroup", score: "2:1", count: 3 },
    { id: "g12", x: 780, y: 644, type: "swissGroup", score: "1:2", count: 3 },
    { id: "g03", x: 780, y: 900, type: "swissResult", score: "0:3", count: 2, win: false },
    { id: "g31", x: 1010, y: 212, type: "swissResult", score: "3:1", count: 3, win: true },
    { id: "g22", x: 1010, y: 500, type: "swissGroup", score: "2:2", count: 3 },
    { id: "g13", x: 1010, y: 788, type: "swissResult", score: "1:3", count: 3, win: false },
    { id: "g32", x: 1240, y: 356, type: "swissResult", score: "3:2", count: 3, win: true },
    { id: "g23", x: 1240, y: 644, type: "swissResult", score: "2:3", count: 3, win: false },
  ],
  edges: [
    { from: "g00", to: "g10", type: "swiss", win: true },
    { from: "g00", to: "g01", type: "swiss", win: false },
    { from: "g10", to: "g20", type: "swiss", win: true },
    { from: "g10", to: "g11", type: "swiss", win: false },
    { from: "g01", to: "g11", type: "swiss", win: true },
    { from: "g01", to: "g02", type: "swiss", win: false },
    { from: "g20", to: "g30", type: "swiss", win: true },
    { from: "g20", to: "g21", type: "swiss", win: false },
    { from: "g11", to: "g21", type: "swiss", win: true },
    { from: "g11", to: "g12", type: "swiss", win: false },
    { from: "g02", to: "g12", type: "swiss", win: true },
    { from: "g02", to: "g03", type: "swiss", win: false },
    { from: "g21", to: "g31", type: "swiss", win: true },
    { from: "g21", to: "g22", type: "swiss", win: false },
    { from: "g12", to: "g22", type: "swiss", win: true },
    { from: "g12", to: "g13", type: "swiss", win: false },
    { from: "g22", to: "g32", type: "swiss", win: true },
    { from: "g22", to: "g23", type: "swiss", win: false },
  ]
};

export const PLAYOFFS_CONFIG: BracketConfig = {
  width: 1100,
  height: 800,
  nodes: [
    { id: "qf-1", x: 60, y: 120, type: "playoffsSlot", disableDragDrop: true },
    { id: "qf-2", x: 60, y: 170, type: "playoffsSlot", disableDragDrop: true },
    { id: "qf-3", x: 60, y: 270, type: "playoffsSlot", disableDragDrop: true },
    { id: "qf-4", x: 60, y: 320, type: "playoffsSlot", disableDragDrop: true },
    { id: "qf-5", x: 60, y: 470, type: "playoffsSlot", disableDragDrop: true },
    { id: "qf-6", x: 60, y: 520, type: "playoffsSlot", disableDragDrop: true },
    { id: "qf-7", x: 60, y: 620, type: "playoffsSlot", disableDragDrop: true },
    { id: "qf-8", x: 60, y: 670, type: "playoffsSlot", disableDragDrop: true },
    { id: "sf-1", x: 320, y: 145, type: "playoffsSlot" },
    { id: "sf-2", x: 320, y: 295, type: "playoffsSlot" },
    { id: "sf-3", x: 320, y: 495, type: "playoffsSlot" },
    { id: "sf-4", x: 320, y: 645, type: "playoffsSlot" },
    { id: "final-1", x: 580, y: 220, type: "playoffsSlot" },
    { id: "final-2", x: 580, y: 570, type: "playoffsSlot" },
    { id: "champion", x: 840, y: 395, type: "playoffsSlot" },
    
    // Headers
    { id: "header-qf-1", x: 60, y: 96, type: "playoffsHeader", title: "1/4决赛", matchIndex: 0 },
    { id: "header-qf-2", x: 60, y: 246, type: "playoffsHeader", title: "1/4决赛", matchIndex: 1 },
    { id: "header-qf-3", x: 60, y: 446, type: "playoffsHeader", title: "1/4决赛", matchIndex: 2 },
    { id: "header-qf-4", x: 60, y: 596, type: "playoffsHeader", title: "1/4决赛", matchIndex: 3 },
    { id: "header-sf-1", x: 320, y: 121, type: "playoffsHeader", title: "半决赛", matchIndex: 0 },
    { id: "header-sf-2", x: 320, y: 471, type: "playoffsHeader", title: "半决赛", matchIndex: 1 },
    { id: "header-fin", x: 580, y: 196, type: "playoffsHeader", title: "决 赛", matchIndex: 0 },
  ],
  edges: [
    { from: "qf-1", to: "sf-1", type: "playoffs" },
    { from: "qf-2", to: "sf-1", type: "playoffs" },
    { from: "qf-3", to: "sf-2", type: "playoffs" },
    { from: "qf-4", to: "sf-2", type: "playoffs" },
    { from: "qf-5", to: "sf-3", type: "playoffs" },
    { from: "qf-6", to: "sf-3", type: "playoffs" },
    { from: "qf-7", to: "sf-4", type: "playoffs" },
    { from: "qf-8", to: "sf-4", type: "playoffs" },
    { from: "sf-1", to: "final-1", type: "playoffs" },
    { from: "sf-2", to: "final-1", type: "playoffs" },
    { from: "sf-3", to: "final-2", type: "playoffs" },
    { from: "sf-4", to: "final-2", type: "playoffs" },
    { from: "final-1", to: "champion", type: "playoffs" },
    { from: "final-2", to: "champion", type: "playoffs" },
  ]
};
