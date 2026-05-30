export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  logo?: string;
  startStage?: number;
}

export type SlotType = '3-0' | 'advance' | '0-3';

export interface PickSlot {
  id: string;
  type: SlotType;
  teamId: string | null;
}
