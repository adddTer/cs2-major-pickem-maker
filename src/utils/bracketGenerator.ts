import { BracketConfig, BracketNode, BracketEdge, BracketNodeType, SWISS_CONFIG } from "../data/bracketConfigs";

export interface BracketGenerationParams {
  type: "single_elim" | "double_elim" | "swiss" | "gsl" | "gauntlet" | "round_robin" | "double_round_robin" | "playoffs";
  teamsCount: number;
  advanceCount: number;
  thirdPlaceMatch?: boolean;
}

export function parseFormatString(formatStr: string): BracketGenerationParams {
  const parts = formatStr.split("_");
  let type = parts[0] + (parts[1] && ["elim", "robin"].includes(parts[1]) ? "_" + parts[1] : "");
  if (parts.length > 2 && parts[0] === "double" && parts[1] === "round" && parts[2] === "robin") {
    type = "double_round_robin";
  }
  if (parts[0] === "playoffs") type = "playoffs";
  
  const typeStrLength = type.split("_").length;
  const teamsCount = parseInt(parts[typeStrLength]) || 4;
  let advanceCount = 1;
  if (!isNaN(parseInt(parts[typeStrLength + 1]))) {
    advanceCount = parseInt(parts[typeStrLength + 1]);
  }
  const thirdPlaceMatch = formatStr.includes("_3rd");

  return { type: type as any, teamsCount, advanceCount, thirdPlaceMatch };
}

export function generateBracketConfig(formatStr: string): BracketConfig {
  const params = parseFormatString(formatStr);
  const { type, teamsCount, advanceCount, thirdPlaceMatch } = params;

  switch (type) {
    case "single_elim":
      return generateSingleElim(teamsCount, thirdPlaceMatch);
    case "gauntlet":
      return generateGauntlet(teamsCount);
    case "gsl":
      return generateGSL(teamsCount);
    case "swiss":
      return generateSwiss(teamsCount);
    case "double_elim":
      return generateDoubleElim(teamsCount, advanceCount);
    case "playoffs":
      if (teamsCount === 6) return generatePlayoffs6();
      return generateSingleElim(teamsCount, thirdPlaceMatch);
    default:
      return generateSingleElim(teamsCount, thirdPlaceMatch);
  }
}

function distributeByes(totalMatches: number, byes: number): boolean[] {
  const isBye = new Array(totalMatches).fill(false);
  if (byes === 0) return isBye;
  
  for(let i=0; i<byes; i++) {
    // Distribute byes evenly to top and bottom halves
    if (i % 2 === 0) {
      isBye[Math.floor(i/2)] = true;
    } else {
      isBye[totalMatches - 1 - Math.floor(i/2)] = true;
    }
  }
  return isBye;
}

