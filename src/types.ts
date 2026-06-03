export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  logo?: string;
  startStage?: number;
}

export type SlotType = '3-0' | 'advance' | '0-3' | 'qf' | 'sf' | 'final' | 'champion';
export type StageKey = 'stage1' | 'stage2' | 'stage3' | 'playoffs';

export type MatchFormat = 'bo1' | 'bo3' | 'bo5';

export interface MapScore {
  score1: number;
  score2: number;
}

export type BracketMatch = {
  team1Id?: string;
  team2Id?: string;
  format?: MatchFormat;
  score1?: number;
  score2?: number;
  maps?: MapScore[];
};

export interface PickSlot {
  id: string;
  type: SlotType;
  teamId: string | null;
}

export interface PickSet {
  id: string;
  name: string; // Used for display
  createdAt: number;
  picks: Record<string, PickSlot[]>;
}
