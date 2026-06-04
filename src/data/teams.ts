import { Team, PickSlot } from '../types';

export const TEAMS: Team[] = [
  // Stage 3 Teams
  { id: 'vitality', name: 'Team Vitality', shortName: 'VIT', color: '#f3e700', textColor: '#000000', logo: 'https://img-cdn.hltv.org/teamlogo/yeXBldn9w8LZCgdElAenPs.png?ixlib=java-2.1.0&w=50&s=15eaba0b75250065d20162d2cb05e3e6', startStage: 3 },
  { id: 'navi', name: 'Natus Vincere', shortName: 'NAVI', color: '#ffea00', textColor: '#000000', logo: 'https://img-cdn.hltv.org/teamlogo/9iMirAi7ArBLNU8p3kqUTZ.svg?ixlib=java-2.1.0&s=4dd8635be16122656093ae9884675d0c', startStage: 3 },
  { id: 'parivision', name: 'PARIVISION', shortName: 'PARI', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/MFcDe-M8wfGOUU6x4sRELR.png?ixlib=java-2.1.0&w=50&s=1d91076a58b354d8c3eaeda3162c292e', startStage: 3 },
  { id: 'aurora', name: 'Aurora', shortName: 'AUR', color: '#0055ff', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/yJzPNOeXlyiniNxanYJCrv.png?ixlib=java-2.1.0&w=50&s=2c08f70c2f2f8c2024a438ddcf19bbf1', startStage: 3 },
  { id: 'falcons', name: 'Team Falcons', shortName: 'FAL', color: '#00cc00', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/4eJSkDQINNM6Tbs4WvLzkN.png?ixlib=java-2.1.0&w=50&s=d8c857ea47046f61eca695beab0d12ef', startStage: 3 },
  { id: 'mouz', name: 'MOUZ', shortName: 'MOUZ', color: '#d31027', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/IejtXpquZnE8KqYPB1LNKw.svg?ixlib=java-2.1.0&s=7fd33b8def053fbfd8fdbb58e3bdcd3c', startStage: 3 },
  { id: 'furia', name: 'FURIA', shortName: 'FUR', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/mvNQc4csFGtxXk5guAh8m1.svg?ixlib=java-2.1.0&s=11e5056829ad5d6c06c5961bbe76d20c', startStage: 3 },
  { id: 'mongolz', name: 'The MongolZ', shortName: 'MGLZ', color: '#b92429', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/bRk2sh_tSTO6fq1GLhgcal.png?ixlib=java-2.1.0&w=50&s=8b08e53858eb817852ae74b30a30151d', startStage: 3 },

  // Stage 2 Teams
  { id: 'spirit', name: 'Team Spirit', shortName: 'SPR', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/ywdn4tmAvXfllLeV2SkkvF.png?ixlib=java-2.1.0&w=50&s=9c70c7fbb048348f70f686acd2369c58', startStage: 2 },
  { id: 'astralis', name: 'Astralis', shortName: 'AST', color: '#ef3742', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/9bgXHp-oh1oaXr7F0mTGmd.svg?ixlib=java-2.1.0&s=f567161ab183001be33948b98c4b2067', startStage: 2 },
  { id: 'g2', name: 'G2 Esports', shortName: 'G2', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/zFLwAELOD15BjJSDMMNBWQ.png?ixlib=java-2.1.0&w=50&s=affb583e6716d8ee904826992255cc4b', startStage: 2 },
  { id: 'fut', name: 'FUT Esports', shortName: 'FUT', color: '#ff0000', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/Os71GAOy8KDuQFc0M8HE6O.png?ixlib=java-2.1.0&w=50&s=86f2bded6bcb7c690a42a62250ed69e7', startStage: 2 },
  { id: 'monte', name: 'Monte', shortName: 'MNT', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/2tc9n4fHkiRIX2FiJSkhgt.png?ixlib=java-2.1.0&w=50&s=7334ef0dd24ba5349b404dfd0e8c6148', startStage: 2 },
  { id: '9z', name: '9z', shortName: '9z', color: '#5b2f8a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/COZDFWOIm41AT0srqOHFhM.png?ixlib=java-2.1.0&w=50&s=81c70f301dfc75e014336aa0ccb440f9', startStage: 2 },
  { id: 'pain', name: 'paiN Gaming', shortName: 'paiN', color: '#ff0000', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/x7znFH8_QjLXOQRyR2y7Xp.png?ixlib=java-2.1.0&w=50&s=e4435bf7c351b546b867adc1d7886795', startStage: 2 },
  { id: 'legacy', name: 'Legacy', shortName: 'LGCY', color: '#ffaa00', textColor: '#000000', logo: 'https://img-cdn.hltv.org/teamlogo/RWbHH6RA8uGwJurGeLFvSr.png?ixlib=java-2.1.0&w=50&s=3d251032e156cab2f6df8c630ca29745', startStage: 2 },

  // Stage 1 Teams
  { id: 'gamerlegion', name: 'GamerLegion', shortName: 'GL', color: '#ff5500', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/vN7O46QoQ346WIRZ8D3spC.png?ixlib=java-2.1.0&w=50&s=f139433d31902eea5898c3a63fcc643a', startStage: 1 },
  { id: 'big', name: 'BIG', shortName: 'BIG', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/yQB6cm3KZ_BcyrgppBQMjc.svg?ixlib=java-2.1.0&s=06825290bfb61c9f8467f5c323f51974', startStage: 1 },
  { id: 'betboom', name: 'BetBoom', shortName: 'BB', color: '#dd0000', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/G4ZrdB0-q41USPd_z27IQA.png?ixlib=java-2.1.0&w=50&s=9c15ddf70f9c66399d4a47e0d8e93511', startStage: 1 },
  { id: 'b8', name: 'B8', shortName: 'B8', color: '#ffcc00', textColor: '#000000', logo: 'https://img-cdn.hltv.org/teamlogo/rUIL5D299QDtRjXR2rxqV_.png?ixlib=java-2.1.0&w=50&s=3c6cf22f3a3c85a5fb69af20395bebfc', startStage: 1 },
  { id: 'heroic', name: 'HEROIC', shortName: 'HER', color: '#ed1b24', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/4S22uk_gnZTiQiI-hhH4yp.png?ixlib=java-2.1.0&w=50&s=3619ddf1d490573ab3dc261b8c2f3f6f', startStage: 1 },
  { id: 'sinners', name: 'SINNERS', shortName: 'SIN', color: '#ff0000', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/9l_WdQSU9JsNHzpK-pwOG2.svg?ixlib=java-2.1.0&s=af432c3ef61c0c843331cc0dc2fed1ed', startStage: 1 },
  { id: 'm80', name: 'M80', shortName: 'M80', color: '#333333', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/YsaWwP_VrkbHzuhszuANEK.png?ixlib=java-2.1.0&w=50&s=47a8cff375da8242af9137a2a592b97d', startStage: 1 },
  { id: 'nrg', name: 'NRG', shortName: 'NRG', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/SJZaPBCyZssru-pUDS3aZe.png?ixlib=java-2.1.0&w=50&s=5f4ca255d90b4ea7092882834bbf1bdc', startStage: 1 },
  { id: 'sharks', name: 'Sharks', shortName: 'SHK', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/xduTwTuydAWc0Dbt-eEjeH.png?ixlib=java-2.1.0&w=50&s=16cdced9e9b1a2b2e771157638f39391', startStage: 1 },
  { id: 'gaimin', name: 'Gaimin Gladiators', shortName: 'GG', color: '#cc0000', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/HrY6zn_9ibpsasa9cv1PQk.png?ixlib=java-2.1.0&w=50&s=dbf1a8d450da34dfc07199ba382d97d5', startStage: 1 },
  { id: 'mibr', name: 'MIBR', shortName: 'MIBR', color: '#0000ff', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/m_JQ624LNFHWiUY-25uuaE.png?ixlib=java-2.1.0&w=50&s=80a1e479dd1b15b974d3e2d5588763af', startStage: 1 },
  { id: 'liquid', name: 'Team Liquid', shortName: 'TL', color: '#0f1d2c', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/JMeLLbWKCIEJrmfPaqOz4O.svg?ixlib=java-2.1.0&s=c02caf90234d3a3ebac074c84ba1ea62', startStage: 1 },
  { id: 'tyloo', name: 'TYLOO', shortName: 'TYL', color: '#ff0000', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/hMPKtNMDxp07n3lrBEHCuq.svg?ixlib=java-2.1.0&s=6d22fc4af07d0cd9d31fcd7f3023af9a', startStage: 1 },
  { id: 'lynn', name: 'Lynn Vision Gaming (LVG)', shortName: 'LVG', color: '#aaaaaa', textColor: '#000000', logo: 'https://img-cdn.hltv.org/teamlogo/DPcHT21uWwK1hDD_3txlL9.png?ixlib=java-2.1.0&w=50&s=4b5d5a187f00caf9bbae2d0fcbca6ff6', startStage: 1 },
  { id: 'thunder', name: 'THUNDER dOWNUNDER', shortName: 'TDU', color: '#ff00ff', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/bSRhbVtvK3S64DVmh5XIgi.png?ixlib=java-2.1.0&w=50&s=83a402b5b6e8c40009d10e796645e479', startStage: 1 },
  { id: 'flyquest', name: 'FlyQuest', shortName: 'FLY', color: '#00cc00', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/fmqTgF6Ziw0uied7MO3_ri.png?ixlib=java-2.1.0&w=50&s=255b5a4c460ad03161509ff7eb77b2dc', startStage: 1 },
  
  // TBD Placeholder
  { id: 'tbd', name: 'TBD', shortName: 'TBD', color: '#1e1e1e', textColor: '#888888', logo: '', startStage: 0 }
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

export const PLAYOFFS_SLOTS: PickSlot[] = [
  { id: 'qf-1', type: 'qf', teamId: null },
  { id: 'qf-2', type: 'qf', teamId: null },
  { id: 'qf-3', type: 'qf', teamId: null },
  { id: 'qf-4', type: 'qf', teamId: null },
  { id: 'qf-5', type: 'qf', teamId: null },
  { id: 'qf-6', type: 'qf', teamId: null },
  { id: 'qf-7', type: 'qf', teamId: null },
  { id: 'qf-8', type: 'qf', teamId: null },
  { id: 'sf-1', type: 'sf', teamId: null },
  { id: 'sf-2', type: 'sf', teamId: null },
  { id: 'sf-3', type: 'sf', teamId: null },
  { id: 'sf-4', type: 'sf', teamId: null },
  { id: 'final-1', type: 'final', teamId: null },
  { id: 'final-2', type: 'final', teamId: null },
  { id: 'champion', type: 'champion', teamId: null }
];
