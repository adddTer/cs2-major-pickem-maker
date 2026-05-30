import { Team, PickSlot } from '../types';

export const TEAMS: Team[] = [
  // Stage 3 Teams
  { id: 'vitality', name: 'Team Vitality', shortName: 'VIT', color: '#f3e700', textColor: '#000000', logo: 'https://logo.clearbit.com/vitality.gg', startStage: 3 },
  { id: 'navi', name: 'Natus Vincere', shortName: 'NAVI', color: '#ffea00', textColor: '#000000', logo: 'https://logo.clearbit.com/navi.gg', startStage: 3 },
  { id: 'parivision', name: 'PARIVISION', shortName: 'PARI', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://logo.clearbit.com/parivision.gg', startStage: 3 },
  { id: 'aurora', name: 'Aurora', shortName: 'AUR', color: '#0055ff', textColor: '#ffffff', logo: 'https://logo.clearbit.com/auroragg.com', startStage: 3 },
  { id: 'falcons', name: 'Team Falcons', shortName: 'FAL', color: '#00cc00', textColor: '#ffffff', logo: 'https://logo.clearbit.com/falcons.gg', startStage: 3 },
  { id: 'mouz', name: 'MOUZ', shortName: 'MOUZ', color: '#d31027', textColor: '#ffffff', logo: 'https://logo.clearbit.com/mousesports.com', startStage: 3 },
  { id: 'furia', name: 'FURIA', shortName: 'FUR', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://logo.clearbit.com/furia.gg', startStage: 3 },
  { id: 'mongolz', name: 'The MongolZ', shortName: 'MGLZ', color: '#b92429', textColor: '#ffffff', logo: 'https://logo.clearbit.com/themongolz.gg', startStage: 3 },

  // Stage 2 Teams
  { id: 'spirit', name: 'Team Spirit', shortName: 'SPR', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://logo.clearbit.com/teamspirit.ru', startStage: 2 },
  { id: 'astralis', name: 'Astralis', shortName: 'AST', color: '#ef3742', textColor: '#ffffff', logo: 'https://logo.clearbit.com/astralis.gg', startStage: 2 },
  { id: 'g2', name: 'G2 Esports', shortName: 'G2', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://logo.clearbit.com/g2esports.com', startStage: 2 },
  { id: 'fut', name: 'FUT Esports', shortName: 'FUT', color: '#ff0000', textColor: '#ffffff', logo: 'https://logo.clearbit.com/futesports.gg', startStage: 2 },
  { id: 'monte', name: 'Monte', shortName: 'MNT', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://logo.clearbit.com/monte.gg', startStage: 2 },
  { id: '9z', name: '9z', shortName: '9z', color: '#5b2f8a', textColor: '#ffffff', logo: 'https://logo.clearbit.com/9zteam.com', startStage: 2 },
  { id: 'pain', name: 'paiN Gaming', shortName: 'paiN', color: '#ff0000', textColor: '#ffffff', startStage: 2 },
  { id: 'legacy', name: 'Legacy', shortName: 'LGCY', color: '#ffaa00', textColor: '#000000', startStage: 2 },

  // Stage 1 Teams
  { id: 'gamerlegion', name: 'GamerLegion', shortName: 'GL', color: '#ff5500', textColor: '#ffffff', logo: 'https://logo.clearbit.com/gamerlegion.gg', startStage: 1 },
  { id: 'big', name: 'BIG', shortName: 'BIG', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://logo.clearbit.com/bigclan.gg', startStage: 1 },
  { id: 'betboom', name: 'BetBoom', shortName: 'BB', color: '#dd0000', textColor: '#ffffff', logo: 'https://logo.clearbit.com/betboom.ru', startStage: 1 },
  { id: 'b8', name: 'B8', shortName: 'B8', color: '#ffcc00', textColor: '#000000', startStage: 1 },
  { id: 'heroic', name: 'HEROIC', shortName: 'HER', color: '#ed1b24', textColor: '#ffffff', logo: 'https://logo.clearbit.com/heroic.gg', startStage: 1 },
  { id: 'sinners', name: 'SINNERS', shortName: 'SIN', color: '#ff0000', textColor: '#ffffff', logo: 'https://logo.clearbit.com/sinners.gg', startStage: 1 },
  { id: 'm80', name: 'M80', shortName: 'M80', color: '#333333', textColor: '#ffffff', logo: 'https://logo.clearbit.com/m80.gg', startStage: 1 },
  { id: 'nrg', name: 'NRG', shortName: 'NRG', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://logo.clearbit.com/nrg.gg', startStage: 1 },
  { id: 'sharks', name: 'Sharks', shortName: 'SHK', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://logo.clearbit.com/sharksesports.com', startStage: 1 },
  { id: 'gaimin', name: 'Gaimin Gladiators', shortName: 'GG', color: '#cc0000', textColor: '#ffffff', logo: 'https://logo.clearbit.com/gaimingladiators.gg', startStage: 1 },
  { id: 'mibr', name: 'MIBR', shortName: 'MIBR', color: '#0000ff', textColor: '#ffffff', logo: 'https://logo.clearbit.com/mibr.gg', startStage: 1 },
  { id: 'liquid', name: 'Team Liquid', shortName: 'TL', color: '#0f1d2c', textColor: '#ffffff', logo: 'https://logo.clearbit.com/teamliquid.com', startStage: 1 },
  { id: 'tyloo', name: 'TYLOO', shortName: 'TYL', color: '#ff0000', textColor: '#ffffff', startStage: 1 },
  { id: 'lynn', name: 'Lynn Vision', shortName: 'LVG', color: '#aaaaaa', textColor: '#000000', startStage: 1 },
  { id: 'thunder', name: 'THUNDER dOWNUNDER', shortName: 'TDU', color: '#ff00ff', textColor: '#ffffff', startStage: 1 },
  { id: 'flyquest', name: 'FlyQuest', shortName: 'FLY', color: '#00cc00', textColor: '#ffffff', logo: 'https://logo.clearbit.com/flyquest.gg', startStage: 1 }
];

export const INITIAL_SLOTS: PickSlot[] = [
  { id: '3-0-1', type: '3-0', teamId: null },
  { id: '3-0-2', type: '3-0', teamId: null },
  { id: 'adv-1', type: 'advance', teamId: null },
  { id: 'adv-2', type: 'advance', teamId: null },
  { id: 'adv-3', type: 'advance', teamId: null },
  { id: 'adv-4', type: 'advance', teamId: null },
  { id: 'adv-5', type: 'advance', teamId: null },
  { id: 'adv-6', type: 'advance', teamId: null },
  { id: '0-3-1', type: '0-3', teamId: null },
  { id: '0-3-2', type: '0-3', teamId: null }
];