function generateSingleElim(teamsCount: number, thirdPlaceMatch: boolean = false): BracketConfig {
  const nodes: BracketNode[] = [];
  const edges: BracketEdge[] = [];
  
  if (teamsCount < 2) return { width: 400, height: 400, nodes, edges };

  const P = Math.pow(2, Math.ceil(Math.log2(teamsCount)));
  const byes = P - teamsCount;
  const rounds = Math.log2(P);
  
  const nodeWidth = 200;
  const nodeHeight = 50;
  const gapX = 60;
  const gapY = 20;

  const matchIsBye = distributeByes(P / 2, byes);

  let offsetX = 60;
  let offsetYBase = 60;

  // We build round by round
  let prevRoundIds: (string | null)[] = [];
  
  for (let r = 0; r < rounds; r++) {
    const isFirstRound = (r === 0);
    const isFinal = (r === rounds - 1);
    
    let currentRoundNodesCount = P / Math.pow(2, r);
    const stepY = (nodeHeight + gapY) * Math.pow(2, r);
    const startY = offsetYBase + (Math.pow(2, r) - 1) * (nodeHeight + gapY) / 2;

    let currentRoundIds: (string | null)[] = [];
    let headerDrawn = false;
    
    for (let i = 0; i < currentRoundNodesCount; i += 2) {
      const y1 = startY + i * stepY;
      const y2 = startY + (i + 1) * stepY;
      
      const id1 = `r${r}-${i}`;
      const id2 = `r${r}-${i+1}`;
      
      let isByeMatch1 = false;
      let isByeMatch2 = false;
      
      if (isFirstRound) {
        isByeMatch1 = matchIsBye[i/2]; 
        // Note: i goes 0, 2, 4... so i/2 is the match index
        // Wait, currentRoundNodesCount is nodes, so matches are i/2.
        // Actually, in round 1, nodes are slots, matches are pairs of slots.
        // So for round 1, match index is i/2.
      }
      
      // A slot should be drawn if:
      // 1. It's the first round and NOT a bye match.
      // 2. It's a later round.
      
      if (isFirstRound) {
        if (matchIsBye[i/2]) {
           currentRoundIds.push(null, null); // completely skip this match
        } else {
           nodes.push({ id: id1, x: offsetX, y: y1, type: "playoffsSlot", disableDragDrop: false });
           nodes.push({ id: id2, x: offsetX, y: y2, type: "playoffsSlot", disableDragDrop: false });
           currentRoundIds.push(id1, id2);
        }
      } else {
        // Round > 0
        // Slot 1: comes from prevRoundIds[i*2] and prevRoundIds[i*2 + 1]
        // If BOTH are null, that means the previous match was a bye.
        // So THIS slot is where the bye team starts!
        let disable1 = true;
        let disable2 = true;
        
        let prevM1_0 = prevRoundIds[i*2];
        let prevM1_1 = prevRoundIds[i*2 + 1];
        if (prevM1_0 === null && prevM1_1 === null) {
           disable1 = false; // Initial drop slot
        }
        
        let prevM2_0 = prevRoundIds[i*2 + 2];
        let prevM2_1 = prevRoundIds[i*2 + 3];
        if (prevM2_0 === null && prevM2_1 === null) {
           disable2 = false; // Initial drop slot
        }
        
        nodes.push({ id: id1, x: offsetX, y: y1, type: "playoffsSlot", disableDragDrop: disable1 });
        nodes.push({ id: id2, x: offsetX, y: y2, type: "playoffsSlot", disableDragDrop: disable2 });
        currentRoundIds.push(id1, id2);
        
        // Connect edges
        if (prevM1_0 !== null) edges.push({ from: prevM1_0, to: id1, type: "playoffs" });
        if (prevM1_1 !== null) edges.push({ from: prevM1_1, to: id1, type: "playoffs" });
        
        if (prevM2_0 !== null) edges.push({ from: prevM2_0, to: id2, type: "playoffs" });
        if (prevM2_1 !== null) edges.push({ from: prevM2_1, to: id2, type: "playoffs" });
      }
      
      let drawMatch = true;
      if (isFirstRound && matchIsBye[i/2]) {
        drawMatch = false;
      }
      
      // Header
      if (drawMatch && !headerDrawn) {
        let title = `第 ${r+1} 轮`;
        if (isFinal) title = "决 赛";
        else if (r === rounds - 2 && rounds >= 2) title = "半决赛";
        else if (r === rounds - 3 && rounds >= 3) title = "1/4决赛";
        
        nodes.push({ id: `header-r${r}`, x: offsetX, y: y1 - 24, type: "playoffsHeader", title, matchIndex: 0 });
        headerDrawn = true;
      }
    }
    prevRoundIds = [...currentRoundIds];
    offsetX += nodeWidth + gapX;
  }
  
  const finalId1 = prevRoundIds[0] as string;
  const finalId2 = prevRoundIds[1] as string;
  const champY = (nodes.find(n => n.id === finalId1)!.y + nodes.find(n => n.id === finalId2)!.y) / 2;
  const champId = "champion";
  
  nodes.push({ id: champId, x: offsetX, y: champY, type: "playoffsSlot", disableDragDrop: true });
  nodes.push({ id: `header-champ`, x: offsetX, y: champY - 24, type: "playoffsHeader", title: "冠军", matchIndex: 0 });
  
  edges.push({ from: finalId1, to: champId, type: "playoffs" });
  edges.push({ from: finalId2, to: champId, type: "playoffs" });
  
  if (thirdPlaceMatch && rounds > 0) {
    const c2Ref = nodes.find(n => n.id === finalId2);
    
    // Position it safely below the bracket
    const thirdMatchY = Math.max(c2Ref!.y + nodeHeight * 3.5, P * (nodeHeight + gapY) * 0.75);
    const t1 = "3rd-1";
    const t2 = "3rd-2";
    const tWin = "3rd-winner";
    
    const thX = offsetX - (nodeWidth + gapX);
    
    nodes.push({ id: t1, x: thX, y: thirdMatchY, type: "playoffsSlot", disableDragDrop: true });
    nodes.push({ id: t2, x: thX, y: thirdMatchY + nodeHeight + gapY, type: "playoffsSlot", disableDragDrop: true });
    nodes.push({ id: tWin, x: offsetX, y: thirdMatchY + (nodeHeight + gapY)/2, type: "playoffsSlot", disableDragDrop: true });
    
    nodes.push({ id: "header-3rd", x: thX, y: thirdMatchY - 24, type: "playoffsHeader", title: "季军赛", matchIndex: 0 });
    
    edges.push({ from: t1, to: tWin, type: "playoffs" });
    edges.push({ from: t2, to: tWin, type: "playoffs" });
  }
  
  return { width: offsetX + nodeWidth + 100, height: Math.max(800, P * (nodeHeight + gapY) + 300), nodes, edges };
}

