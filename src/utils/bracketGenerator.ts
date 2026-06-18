import { BracketConfig, BracketNode, BracketEdge, BracketNodeType, SWISS_CONFIG } from "../data/bracketConfigs";

export interface BracketGenerationParams {
  type: "single_elim" | "double_elim" | "swiss" | "gsl" | "gauntlet" | "round_robin" | "double_round_robin";
  teamsCount: number;
  thirdPlaceMatch?: boolean;
}

export function parseFormatString(formatStr: string): BracketGenerationParams {
  const parts = formatStr.split("_");
  let type = parts[0] + (parts[1] && ["elim", "robin"].includes(parts[1]) ? "_" + parts[1] : "");
  if (parts.length > 2 && parts[0] === "double" && parts[1] === "round" && parts[2] === "robin") {
    type = "double_round_robin";
  }
  
  const typeStrLength = type.split("_").length;
  const teamsCount = parseInt(parts[typeStrLength]) || 4;
  const thirdPlaceMatch = formatStr.includes("_3rd");

  return { type: type as any, teamsCount, thirdPlaceMatch };
}

export function generateBracketConfig(formatStr: string): BracketConfig {
  const params = parseFormatString(formatStr);
  const { type, teamsCount, thirdPlaceMatch } = params;

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
      return generateDoubleElim(teamsCount);
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

function generateDoubleElim(teamsCount: number): BracketConfig {
  return generateSingleElim(teamsCount, true); // Fallback to single elim with 3rd place 
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
    { id: "lm-1", x: c2x, y: 550, type: "playoffsSlot", disableDragDrop: true },
    { id: "lm-2", x: c2x, y: 620, type: "playoffsSlot", disableDragDrop: true },

    // Decider Match
    { id: "dm-1", x: c3x, y: 460, type: "playoffsSlot", disableDragDrop: true },
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
    
    // Line dropping down to Decider Match
    { from: "wm-1", to: "dm-1", type: "playoffs" },
    { from: "wm-2", to: "dm-1", type: "playoffs" },
    
    { from: "r1-1", to: "lm-1", type: "playoffs" },
    { from: "r1-2", to: "lm-1", type: "playoffs" },
    { from: "r1-3", to: "lm-2", type: "playoffs" },
    { from: "r1-4", to: "lm-2", type: "playoffs" },
    
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
