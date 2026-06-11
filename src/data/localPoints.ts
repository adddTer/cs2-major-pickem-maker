export const LOCAL_POINTS: Record<string, { vRank: number; vPoints: number; hRank: number; hPoints: number }> = {
  vitality: { vRank: 1, vPoints: 2000, hRank: 1, hPoints: 991 },
  spirit: { vRank: 2, vPoints: 1998, hRank: 3, hPoints: 544 },
  falcons: { vRank: 3, vPoints: 1955, hRank: 4, hPoints: 509 },
  navi: { vRank: 4, vPoints: 1937, hRank: 2, hPoints: 712 },
  mouz: { vRank: 5, vPoints: 1863, hRank: 7, hPoints: 301 },
  legacy: { vRank: 6, vPoints: 1835, hRank: 8, hPoints: 297 },
  mongolz: { vRank: 7, vPoints: 1742, hRank: 9, hPoints: 260 },
  fut: { vRank: 8, vPoints: 1739, hRank: 14, hPoints: 190 },
  aurora: { vRank: 9, vPoints: 1717, hRank: 6, hPoints: 354 },
  g2: { vRank: 10, vPoints: 1694, hRank: 13, hPoints: 206 },
  furia: { vRank: 11, vPoints: 1694, hRank: 5, hPoints: 393 },
  "9z": { vRank: 13, vPoints: 1672, hRank: 21, hPoints: 123 },
  betboom: { vRank: 15, vPoints: 1666, hRank: 17, hPoints: 145 },
  parivision: { vRank: 16, vPoints: 1655, hRank: 10, hPoints: 259 },
  b8: { vRank: 17, vPoints: 1638, hRank: 15, hPoints: 179 },
  monte: { vRank: 19, vPoints: 1568, hRank: 22, hPoints: 95 },
  astralis: { vRank: 14, vPoints: 1669, hRank: 12, hPoints: 214 },
  pain: { vRank: 21, vPoints: 1532, hRank: 19, hPoints: 128 },
  gamerlegion: { vRank: 12, vPoints: 1680, hRank: 11, hPoints: 259 },
  big: { vRank: 26, vPoints: 1449, hRank: 30, hPoints: 64 },
  heroic: { vRank: 33, vPoints: 1369, hRank: 29, hPoints: 66 },
  sinners: { vRank: 43, vPoints: 1310, hRank: 33, hPoints: 49 },
  mibr: { vRank: 18, vPoints: 1592, hRank: 20, hPoints: 124 },
  liquid: { vRank: 37, vPoints: 1345, hRank: 26, hPoints: 83 },
  m80: { vRank: 25, vPoints: 1452, hRank: 25, hPoints: 83 },
  nrg: { vRank: 48, vPoints: 1281, hRank: 32, hPoints: 54 },
  sharks: { vRank: 40, vPoints: 1331, hRank: 34, hPoints: 47 },
  gaimin: { vRank: 59, vPoints: 1186, hRank: 128, hPoints: 7 },
  tyloo: { vRank: 22, vPoints: 1479, hRank: 23, hPoints: 91 },
  lynn: { vRank: 27, vPoints: 1438, hRank: 31, hPoints: 56 },
  thunder: { vRank: 58, vPoints: 1188, hRank: 44, hPoints: 23 },
  flyquest: { vRank: 53, vPoints: 1230, hRank: 35, hPoints: 45 }
};

export function getLocalStrength(teamId: string): number | undefined {
  const points = LOCAL_POINTS[teamId];
  if (!points) return undefined;
  return ((points.vPoints / 2) * 0.4) + (points.hPoints * 0.6);
}
