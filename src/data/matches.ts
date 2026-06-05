import { BracketMatch, PickSlot } from '../types';

export const MATCHES: Record<string, Record<string, BracketMatch[]>> = {
    stage1: {},
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
