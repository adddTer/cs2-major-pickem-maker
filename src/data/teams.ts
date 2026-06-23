import { Team, PickSlot } from '../types';
import { LOCAL_POINTS } from './localPoints';

const INITIAL_TEAMS: Team[] = [
  // Stage 3 Teams
  { id: 'vitality', name: 'Team Vitality', shortName: 'VIT', color: '#f3e700', textColor: '#000000', logo: 'https://img-cdn.hltv.org/teamlogo/yeXBldn9w8LZCgdElAenPs.png?ixlib=java-2.1.0&w=50&s=15eaba0b75250065d20162d2cb05e3e6', startStage: 3 },
  { id: 'navi', name: 'Natus Vincere', shortName: 'NAVI', color: '#ffea00', textColor: '#000000', logo: 'https://img-cdn.hltv.org/teamlogo/9iMirAi7ArBLNU8p3kqUTZ.svg?ixlib=java-2.1.0&s=4dd8635be16122656093ae9884675d0c', startStage: 3 },
  { id: 'parivision', name: 'PARIVISION', shortName: 'PV', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/MFcDe-M8wfGOUU6x4sRELR.png?ixlib=java-2.1.0&w=50&s=1d91076a58b354d8c3eaeda3162c292e', startStage: 3 },
  { id: 'aurora', name: 'Aurora', shortName: 'AUR', color: '#0055ff', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/yJzPNOeXlyiniNxanYJCrv.png?ixlib=java-2.1.0&w=50&s=2c08f70c2f2f8c2024a438ddcf19bbf1', startStage: 3 },
  { id: 'falcons', name: 'Team Falcons', shortName: 'FLC', color: '#00cc00', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/4eJSkDQINNM6Tbs4WvLzkN.png?ixlib=java-2.1.0&w=50&s=d8c857ea47046f61eca695beab0d12ef', startStage: 3 },
  { id: 'mouz', name: 'MOUZ', shortName: 'MOUZ', color: '#d31027', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/IejtXpquZnE8KqYPB1LNKw.svg?ixlib=java-2.1.0&s=7fd33b8def053fbfd8fdbb58e3bdcd3c', startStage: 3 },
  { id: 'furia', name: 'FURIA', shortName: 'FUR', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/mvNQc4csFGtxXk5guAh8m1.svg?ixlib=java-2.1.0&s=11e5056829ad5d6c06c5961bbe76d20c', startStage: 3 },
  { id: 'mongolz', name: 'The MongolZ', shortName: 'MGLZ', color: '#b92429', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/bRk2sh_tSTO6fq1GLhgcal.png?ixlib=java-2.1.0&w=50&s=8b08e53858eb817852ae74b30a30151d', startStage: 3 },

  // Stage 2 Teams
  { id: 'spirit', name: 'Team Spirit', shortName: 'TS', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/ywdn4tmAvXfllLeV2SkkvF.png?ixlib=java-2.1.0&w=50&s=9c70c7fbb048348f70f686acd2369c58', startStage: 2 },
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
  { id: 'heroic', name: 'HEROIC', shortName: 'HERO', color: '#ed1b24', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/4S22uk_gnZTiQiI-hhH4yp.png?ixlib=java-2.1.0&w=50&s=3619ddf1d490573ab3dc261b8c2f3f6f', startStage: 1 },
  { id: 'sinners', name: 'SINNERS', shortName: 'SIN', color: '#ff0000', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/9l_WdQSU9JsNHzpK-pwOG2.svg?ixlib=java-2.1.0&s=af432c3ef61c0c843331cc0dc2fed1ed', startStage: 1 },
  { id: 'm80', name: 'M80', shortName: 'M80', color: '#333333', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/YsaWwP_VrkbHzuhszuANEK.png?ixlib=java-2.1.0&w=50&s=47a8cff375da8242af9137a2a592b97d', startStage: 1 },
  { id: 'nrg', name: 'NRG', shortName: 'NRG', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/SJZaPBCyZssru-pUDS3aZe.png?ixlib=java-2.1.0&w=50&s=5f4ca255d90b4ea7092882834bbf1bdc', startStage: 1 },
  { id: 'sharks', name: 'Sharks', shortName: 'SHK', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/xduTwTuydAWc0Dbt-eEjeH.png?ixlib=java-2.1.0&w=50&s=16cdced9e9b1a2b2e771157638f39391', startStage: 1 },
  { id: 'gaimin', name: 'Gaimin Gladiators', shortName: 'GG', color: '#cc0000', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/HrY6zn_9ibpsasa9cv1PQk.png?ixlib=java-2.1.0&w=50&s=dbf1a8d450da34dfc07199ba382d97d5', startStage: 1 },
  { id: 'mibr', name: 'MIBR', shortName: 'MIBR', color: '#0000ff', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/m_JQ624LNFHWiUY-25uuaE.png?ixlib=java-2.1.0&w=50&s=80a1e479dd1b15b974d3e2d5588763af', startStage: 1 },
  { id: 'liquid', name: 'Team Liquid', shortName: 'TL', color: '#0f1d2c', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/JMeLLbWKCIEJrmfPaqOz4O.svg?ixlib=java-2.1.0&s=c02caf90234d3a3ebac074c84ba1ea62', startStage: 1 },
  { id: 'tyloo', name: 'TYLOO', shortName: 'TYLOO', color: '#ff0000', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/hMPKtNMDxp07n3lrBEHCuq.svg?ixlib=java-2.1.0&s=6d22fc4af07d0cd9d31fcd7f3023af9a', startStage: 1 },
  { id: 'lynn', name: 'Lynn Vision Gaming', shortName: 'LVG', color: '#aaaaaa', textColor: '#000000', logo: 'https://img-cdn.hltv.org/teamlogo/DPcHT21uWwK1hDD_3txlL9.png?ixlib=java-2.1.0&w=50&s=4b5d5a187f00caf9bbae2d0fcbca6ff6', startStage: 1 },
  { id: 'thunder', name: 'THUNDER dOWNUNDER', shortName: 'TDU', color: '#ff00ff', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/bSRhbVtvK3S64DVmh5XIgi.png?ixlib=java-2.1.0&w=50&s=83a402b5b6e8c40009d10e796645e479', startStage: 1 },
  { id: 'flyquest', name: 'FlyQuest', shortName: 'FQ', color: '#00cc00', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/fmqTgF6Ziw0uied7MO3_ri.png?ixlib=java-2.1.0&w=50&s=255b5a4c460ad03161509ff7eb77b2dc', startStage: 1 },
  
  // Extra Historic Teams
  { id: 'faze', name: 'FaZe', shortName: 'FaZe', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/Ci5ue0CdOwnUeY9RgMt7Km.png?ixlib=java-2.1.0&w=50&s=e38848db8d51b36086f19a3cbca6c308', startStage: 0 },
  { id: 'virtuspro', name: 'Virtus.pro', shortName: 'VP', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/yZ6Bpuui1rW3jocXQ68XgZ.svg?ixlib=java-2.1.0&s=f39be1d3e7baf30a4e7f0b1216720875', startStage: 0 },
  { id: 'fnatic', name: 'fnatic', shortName: 'FNC', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/dLtWEdSV58lIX1amAFggy0.svg?ixlib=java-2.1.0&s=f24d0a7b3ef24ed57184a51d35202b4e', startStage: 0 },
  { id: 'nip', name: 'Ninjas in Pyjamas', shortName: 'NIP', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/BSmtTpoXWe5bkSQ1Xk9bBQ.svg?ixlib=java-2.1.0&s=a0edf9bc3edb8680461c858fa21fe7fe', startStage: 0 },
  { id: 'ence', name: 'ENCE', shortName: 'ENCE', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/-X8NoyWC_1gYqUHvZqcpkc.svg?ixlib=java-2.1.0&s=85bb9daa6f846fa097c5942f2565fdb8', startStage: 0 },
  { id: 'cloud9', name: 'Cloud9', shortName: 'C9', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/bEgST6XoNV4ZdenRKzCQyl.svg?ixlib=java-2.1.0&s=bd9b10a8dfe7b3640103745687389e3c', startStage: 0 },
  { id: 'complexity', name: 'compLexity Gaming', shortName: 'COL', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/0-i_bEjrf3v4eYqaG0Bix7.svg?ixlib=java-2.1.0&s=4eecbec277f018772a9b92c22da1a459', startStage: 0 },
  { id: 'outsiders', name: 'Outsiders', shortName: 'OUT', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/K15IzjKuVPxnoWr3J3-tJ7.png?ixlib=java-2.1.0&w=50&s=d87bd1cf1f3835f152b363eecd95e3fe', startStage: 0 },
  { id: 'avangar', name: 'AVANGAR', shortName: 'AVANGAR', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/8e89ldxOWak25k-LB7oYH3.svg?ixlib=java-2.1.0&s=790dbc237699c461a1b6b3c837aa7e1d', startStage: 0 },
  { id: 'immortals', name: 'Immortals', shortName: 'IMT', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/u-cFwmfjahGRj6GNcpPR5u.svg?ixlib=java-2.1.0&s=b4015788e62cb071f58e574e3d58ebe1', startStage: 0 },
  { id: 'gambit', name: 'Gambit', shortName: 'GMB', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/qMND-GUX-E-Xc-hBQs1AZZ.svg?ixlib=java-2.1.0&s=6787eb2e88b321814f7c2cbaff8a2138', startStage: 0 },
  { id: 'envyus', name: 'EnVyUs', shortName: 'nV', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/QCiBDngzUGklkmTWjOLJc0.svg?ixlib=java-2.1.0&s=e2902a70f02f0eb0c8ec49d1f7514c19', startStage: 0 },
  { id: 'ldlc', name: 'LDLC', shortName: 'LDLC', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/QCiBDngzUGklkmTWjOLJc0.svg?ixlib=java-2.1.0&s=e2902a70f02f0eb0c8ec49d1f7514c19', startStage: 0 },
  { id: 'dignitas', name: 'Dignitas', shortName: 'DIG', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/MNnqkBZ0sI7QjUf2dXAtnN.svg?ixlib=java-2.1.0&s=2d927191151c15d9c174a536b471fdd6', startStage: 0 },
  { id: 'hellraisers', name: 'HellRaisers', shortName: 'HR', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/KIzoa683-B4-yyfvpPYJKu.svg?ixlib=java-2.1.0&s=196d6e449406355a3665cdfdc6e15b41', startStage: 0 },
  { id: 'skgaming', name: 'SK Gaming', shortName: 'SK', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/BwZh5NvZ8Do1lX6ejFB08_.svg?invert=true&ixlib=java-2.1.0&sat=-100&s=274e92f39370f439958cf2ceae267eca', startStage: 0 },
  { id: 'luminosity', name: 'Luminosity', shortName: 'LG', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/KIzoa683-B4-yyfvpPYJKu.svg?ixlib=java-2.1.0&s=196d6e449406355a3665cdfdc6e15b41', startStage: 0 },
  { id: 'north', name: 'North', shortName: 'North', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/YAkfXXu_VhFVsOoATpff0A.svg?ixlib=java-2.1.0&s=5803a5e72e30b6ab7a46588ea6d17778', startStage: 0 },
  { id: 'verygames', name: 'VeryGames', shortName: 'VG', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/QCiBDngzUGklkmTWjOLJc0.svg?ixlib=java-2.1.0&s=e2902a70f02f0eb0c8ec49d1f7514c19', startStage: 0 },
  { id: 'lgb', name: 'LGB', shortName: 'LGB', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/qMND-GUX-E-Xc-hBQs1AZZ.svg?ixlib=java-2.1.0&s=6787eb2e88b321814f7c2cbaff8a2138', startStage: 0 },
  { id: 'cphwolves', name: 'CPH Wolves', shortName: 'CPHW', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/YAkfXXu_VhFVsOoATpff0A.svg?ixlib=java-2.1.0&s=5803a5e72e30b6ab7a46588ea6d17778', startStage: 0 },
  { id: 'astanadragons', name: 'Astana Dragons', shortName: 'AD', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/Wy3oFp867BXd_r4G-A81gB.png?ixlib=java-2.1.0&w=50&s=d5832b9dea274c32add50a3b8230187a', startStage: 0 },
  { id: 'ibuypower', name: 'iBUYPOWER', shortName: 'iBP', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/KIzoa683-B4-yyfvpPYJKu.svg?ixlib=java-2.1.0&s=196d6e449406355a3665cdfdc6e15b41', startStage: 0 },
  { id: 'reason', name: 'Reason Gaming', shortName: 'RSN', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/MNnqkBZ0sI7QjUf2dXAtnN.svg?ixlib=java-2.1.0&s=2d927191151c15d9c174a536b471fdd6', startStage: 0 },
  { id: 'apeks', name: 'Apeks', shortName: 'Apeks', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/IBGw2qcLFA7xL1Ju9HwJpe.png?ixlib=java-2.1.0&w=100&s=3e236a12c7f5d2e843553c284b5f275d', startStage: 0 },
  { id: 'eternalfire', name: 'Eternal Fire', shortName: 'EF', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/Tafdq71X3B_-73b73bAixr.png?ixlib=java-2.1.0&w=50&s=f1505e0f7e03bed0d0d2b4c809768198', startStage: 0 },
  { id: 'penta', name: 'PENTA', shortName: 'PENTA', color: '#2a2a2a', textColor: '#ffffff', logo: 'https://www.hltv.org/dynamic-svg/teamplaceholder?letter=P', startStage: 0 },
  { id: 'epsilon', name: 'Epsilon', shortName: 'EPS', color: '#5b8aab', textColor: '#ffffff', logo: 'https://www.hltv.org/dynamic-svg/teamplaceholder?letter=E', startStage: 0 },
  { id: 'flipsid3', name: 'FlipSid3 Tactics', shortName: 'F3', color: '#00cc00', textColor: '#ffffff', logo: 'https://www.hltv.org/dynamic-svg/teamplaceholder?letter=F', startStage: 0 },
  { id: 'tsm', name: 'TSM', shortName: 'TSM', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://www.hltv.org/dynamic-svg/teamplaceholder?letter=T', startStage: 0 },
  { id: 'kinguin', name: 'Kinguin', shortName: 'Kinguin', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://www.hltv.org/dynamic-svg/teamplaceholder?letter=K', startStage: 0 },
  { id: 'clg', name: 'Counter Logic Gaming', shortName: 'CLG', color: '#0055ff', textColor: '#ffffff', logo: 'https://www.hltv.org/dynamic-svg/teamplaceholder?letter=C', startStage: 0 },
  { id: 'recursive', name: 'Recursive', shortName: 'REC', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://www.hltv.org/dynamic-svg/teamplaceholder?letter=R', startStage: 0 },
  { id: 'intothebreach', name: 'Into The Breach', shortName: 'ITB', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/Tgyea9TVbc37YisEY4Y13a.png?ixlib=java-2.1.0&w=100&s=27b9deb8268e152ea71385525d47e36f', startStage: 0 },
  { id: 'cphflames', name: 'CPH Flames', shortName: 'CPHF', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/YAkfXXu_VhFVsOoATpff0A.svg?ixlib=java-2.1.0&s=5803a5e72e30b6ab7a46588ea6d17778', startStage: 0 },
  { id: 'qbf', name: 'Quantum Bellator Fire', shortName: 'QBF', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/4Ug3V2qj6Nv_YXXPNGqLF3.svg?ixlib=java-2.1.0&s=681878e4a7f78c93233ed247202f9124', startStage: 0 },
  { id: 'renegades', name: 'Renegades', shortName: 'RNG', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/KN-bogp5T6YcaAbR-8QuaG.svg?ixlib=java-2.1.0&s=30510c644332be4cf0b93e4df7e9afa5', startStage: 0 },
  { id: 'keydstars', name: 'Keyd Stars', shortName: 'Keyd', color: '#1a1a1a', textColor: '#ffffff', logo: 'https://img-cdn.hltv.org/teamlogo/m-SA9fWSyBqRgsrDCDXCId.png?ixlib=java-2.1.0&w=50&s=5e9b55327740978fb8f425c27d2ba70a', startStage: 0 },
  
  // TBD Placeholder
  { id: 'tbd', name: '待定', shortName: 'TBD', color: '#1e1e1e', textColor: '#888888', logo: '', startStage: 0 }
];

export const TEAMS: Team[] = INITIAL_TEAMS.map(t => {
  const local = LOCAL_POINTS[t.id];
  if (local) {
    return {
      ...t,
      valveRank: local.vRank,
      valvePoints: local.vPoints,
      hltvRank: local.hRank,
      hltvPoints: local.hPoints,
      strength: ((local.vPoints / 2) * 0.4) + (local.hPoints * 0.6)
    };
  }
  return t;
});

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
