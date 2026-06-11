import { simulateSwiss } from '../utils/simulateSwiss';

self.onmessage = async (e: MessageEvent) => {
    const { allTeams, pastMatches, scheduledMatches, numSimulations, teamStrengths, activeStage } = e.data;
    const chunkSize = 2000;
    
    const data = new Uint16Array(numSimulations * 3);
    
    for (let simCount = 0; simCount < numSimulations; simCount += chunkSize) {
        const toSimulate = Math.min(chunkSize, numSimulations - simCount);
        const chunkResults = simulateSwiss(allTeams, pastMatches, scheduledMatches, toSimulate, teamStrengths, activeStage);
        
        for (let i = 0; i < chunkResults.length; i++) {
            const r = chunkResults[i];
            let mask30 = 0, mask03 = 0, maskAdv = 0;
            
            for (const t of r.teams30) mask30 |= (1 << allTeams.indexOf(t));
            for (const t of r.teams03) mask03 |= (1 << allTeams.indexOf(t));
            for (const t of r.teamsAdvance) maskAdv |= (1 << allTeams.indexOf(t));
            
            const offset = (simCount + i) * 3;
            data[offset] = mask30;
            data[offset + 1] = mask03;
            data[offset + 2] = maskAdv;
        }
        
        const currentTotal = simCount + toSimulate;
        const currentData = data.slice(0, currentTotal * 3);
        
        // Report progress
        self.postMessage({ 
            type: 'progress', 
            progress: Math.min(100, Math.round((currentTotal / numSimulations) * 100)),
            data: currentData,
            allTeams 
        });
        
        // Let event loop breathe
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    self.postMessage({ type: 'done', data, allTeams });
};
