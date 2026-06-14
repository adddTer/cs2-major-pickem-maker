import { simulateGlobal } from '../utils/simulateGlobal';

self.onmessage = async (e: MessageEvent) => {
    const { currentMatches, computedActuals, numSimulations, isSwissAllBo3, currentEventId } = e.data;
    const chunkSize = 2000;
    
    // We will do chunks in simulateGlobal itself or just call it directly since it has progress.
    // However, if it's purely synchronous, it blocks the worker event loop. So we can just call it and it will postMessage for progress.
    const onProgress = (p: number) => {
      self.postMessage({ type: 'progress', progress: p });
    };

    const result = simulateGlobal(currentMatches, computedActuals, numSimulations, onProgress, isSwissAllBo3, currentEventId);
    self.postMessage({ type: 'done', result });
};
