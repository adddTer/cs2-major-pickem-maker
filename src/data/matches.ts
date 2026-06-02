import { BracketMatch, PickSlot } from '../types';

export const MATCHES: Record<string, Record<string, BracketMatch[]>> = {
    stage1: {
        '0:0': [
            { team1Id: 'm80', team2Id: 'lynn', format: 'bo1', score1: 1, score2: 0, maps: [{ score1: 13, score2: 8 }] },
            { team1Id: 'sinners', team2Id: 'flyquest', format: 'bo1', score1: 0, score2: 1, maps: [{ score1: 14, score2: 16 }] },
            { team1Id: 'b8', team2Id: 'tyloo', format: 'bo1' , score1: 1, score2: 0, maps: [{ score1: 13, score2: 6 }] },
            { team1Id: 'mibr', team2Id: 'thunder', format: 'bo1', score1: 0, score2: 1, maps: [{ score1: 6, score2: 13 }] },
            { team1Id: 'gamerlegion', team2Id: 'nrg', format: 'bo1' , score1: 1, score2: 0, maps: [{ score1: 13, score2: 10 }] },
            { team1Id: 'heroic', team2Id: 'sharks', format: 'bo1', score1: 0, score2: 1, maps: [{ score1: 10, score2: 13 }] },
            { team1Id: 'betboom', team2Id: 'gaimin', format: 'bo1' , score1: 1, score2: 0, maps: [{ score1: 13, score2: 4 }] },
            { team1Id: 'big', team2Id: 'liquid', format: 'bo1' , score1: 0, score2: 1, maps: [{ score1: 10, score2: 13 }] }
        ],
        '1:0': [
            { team1Id: 'gamerlegion', team2Id: 'flyquest', format: 'bo1', score1: 1, score2: 0, maps: [{ score1: 13, score2: 11 }] },
            { team1Id: 'b8', team2Id: 'thunder', format: 'bo1', score1: 1, score2: 0, maps: [{ score1: 13, score2: 11 }] },
            { team1Id: 'betboom', team2Id: 'liquid', format: 'bo1', score1: 1, score2: 0, maps: [{ score1: 13, score2: 9 }] },
            { team1Id: 'm80', team2Id: 'sharks', format: 'bo1', score1: 1, score2: 0, maps: [{ score1: 13, score2: 6 }] }
        ],
        '0:1': [
            { team1Id: 'heroic', team2Id: 'lynn', format: 'bo1', score1: 0, score2: 1, maps: [{ score1: 11, score2: 13 }] },
            { team1Id: 'big', team2Id: 'gaimin', format: 'bo1', score1: 1, score2: 0, maps: [{ score1: 13, score2: 1 }] },
            { team1Id: 'mibr', team2Id: 'tyloo', format: 'bo1', score1: 1, score2: 0, maps: [{ score1: 16, score2: 14 }] },
            { team1Id: 'sinners', team2Id: 'nrg', format: 'bo1', score1: 0, score2: 1, maps: [{ score1: 6, score2: 13 }] }
        ],
        '2:0': [
            { team1Id: 'm80', team2Id: 'b8', format: 'bo3' },
            { team1Id: 'gamerlegion', team2Id: 'betboom', format: 'bo3' }
        ],
        '1:1': [
            { team1Id: 'thunder', team2Id: 'big', format: 'bo1' },
            { team1Id: 'liquid', team2Id: 'mibr', format: 'bo1' },
            { team1Id: 'sharks', team2Id: 'lynn', format: 'bo1' },
            { team1Id: 'nrg', team2Id: 'flyquest', format: 'bo1' }
        ],
        '0:2': [
            { team1Id: 'tyloo', team2Id: 'sinners', format: 'bo3' },
            { team1Id: 'gaimin', team2Id: 'heroic', format: 'bo3' }
        ],
        '2:1': [],
        '1:2': [],
        '2:2': []
    },
    stage2: {},
    stage3: {},
    playoffs: {}
};

export const ACTUAL_RESULTS: Record<string, PickSlot[]> = {
    stage1: [],
    stage2: [],
    stage3: [],
    playoffs: []
};
