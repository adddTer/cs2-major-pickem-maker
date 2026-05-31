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

export type BracketMatch = {
  team1Id?: string;
  team2Id?: string;
  score1?: number;
  score2?: number;
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
