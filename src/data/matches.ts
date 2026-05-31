import { BracketMatch, PickSlot } from '../types';

export const MATCHES: Record<string, Record<string, BracketMatch[]>> = {
    stage1: {
        '0:0': [
            { team1Id: 'm80', team2Id: 'lynn' },
            { team1Id: 'sinners', team2Id: 'flyquest' },
            { team1Id: 'b8', team2Id: 'tyloo' },
            { team1Id: 'mibr', team2Id: 'thunder' },
            { team1Id: 'gamerlegion', team2Id: 'nrg' },
            { team1Id: 'heroic', team2Id: 'sharks' },
            { team1Id: 'betboom', team2Id: 'gaimin' },
            { team1Id: 'big', team2Id: 'liquid' }
        ]
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