function generateDoubleElim(teamsCount: number, advanceCount: number = 1): BracketConfig {
  if (teamsCount === 8 && advanceCount === 6) {
    return generateDoubleElim8to6();
  }
  if (teamsCount === 16 && advanceCount === 1) {
    const nodes: BracketNode[] = [];
    const edges: BracketEdge[] = [];
    const w = 200;
    const gapX = 80;
    
    const c1 = 100;
    const c2 = c1 + w + gapX;
    const c3 = c2 + w + gapX;
    const c4 = c3 + w + gapX;
    const c5 = c4 + w + gapX;

    // ----- UPPER BRACKET -----
    nodes.push(
      { id: "ub-r1-1", x: c1, y: 100, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-2", x: c1, y: 160, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-3", x: c1, y: 250, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-4", x: c1, y: 310, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-5", x: c1, y: 400, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-6", x: c1, y: 460, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-7", x: c1, y: 550, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-8", x: c1, y: 610, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-9", x: c1, y: 700, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-10", x: c1, y: 760, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-11", x: c1, y: 850, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-12", x: c1, y: 910, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-13", x: c1, y: 1000, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-14", x: c1, y: 1060, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-15", x: c1, y: 1150, type: "playoffsSlot", disableDragDrop: false },
      { id: "ub-r1-16", x: c1, y: 1210, type: "playoffsSlot", disableDragDrop: false },

      { id: "ub-r2-1", x: c2, y: 175, type: "playoffsSlot", disableDragDrop: true },
      { id: "ub-r2-2", x: c2, y: 235, type: "playoffsSlot", disableDragDrop: true },
      { id: "ub-r2-3", x: c2, y: 475, type: "playoffsSlot", disableDragDrop: true },
      { id: "ub-r2-4", x: c2, y: 535, type: "playoffsSlot", disableDragDrop: true },
      { id: "ub-r2-5", x: c2, y: 775, type: "playoffsSlot", disableDragDrop: true },
      { id: "ub-r2-6", x: c2, y: 835, type: "playoffsSlot", disableDragDrop: true },
      { id: "ub-r2-7", x: c2, y: 1075, type: "playoffsSlot", disableDragDrop: true },
      { id: "ub-r2-8", x: c2, y: 1135, type: "playoffsSlot", disableDragDrop: true },

      { id: "ub-r3-1", x: c3, y: 325, type: "playoffsSlot", disableDragDrop: true },
      { id: "ub-r3-2", x: c3, y: 385, type: "playoffsSlot", disableDragDrop: true },
      { id: "ub-r3-3", x: c3, y: 925, type: "playoffsSlot", disableDragDrop: true },
      { id: "ub-r3-4", x: c3, y: 985, type: "playoffsSlot", disableDragDrop: true },

      { id: "ub-q-1", x: c4, y: 355, type: "playoffsSlot", disableDragDrop: true },
      { id: "ub-q-2", x: c4, y: 955, type: "playoffsSlot", disableDragDrop: true }
    );

    for (let i = 1; i <= 8; i++) {
      edges.push(
        { from: `ub-r1-${i * 2 - 1}`, to: `ub-r2-${i}`, type: "playoffs" },
        { from: `ub-r1-${i * 2}`, to: `ub-r2-${i}`, type: "playoffs" }
      );
    }
    for (let i = 1; i <= 4; i++) {
      edges.push(
        { from: `ub-r2-${i * 2 - 1}`, to: `ub-r3-${i}`, type: "playoffs" },
        { from: `ub-r2-${i * 2}`, to: `ub-r3-${i}`, type: "playoffs" }
      );
    }
    edges.push(
      { from: "ub-r3-1", to: "ub-q-1", type: "playoffs" },
      { from: "ub-r3-2", to: "ub-q-1", type: "playoffs" },
      { from: "ub-r3-3", to: "ub-q-2", type: "playoffs" },
      { from: "ub-r3-4", to: "ub-q-2", type: "playoffs" }
    );

    // ----- LOWER BRACKET -----
    const lbY = 1400;
    nodes.push(
      { id: "lb-r1-1", x: c1, y: lbY, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
      { id: "lb-r1-2", x: c1, y: lbY + 60, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
      { id: "lb-r1-3", x: c1, y: lbY + 150, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
      { id: "lb-r1-4", x: c1, y: lbY + 210, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
      { id: "lb-r1-5", x: c1, y: lbY + 300, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
      { id: "lb-r1-6", x: c1, y: lbY + 360, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
      { id: "lb-r1-7", x: c1, y: lbY + 450, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
      { id: "lb-r1-8", x: c1, y: lbY + 510, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },

      { id: "lb-r2-1", x: c2, y: lbY, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
      { id: "lb-r2-2", x: c2, y: lbY + 60, type: "playoffsSlot", disableDragDrop: true },
      { id: "lb-r2-3", x: c2, y: lbY + 150, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
      { id: "lb-r2-4", x: c2, y: lbY + 210, type: "playoffsSlot", disableDragDrop: true },
      { id: "lb-r2-5", x: c2, y: lbY + 300, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
      { id: "lb-r2-6", x: c2, y: lbY + 360, type: "playoffsSlot", disableDragDrop: true },
      { id: "lb-r2-7", x: c2, y: lbY + 450, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
      { id: "lb-r2-8", x: c2, y: lbY + 510, type: "playoffsSlot", disableDragDrop: true },

      { id: "lb-r3-1", x: c3, y: lbY + 75, type: "playoffsSlot", disableDragDrop: true },
      { id: "lb-r3-2", x: c3, y: lbY + 135, type: "playoffsSlot", disableDragDrop: true },
      { id: "lb-r3-3", x: c3, y: lbY + 375, type: "playoffsSlot", disableDragDrop: true },
      { id: "lb-r3-4", x: c3, y: lbY + 435, type: "playoffsSlot", disableDragDrop: true },

      { id: "lb-r4-1", x: c4, y: lbY + 75, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
      { id: "lb-r4-2", x: c4, y: lbY + 135, type: "playoffsSlot", disableDragDrop: true },
      { id: "lb-r4-3", x: c4, y: lbY + 375, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
      { id: "lb-r4-4", x: c4, y: lbY + 435, type: "playoffsSlot", disableDragDrop: true },

      { id: "lb-q-1", x: c5, y: lbY + 105, type: "playoffsSlot", disableDragDrop: true },
      { id: "lb-q-2", x: c5, y: lbY + 405, type: "playoffsSlot", disableDragDrop: true }
    );

    for (let i = 1; i <= 4; i++) {
      edges.push(
        { from: `lb-r1-${i * 2 - 1}`, to: `lb-r2-${i * 2}`, type: "playoffs" },
        { from: `lb-r1-${i * 2}`, to: `lb-r2-${i * 2}`, type: "playoffs" }
      );
    }
    for (let i = 1; i <= 4; i++) {
      edges.push(
        { from: `lb-r2-${i * 2 - 1}`, to: `lb-r3-${i}`, type: "playoffs" },
        { from: `lb-r2-${i * 2}`, to: `lb-r3-${i}`, type: "playoffs" }
      );
    }
    for (let i = 1; i <= 2; i++) {
      edges.push(
        { from: `lb-r3-${i * 2 - 1}`, to: `lb-r4-${i * 2}`, type: "playoffs" },
        { from: `lb-r3-${i * 2}`, to: `lb-r4-${i * 2}`, type: "playoffs" },
        { from: `lb-r4-${i * 2 - 1}`, to: `lb-q-${i}`, type: "playoffs" },
        { from: `lb-r4-${i * 2}`, to: `lb-q-${i}`, type: "playoffs" }
      );
    }

    nodes.push(
      { id: "header-ub-r1", x: c1, y: 70, type: "playoffsHeader", title: "胜者组第一轮", matchIndex: 0 },
      { id: "header-ub-r2", x: c2, y: 145, type: "playoffsHeader", title: "胜者组第二轮", matchIndex: 0 },
      { id: "header-ub-r3", x: c3, y: 295, type: "playoffsHeader", title: "胜者组第三轮", matchIndex: 0 },
      { id: "header-ub-q", x: c4, y: 325, type: "playoffsHeader", title: "晋级", matchIndex: 0 },
      { id: "header-lb-r1", x: c1, y: lbY - 30, type: "playoffsHeader", title: "败者组第一轮", matchIndex: 0 },
      { id: "header-lb-r2", x: c2, y: lbY - 30, type: "playoffsHeader", title: "败者组第二轮", matchIndex: 0 },
      { id: "header-lb-r3", x: c3, y: lbY + 45, type: "playoffsHeader", title: "败者组第三轮", matchIndex: 0 },
      { id: "header-lb-r4", x: c4, y: lbY + 45, type: "playoffsHeader", title: "败者组第四轮", matchIndex: 0 },
      { id: "header-lb-q", x: c5, y: lbY + 75, type: "playoffsHeader", title: "晋级", matchIndex: 0 }
    );

    return { width: 1550, height: 2100, nodes, edges };
  }
  return generateProceduralDoubleElim(teamsCount, advanceCount);
}

function generateProceduralDoubleElim(teamsCount: number, advanceCount: number): BracketConfig {
  const nodes: BracketNode[] = [];
  const edges: BracketEdge[] = [];
  const w = 200;
  const gapX = 80;
  const gapY = 60;
  const cX = (col: number) => 100 + col * (w + gapX);

  // ----- UPPER BRACKET -----
  const ubAdvancers = advanceCount === 1 ? 1 : advanceCount / 2;
  const ubRounds = Math.log2(teamsCount / ubAdvancers);
  
  const ubYs: number[][] = []; 
  for (let r = 0; r < ubRounds; r++) {
    ubYs.push([]);
    const slotsCount = teamsCount / Math.pow(2, r); 
    for (let i = 0; i < slotsCount; i++) {
        let y = 0;
        if (r === 0) {
            y = 100 + i * gapY;
        } else {
            y = (ubYs[r-1][i * 2] + ubYs[r-1][i * 2 + 1]) / 2;
        }
        ubYs[r].push(y);
        nodes.push({
            id: `ub-r${r+1}-${i+1}`,
            x: cX(r),
            y,
            type: "playoffsSlot",
            disableDragDrop: r > 0,
        });
    }
    nodes.push({ id: `header-ub-r${r+1}`, x: cX(r), y: ubYs[r][0] - 30, type: "playoffsHeader", title: `胜者组第${r+1}轮`, matchIndex: 0 });
  }
  
  for (let r = 0; r < ubRounds - 1; r++) {
    const matchCount = teamsCount / Math.pow(2, r+1);
    for (let m = 0; m < matchCount; m++) {
        edges.push({
            from: `ub-r${r+1}-${m*2+1}`,
            to: `ub-r${r+2}-${m+1}`,
            type: "playoffs"
        });
        edges.push({
            from: `ub-r${r+1}-${m*2+2}`,
            to: `ub-r${r+2}-${m+1}`,
            type: "playoffs"
        });
    }
  }

  // ----- LOWER BRACKET -----
  const lbRounds = ubRounds * 2 - 2;
  let lbYOffset = 100 + teamsCount * gapY + 200;
  let currentLbMatches = teamsCount / 4;
  
  for (let l = 1; l <= lbRounds; l++) {
    const slotsCount = currentLbMatches * 2;
    for (let i = 0; i < slotsCount; i++) {
       let hasDropStub = false;
       if (l === 1) hasDropStub = true;
       else if (l % 2 === 0) {
           if (i % 2 === 1) hasDropStub = true; // slot 2 is the drop from UB
       }
       
       nodes.push({
           id: `lb-r${l}-${i+1}`,
           x: cX(l - 1),
           y: lbYOffset + i * gapY + Math.floor(i/2) * (gapY * 0.5), // add gap between matches
           type: "playoffsSlot",
           disableDragDrop: true,
           hasDropStub
       });
    }
    
    nodes.push({ id: `header-lb-r${l}`, x: cX(l - 1), y: lbYOffset - 30, type: "playoffsHeader", title: `败者组第${l}轮`, matchIndex: 0 });
    
    // Edges
    if (l > 1) {
        if (l % 2 === 0) {
            // Drop round: same number of matches. 
            // Previous round (l-1) was odd (normal). It has currentLbMatches * 2 matches?
            // No, l-1 has the SAME number of matches.
            for (let m = 0; m < currentLbMatches; m++) {
                edges.push({
                   from: `lb-r${l-1}-${m*2+1}`,
                   to: `lb-r${l}-${m*2+1}`, // goes to slot 1
                   type: "playoffs"
                });
                edges.push({
                   from: `lb-r${l-1}-${m*2+2}`,
                   to: `lb-r${l}-${m*2+1}`, // goes to slot 1
                   type: "playoffs"
                });
            }
        } else {
            // Normal round: next round has HALF the matches.
            // Previous round (l-1) had DOUBLE the number of matches as this round has?
            // Wait, l-1 has same number of matches. L has half the matches of L-1.
            const matchesInPrev = currentLbMatches * 2;
            for (let m = 0; m < matchesInPrev; m++) {
                // match m in l-1 puts winner in slot m+1 of l
                edges.push({
                   from: `lb-r${l-1}-${m*2+1}`,
                   to: `lb-r${l}-${m+1}`,
                   type: "playoffs"
                });
                edges.push({
                   from: `lb-r${l-1}-${m*2+2}`,
                   to: `lb-r${l}-${m+1}`,
                   type: "playoffs"
                });
            }
        }
    }
    
    if (l % 2 === 0) currentLbMatches /= 2;
  }
  
  return { width: cX(Math.max(ubRounds, lbRounds)) + 300, height: lbYOffset + (teamsCount / 2) * gapY + 500, nodes, edges };
}

function generateGauntlet(teamsCount: number): BracketConfig {
  const nodes: BracketNode[] = [];
  const edges: BracketEdge[] = [];
  
  const nodeWidth = 200;
  const nodeHeight = 50;
  const gapX = 100;
  const gapY = 60;
  
  let offsetX = 100;
  let currentY = 150 + (teamsCount - 2) * (nodeHeight + gapY) * 1.5;
  
  nodes.push({ id: `m1-1`, x: offsetX, y: currentY, type: "playoffsSlot", disableDragDrop: false });
  nodes.push({ id: `m1-2`, x: offsetX, y: currentY + nodeHeight + gapY, type: "playoffsSlot", disableDragDrop: false });
  nodes.push({ id: `header-m1`, x: offsetX, y: currentY - 24, type: "playoffsHeader", title: "第1轮", matchIndex: 0 });
  
  let prevSlots = [`m1-1`, `m1-2`];
  offsetX += nodeWidth + gapX;
  
  for (let i = 2; i < teamsCount; i++) {
    currentY -= (nodeHeight + gapY) * 1.5;
    const newChallengerId = `m${i}-1`;
    const newWinnerId = `m${i}-2`;
    
    nodes.push({ id: newChallengerId, x: offsetX, y: currentY, type: "playoffsSlot", disableDragDrop: false });
    const winnerY = currentY + (nodeHeight + gapY) * 0.75;
    nodes.push({ id: newWinnerId, x: offsetX, y: winnerY, type: "playoffsSlot", disableDragDrop: true });
    nodes.push({ id: `header-m${i}`, x: offsetX, y: currentY - 24, type: "playoffsHeader", title: `第${i}轮`, matchIndex: 0 });
    
    edges.push({ from: prevSlots[0], to: newWinnerId, type: "playoffs" });
    edges.push({ from: prevSlots[1], to: newWinnerId, type: "playoffs" });
    
    prevSlots = [newChallengerId, newWinnerId];
    offsetX += nodeWidth + gapX;
  }
  
  const champId = "champ";
  const champY = (nodes.find(n => n.id === prevSlots[0])!.y + nodes.find(n => n.id === prevSlots[1])!.y) / 2;
  nodes.push({ id: champId, x: offsetX, y: champY, type: "playoffsSlot", disableDragDrop: true });
  nodes.push({ id: `header-ch`, x: offsetX, y: champY - 24, type: "playoffsHeader", title: "晋级", matchIndex: 0 });
  
  edges.push({ from: prevSlots[0], to: champId, type: "playoffs" });
  edges.push({ from: prevSlots[1], to: champId, type: "playoffs" });

  return { width: offsetX + nodeWidth + 100, height: Math.max(800, currentY + (teamsCount) * (nodeHeight + gapY) * 1.5), nodes, edges };
}

function generateGSL(teamsCount: number): BracketConfig {
  const nodes: BracketNode[] = [];
  const edges: BracketEdge[] = [];
  
  const w = 200;
  const h = 50;
  const gapX = 100;
  const gapY = 20;

  const c1x = 100;
  const c2x = 100 + w + gapX;
  const c3x = 100 + (w + gapX) * 2;
  const c4x = 100 + (w + gapX) * 3;

  nodes.push(
    // Round 1
    { id: "r1-1", x: c1x, y: 100, type: "playoffsSlot", disableDragDrop: false },
    { id: "r1-2", x: c1x, y: 170, type: "playoffsSlot", disableDragDrop: false },
    { id: "r1-3", x: c1x, y: 280, type: "playoffsSlot", disableDragDrop: false },
    { id: "r1-4", x: c1x, y: 350, type: "playoffsSlot", disableDragDrop: false },

    // Winners Match
    { id: "wm-1", x: c2x, y: 135, type: "playoffsSlot", disableDragDrop: true },
    { id: "wm-2", x: c2x, y: 315, type: "playoffsSlot", disableDragDrop: true },

    // First advancing team
    { id: "adv-1", x: c3x, y: 225, type: "playoffsSlot", disableDragDrop: true },

    // Losers Match
    { id: "lm-1", x: c2x, y: 550, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
    { id: "lm-2", x: c2x, y: 620, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },

    // Decider Match
    { id: "dm-1", x: c3x, y: 460, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
    { id: "dm-2", x: c3x, y: 585, type: "playoffsSlot", disableDragDrop: true },

    // Second advancing team
    { id: "adv-2", x: c4x, y: 522.5, type: "playoffsSlot", disableDragDrop: true }
  );

  edges.push(
    { from: "r1-1", to: "wm-1", type: "playoffs" },
    { from: "r1-2", to: "wm-1", type: "playoffs" },
    { from: "r1-3", to: "wm-2", type: "playoffs" },
    { from: "r1-4", to: "wm-2", type: "playoffs" },
    
    { from: "wm-1", to: "adv-1", type: "playoffs" },
    { from: "wm-2", to: "adv-1", type: "playoffs" },
    
    { from: "lm-1", to: "dm-2", type: "playoffs" },
    { from: "lm-2", to: "dm-2", type: "playoffs" },
    
    { from: "dm-1", to: "adv-2", type: "playoffs" },
    { from: "dm-2", to: "adv-2", type: "playoffs" }
  );

  nodes.push(
    { id: "header-r1", x: c1x, y: 70, type: "playoffsHeader", title: "首轮", matchIndex: 0 },
    { id: "header-wm", x: c2x, y: 105, type: "playoffsHeader", title: "胜者赛", matchIndex: 0 },
    { id: "header-adv1", x: c3x, y: 195, type: "playoffsHeader", title: "首位晋级", matchIndex: 0 },
    
    { id: "header-lm", x: c2x, y: 520, type: "playoffsHeader", title: "败者赛", matchIndex: 0 },
    { id: "header-dm", x: c3x, y: 430, type: "playoffsHeader", title: "决胜赛", matchIndex: 0 },
    { id: "header-adv2", x: c4x, y: 492.5, type: "playoffsHeader", title: "次位晋级", matchIndex: 0 }
  );

  return { width: 1200, height: 800, nodes, edges };
}

function generateSwiss(teamsCount: number): BracketConfig {
  return SWISS_CONFIG;
}

function generateDoubleElim8to6(): BracketConfig {
  const nodes: BracketNode[] = [];
  const edges: BracketEdge[] = [];
  const w = 200;
  const gapX = 80;
  const c1 = 100;
  const c2 = c1 + w + gapX;
  const c3 = c2 + w + gapX;

  // UB R1
  nodes.push(
    { id: "ub-r1-1", x: c1, y: 100, type: "playoffsSlot", disableDragDrop: false },
    { id: "ub-r1-2", x: c1, y: 160, type: "playoffsSlot", disableDragDrop: false },
    { id: "ub-r1-3", x: c1, y: 250, type: "playoffsSlot", disableDragDrop: false },
    { id: "ub-r1-4", x: c1, y: 310, type: "playoffsSlot", disableDragDrop: false },
    { id: "ub-r1-5", x: c1, y: 400, type: "playoffsSlot", disableDragDrop: false },
    { id: "ub-r1-6", x: c1, y: 460, type: "playoffsSlot", disableDragDrop: false },
    { id: "ub-r1-7", x: c1, y: 550, type: "playoffsSlot", disableDragDrop: false },
    { id: "ub-r1-8", x: c1, y: 610, type: "playoffsSlot", disableDragDrop: false },
  );

  // UB R2
  nodes.push(
    { id: "ub-r2-1", x: c2, y: 130, type: "playoffsSlot", disableDragDrop: true },
    { id: "ub-r2-2", x: c2, y: 280, type: "playoffsSlot", disableDragDrop: true },
    { id: "ub-r2-3", x: c2, y: 430, type: "playoffsSlot", disableDragDrop: true },
    { id: "ub-r2-4", x: c2, y: 580, type: "playoffsSlot", disableDragDrop: true },
  );

  edges.push(
    { from: "ub-r1-1", to: "ub-r2-1", type: "playoffs" },
    { from: "ub-r1-2", to: "ub-r2-1", type: "playoffs" },
    { from: "ub-r1-3", to: "ub-r2-2", type: "playoffs" },
    { from: "ub-r1-4", to: "ub-r2-2", type: "playoffs" },
    { from: "ub-r1-5", to: "ub-r2-3", type: "playoffs" },
    { from: "ub-r1-6", to: "ub-r2-3", type: "playoffs" },
    { from: "ub-r1-7", to: "ub-r2-4", type: "playoffs" },
    { from: "ub-r1-8", to: "ub-r2-4", type: "playoffs" },
  );

  // UB Advancers (Winners of UB R2) - 2 teams
  nodes.push(
    { id: "ub-adv-1", x: c3, y: 205, type: "playoffsSlot", disableDragDrop: true },
    { id: "ub-adv-2", x: c3, y: 505, type: "playoffsSlot", disableDragDrop: true },
  );

  edges.push(
    { from: "ub-r2-1", to: "ub-adv-1", type: "playoffs" },
    { from: "ub-r2-2", to: "ub-adv-1", type: "playoffs" },
    { from: "ub-r2-3", to: "ub-adv-2", type: "playoffs" },
    { from: "ub-r2-4", to: "ub-adv-2", type: "playoffs" },
  );

  // LB R1 (Losers of UB R1)
  const lbY = 750;
  nodes.push(
    { id: "lb-r1-1", x: c1, y: lbY, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
    { id: "lb-r1-2", x: c1, y: lbY + 60, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
    { id: "lb-r1-3", x: c1, y: lbY + 150, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
    { id: "lb-r1-4", x: c1, y: lbY + 210, type: "playoffsSlot", disableDragDrop: true, hasDropStub: true },
  );

  // LB Advancers (Winners of LB R1)
  nodes.push(
    { id: "lb-adv-1", x: c2, y: lbY + 30, type: "playoffsSlot", disableDragDrop: true },
    { id: "lb-adv-2", x: c2, y: lbY + 180, type: "playoffsSlot", disableDragDrop: true },
  );

  edges.push(
    { from: "lb-r1-1", to: "lb-adv-1", type: "playoffs" },
    { from: "lb-r1-2", to: "lb-adv-1", type: "playoffs" },
    { from: "lb-r1-3", to: "lb-adv-2", type: "playoffs" },
    { from: "lb-r1-4", to: "lb-adv-2", type: "playoffs" },
  );
  
  // Headers
  nodes.push(
    { id: "header-ub-r1", x: c1, y: 70, type: "playoffsHeader", title: "胜者组第一轮", matchIndex: 0 },
    { id: "header-ub-r2", x: c2, y: 100, type: "playoffsHeader", title: "胜者组第二轮", matchIndex: 0 },
    { id: "header-lb-r1", x: c1, y: lbY - 30, type: "playoffsHeader", title: "败者组第一轮", matchIndex: 0 }
  );

  return { width: 1000, height: 1100, nodes, edges };
}

function generatePlayoffs6(): BracketConfig {
  const nodes: BracketNode[] = [];
  const edges: BracketEdge[] = [];
  
  const w = 200;
  const gapX = 80;
  const c1 = 100;
  const c2 = c1 + w + gapX;
  const c3 = c2 + w + gapX;
  const c4 = c3 + w + gapX;
  
  // Quarterfinals (4 teams, 2 matches)
  nodes.push(
    { id: "qf-1", x: c1, y: 150, type: "playoffsSlot", disableDragDrop: false },
    { id: "qf-2", x: c1, y: 210, type: "playoffsSlot", disableDragDrop: false },
    { id: "qf-3", x: c1, y: 450, type: "playoffsSlot", disableDragDrop: false },
    { id: "qf-4", x: c1, y: 510, type: "playoffsSlot", disableDragDrop: false },
  );
  
  // Semifinals (4 teams, 2 matches)
  nodes.push(
    // Seed 1 (directly in semi)
    { id: "sf-seed-1", x: c2, y: 90, type: "playoffsSlot", disableDragDrop: false },
    // Winner of QF 1
    { id: "sf-1", x: c2, y: 180, type: "playoffsSlot", disableDragDrop: true },
    
    // Seed 2 (directly in semi)
    { id: "sf-seed-2", x: c2, y: 390, type: "playoffsSlot", disableDragDrop: false },
    // Winner of QF 2
    { id: "sf-2", x: c2, y: 480, type: "playoffsSlot", disableDragDrop: true },
  );
  
  edges.push(
    { from: "qf-1", to: "sf-1", type: "playoffs" },
    { from: "qf-2", to: "sf-1", type: "playoffs" },
    { from: "qf-3", to: "sf-2", type: "playoffs" },
    { from: "qf-4", to: "sf-2", type: "playoffs" },
  );
  
  // Finals (2 teams)
  nodes.push(
    { id: "final-1", x: c3, y: 135, type: "playoffsSlot", disableDragDrop: true },
    { id: "final-2", x: c3, y: 435, type: "playoffsSlot", disableDragDrop: true },
  );
  
  edges.push(
    { from: "sf-seed-1", to: "final-1", type: "playoffs" },
    { from: "sf-1", to: "final-1", type: "playoffs" },
    { from: "sf-seed-2", to: "final-2", type: "playoffs" },
    { from: "sf-2", to: "final-2", type: "playoffs" },
  );
  
  // Champion
  nodes.push(
    { id: "champion", x: c4, y: 285, type: "playoffsSlot", disableDragDrop: true },
  );
  
  edges.push(
    { from: "final-1", to: "champion", type: "playoffs" },
    { from: "final-2", to: "champion", type: "playoffs" },
  );
  
  // Headers
  nodes.push(
    { id: "header-qf", x: c1, y: 120, type: "playoffsHeader", title: "1/4决赛", matchIndex: 0 },
    { id: "header-sf", x: c2, y: 60, type: "playoffsHeader", title: "半决赛", matchIndex: 0 },
    { id: "header-final", x: c3, y: 105, type: "playoffsHeader", title: "决 赛", matchIndex: 0 },
    { id: "header-champ", x: c4, y: 255, type: "playoffsHeader", title: "冠军", matchIndex: 0 },
  );

  return { width: 1200, height: 700, nodes, edges };
}
