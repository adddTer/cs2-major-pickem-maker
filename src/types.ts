export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  logo?: string;
  startStage?: number;
  // Ranking fields
  valveRank?: number;
  valvePoints?: number;
  hltvRank?: number;
  hltvPoints?: number;
  strength?: number;
  // Extended properties for Pre-match analysis
  worldRank?: number;
  recentForm?: ("W" | "L" | "D")[];
  mapWinrates?: Array<{
    mapName: string;
    winRate: number;
    matchesPlayed: number;
  }>;
}

export type SlotType =
  | "3-0"
  | "advance"
  | "0-3"
  | "qf"
  | "sf"
  | "final"
  | "champion";
export type StageKey = "stage1" | "stage2" | "stage3" | "playoffs";

export type MatchFormat = "bo1" | "bo3" | "bo5";

export interface MapScore {
  score1: number;
  score2: number;
}

export interface VetoAction {
  teamId: string;
  action: "BAN" | "PICK" | "LEFT";
  mapName: string;
  order: number;
}

export interface PlayerStats {
  playerId: string;
  nickname: string;
  rating: number;
  kills: number;
  deaths: number;
  assists: number;
  adr?: number;
  kast?: number;
  isMVP?: boolean;
  communityRating?: number;
}

export type BracketMatch = {
  externalId?: string; // 5EPlay Match ID
  team1Id?: string;
  team2Id?: string;
  format?: MatchFormat;
  score1?: number;
  score2?: number;
  maps?: MapScore[];
  status?: "past" | "live" | "upcoming";
  scheduledTime?: number;
  vetoes?: VetoAction[];
  team1Stats?: PlayerStats[];
  team2Stats?: PlayerStats[];
  highlightVideoUrl?: string;
};

export interface PickSlot {
  id: string;
  type: SlotType;
  teamId: string | null;
  bottomText?: string;
}

export interface MatrixSet {
  id: string;
  eventId?: string;
  name: string;
  stage: StageKey;
  isDefault: boolean;
  matrix: Record<string, Record<string, number>>;
  createdAt: number;
}

export interface TournamentEvent {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  isSwissAllBo3?: boolean;
  stages?: {
    stage1?: { externalId: string };
    stage2?: { externalId: string };
    stage3?: { externalId: string };
  };
}

export interface PickSet {
  id: string;
  eventId?: string;
  name: string; // Used for display
  createdAt: number;
  picks: Record<string, PickSlot[]>;
}
