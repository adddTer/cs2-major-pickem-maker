import { simulateSwiss } from '../utils/simulateSwiss';

export interface CalcBestPickemConfig {
  allTeams: string[];
  pastMatches: any[];
  scheduledMatches: any[];
  numSimulations: number;
  activeStage: string;
  customMatrix?: Record<string, Record<string, number>>;
}

export interface PickemResult {
  t30: number[]; // 2 indices
  t03: number[]; // 2 indices
  tAdv: number[]; // 6 indices
  score: number; // probability of getting >= 5
}

// Popcount table for 16-bit
const popcnt = new Uint8Array(65536);
for (let i = 0; i < 65536; i++) {
  let c = 0;
  for (let j = 0; j < 16; j++) {
    if (i & (1 << j)) c++;
  }
  popcnt[i] = c;
}

function evaluate(sims: Uint16Array, numSims: number, p30: number, p03: number, pAdv: number): number {
  let count5 = 0;
  for (let i = 0; i < numSims; i++) {
    const offset = i * 3;
    const sim30 = sims[offset];
    const sim03 = sims[offset + 1];
    const simAdv = sims[offset + 2];

    const match30 = popcnt[p30 & sim30];
    const match03 = popcnt[p03 & sim03];
    // Advance pick is correct ONLY if the team advanced 3-1 or 3-2. (3-0 does not count).
    const matchAdv = popcnt[pAdv & simAdv];

    if (match30 + match03 + matchAdv >= 5) {
      count5++;
    }
  }
  return count5 / numSims;
}

self.onmessage = async (e: MessageEvent) => {
  const { allTeams, pastMatches, scheduledMatches, numSimulations, activeStage, customMatrix } = e.data as CalcBestPickemConfig;
  
  self.postMessage({ type: 'progress', phase: 'simulating', progress: 0 });

  // 1. Run Simulations
  const chunkSize = 5000;
  const sims = new Uint16Array(numSimulations * 3);
  for (let simCount = 0; simCount < numSimulations; simCount += chunkSize) {
    const toSimulate = Math.min(chunkSize, numSimulations - simCount);
    const chunkResults = simulateSwiss(allTeams, pastMatches, scheduledMatches, toSimulate, {}, activeStage, customMatrix);
    
    for (let i = 0; i < chunkResults.length; i++) {
        const r = chunkResults[i];
        let mask30 = 0, mask03 = 0, maskAdv = 0;
        
        for (const t of r.teams30) mask30 |= (1 << allTeams.indexOf(t));
        for (const t of r.teams03) mask03 |= (1 << allTeams.indexOf(t));
        for (const t of r.teamsAdvance) maskAdv |= (1 << allTeams.indexOf(t));
        
        const offset = (simCount + i) * 3;
        sims[offset] = mask30;
        sims[offset + 1] = mask03;
        sims[offset + 2] = maskAdv;
    }
    
    self.postMessage({ type: 'progress', phase: 'simulating', progress: Math.min(100, Math.round(((simCount + toSimulate) / numSimulations) * 100)) });
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  // 2. Hill Climbing
  self.postMessage({ type: 'progress', phase: 'optimizing', progress: 0 });

  let bestGlobalScore = -1;
  let bestGlobalPicks: { p30: number, p03: number, pAdv: number } = { p30: 0, p03: 0, pAdv: 0 };
  
  const getRandomStart = () => {
    let pool = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    for (let i = 15; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    let p30 = 0, p03 = 0, pAdv = 0;
    p30 |= (1 << pool[0]) | (1 << pool[1]);
    p03 |= (1 << pool[2]) | (1 << pool[3]);
    for(let i=4; i<10; i++) pAdv |= (1 << pool[i]);
    return { p30, p03, pAdv };
  }

  // Hill climbing
  for (let restart = 0; restart < 50; restart++) {
    let current = getRandomStart();
    let currentScore = evaluate(sims, numSimulations, current.p30, current.p03, current.pAdv);
    
    let improved = true;
    while(improved) {
      improved = false;
      let neighbors: {p30: number, p03: number, pAdv: number, score: number}[] = [];
      
      const c30 = [], c03 = [], cAdv = [], unpicked = [];
      for(let i=0; i<16; i++) {
         if (current.p30 & (1<<i)) c30.push(i);
         else if (current.p03 & (1<<i)) c03.push(i);
         else if (current.pAdv & (1<<i)) cAdv.push(i);
         else unpicked.push(i);
      }
      
      const trySwap = (g1: number[], g2: number[], isUnpicked: boolean) => {
         for(const t1 of g1) {
            for(const t2 of g2) {
               let n30 = current.p30, n03 = current.p03, nAdv = current.pAdv;
               // remove t1 from its group
               if (n30 & (1<<t1)) n30 &= ~(1<<t1);
               else if (n03 & (1<<t1)) n03 &= ~(1<<t1);
               else if (nAdv & (1<<t1)) nAdv &= ~(1<<t1);

               // add t2 to t1's group
               if (current.p30 & (1<<t1)) n30 |= (1<<t2);
               else if (current.p03 & (1<<t1)) n03 |= (1<<t2);
               else if (current.pAdv & (1<<t1)) nAdv |= (1<<t2);
               
               // if t2 wasn't unpicked, we swapped them, so put t1 in t2's old group
               if (!isUnpicked) {
                 if (current.p30 & (1<<t2)) n30 = (n30 & ~(1<<t2)) | (1<<t1);
                 else if (current.p03 & (1<<t2)) n03 = (n03 & ~(1<<t2)) | (1<<t1);
                 else if (current.pAdv & (1<<t2)) nAdv = (nAdv & ~(1<<t2)) | (1<<t1);
               }
               
               neighbors.push({ p30: n30, p03: n03, pAdv: nAdv, score: -1 });
            }
         }
      }

      trySwap(c30, unpicked, true);
      trySwap(c03, unpicked, true);
      trySwap(cAdv, unpicked, true);
      trySwap(c30, c03, false);
      trySwap(c30, cAdv, false);
      trySwap(c03, cAdv, false);

      let bestN = current;
      let bestNScore = currentScore;
      for (let n of neighbors) {
         n.score = evaluate(sims, numSimulations, n.p30, n.p03, n.pAdv);
         if (n.score > bestNScore) {
           bestNScore = n.score;
           bestN = { p30: n.p30, p03: n.p03, pAdv: n.pAdv };
         }
      }

      if (bestNScore > currentScore) {
         currentScore = bestNScore;
         current = bestN;
         improved = true;
      }
    }
    
    if (currentScore > bestGlobalScore) {
       bestGlobalScore = currentScore;
       bestGlobalPicks = current;
    }
    
    self.postMessage({ type: 'progress', phase: 'optimizing', progress: Math.floor((restart / 50) * 100) });
    await new Promise(r => setTimeout(r, 0));
  }
  
  const toArr = (mask: number) => {
    let res = [];
    for(let i=0; i<16; i++) if (mask & (1<<i)) res.push(i);
    return res;
  }

  self.postMessage({ 
    type: 'done', 
    result: { 
       t30: toArr(bestGlobalPicks.p30).map(i => allTeams[i]),
       t03: toArr(bestGlobalPicks.p03).map(i => allTeams[i]),
       tAdv: toArr(bestGlobalPicks.pAdv).map(i => allTeams[i]),
       score: bestGlobalScore
    } 
  });
};
