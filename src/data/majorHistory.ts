export interface MajorResult {
  game: "CS:GO" | "CS2";
  year: number;
  name: string;
  date: string;
  location: string;
  champion: string;
  runnerUp: string;
  thirdFourth: string[];
  fifthEighth: string[];
}

export const MAJOR_HISTORY: MajorResult[] = [
  {
    game: "CS2",
    year: 2026,
    name: "IEM Cologne Major 2026",
    date: "2026-06-08 ~ 06-21",
    location: "德国，科隆",
    champion: "Falcons",
    runnerUp: "FURIA",
    thirdFourth: ["Spirit", "Aurora"],
    fifthEighth: ["G2", "Vitality", "9z", "BetBoom"]
  },
  {
    game: "CS2",
    year: 2025,
    name: "StarLadder Budapest Major 2025",
    date: "2025-11-24 ~ 12-14",
    location: "匈牙利，布达佩斯",
    champion: "Vitality",
    runnerUp: "FaZe",
    thirdFourth: ["NaVi", "Spirit"],
    fifthEighth: ["FURIA", "MOUZ", "The MongolZ", "Falcons"]
  },
  {
    game: "CS2",
    year: 2025,
    name: "BLAST.tv Austin Major 2025",
    date: "2025-06-03 ~ 06-15",
    location: "美国，奥斯汀",
    champion: "Vitality",
    runnerUp: "The MongolZ",
    thirdFourth: ["MOUZ", "paiN"],
    fifthEighth: ["Spirit", "NaVi", "FaZe", "FURIA"]
  },
  {
    game: "CS2",
    year: 2024,
    name: "Perfect World Shanghai Major 2024",
    date: "2024-11-30 ~ 12-15",
    location: "中国，上海",
    champion: "Spirit",
    runnerUp: "FaZe",
    thirdFourth: ["MOUZ", "G2"],
    fifthEighth: ["The MongolZ", "Liquid", "Heroic", "Vitality"]
  },
  {
    game: "CS2",
    year: 2024,
    name: "PGL Major Copenhagen 2024",
    date: "2024-03-17 ~ 03-31",
    location: "丹麦，哥本哈根",
    champion: "NaVi",
    runnerUp: "FaZe",
    thirdFourth: ["Vitality", "G2"],
    fifthEighth: ["Spirit", "MOUZ", "Eternal Fire", "Cloud9"]
  },
  {
    game: "CS:GO",
    year: 2023,
    name: "BLAST.tv Paris Major 2023",
    date: "2023-05-08 ~ 05-21",
    location: "法国，巴黎",
    champion: "Vitality",
    runnerUp: "GamerLegion",
    thirdFourth: ["Apeks", "Heroic"],
    fifthEighth: ["FaZe", "Liquid", "Monte", "Into The Breach"]
  },
  {
    game: "CS:GO",
    year: 2022,
    name: "IEM Rio Major 2022",
    date: "2022-10-31 ~ 11-13",
    location: "巴西，里约热内卢",
    champion: "Outsiders",
    runnerUp: "Heroic",
    thirdFourth: ["MOUZ", "FURIA"],
    fifthEighth: ["Fnatic", "Spirit", "NaVi", "Cloud9"]
  },
  {
    game: "CS:GO",
    year: 2022,
    name: "PGL Major Antwerp 2022",
    date: "2022-05-09 ~ 05-22",
    location: "比利时，安特卫普",
    champion: "FaZe",
    runnerUp: "NaVi",
    thirdFourth: ["Spirit", "ENCE"],
    fifthEighth: ["NiP", "FURIA", "Heroic", "CPH Flames"]
  },
  {
    game: "CS:GO",
    year: 2021,
    name: "PGL Major Stockholm 2021",
    date: "2021-10-26 ~ 11-07",
    location: "瑞典，斯德哥尔摩",
    champion: "NaVi",
    runnerUp: "G2",
    thirdFourth: ["Heroic", "Gambit"],
    fifthEighth: ["Vitality", "FURIA", "NiP", "Virtus.pro"]
  },
  {
    game: "CS:GO",
    year: 2019,
    name: "StarLadder Major Berlin 2019",
    date: "2019-08-23 ~ 09-08",
    location: "德国，柏林",
    champion: "Astralis",
    runnerUp: "AVANGAR",
    thirdFourth: ["Renegades", "NRG"],
    fifthEighth: ["ENCE", "Vitality", "NaVi", "Liquid"]
  },
  {
    game: "CS:GO",
    year: 2019,
    name: "IEM Katowice Major 2019",
    date: "2019-02-13 ~ 03-03",
    location: "波兰，卡托维兹",
    champion: "Astralis",
    runnerUp: "ENCE",
    thirdFourth: ["NaVi", "MIBR"],
    fifthEighth: ["FaZe", "Liquid", "NiP", "Renegades"]
  },
  {
    game: "CS:GO",
    year: 2018,
    name: "FACEIT Major London 2018",
    date: "2018-09-05 ~ 09-23",
    location: "英国，伦敦",
    champion: "Astralis",
    runnerUp: "NaVi",
    thirdFourth: ["Liquid", "MIBR"],
    fifthEighth: ["BIG", "coL", "FaZe", "HellRaisers"]
  },
  {
    game: "CS:GO",
    year: 2018,
    name: "ELEAGUE Major Boston 2018",
    date: "2018-01-12 ~ 01-28",
    location: "美国，波士顿",
    champion: "Cloud9",
    runnerUp: "FaZe",
    thirdFourth: ["NaVi", "SK Gaming"],
    fifthEighth: ["Fnatic", "G2", "MOUZ", "Quantum Bellator Fire"]
  },
  {
    game: "CS:GO",
    year: 2017,
    name: "PGL Major Kraków 2017",
    date: "2017-07-16 ~ 07-23",
    location: "波兰，克拉科夫",
    champion: "Gambit",
    runnerUp: "Immortals",
    thirdFourth: ["Astralis", "Virtus.pro"],
    fifthEighth: ["Fnatic", "SK Gaming", "BIG", "North"]
  },
  {
    game: "CS:GO",
    year: 2017,
    name: "ELEAGUE Major Atlanta 2017",
    date: "2017-01-22 ~ 01-29",
    location: "美国，亚特兰大",
    champion: "Astralis",
    runnerUp: "Virtus.pro",
    thirdFourth: ["Fnatic", "SK Gaming"],
    fifthEighth: ["NaVi", "Gambit", "North", "FaZe"]
  },
  {
    game: "CS:GO",
    year: 2016,
    name: "ESL One Cologne 2016",
    date: "2016-07-05 ~ 07-10",
    location: "德国，科隆",
    champion: "SK Gaming",
    runnerUp: "Liquid",
    thirdFourth: ["Fnatic", "Virtus.pro"],
    fifthEighth: ["Astralis", "FlipSid3", "NaVi", "Gambit"]
  },
  {
    game: "CS:GO",
    year: 2016,
    name: "MLG Columbus 2016",
    date: "2016-03-29 ~ 04-03",
    location: "美国，哥伦布",
    champion: "Luminosity",
    runnerUp: "NaVi",
    thirdFourth: ["Astralis", "Liquid"],
    fifthEighth: ["NiP", "Fnatic", "CLG", "Virtus.pro"]
  },
  {
    game: "CS:GO",
    year: 2015,
    name: "DreamHack Cluj-Napoca 2015",
    date: "2015-10-28 ~ 11-01",
    location: "罗马尼亚，克卢日-纳波卡",
    champion: "EnVyUs",
    runnerUp: "NaVi",
    thirdFourth: ["NiP", "G2"],
    fifthEighth: ["Fnatic", "Virtus.pro", "TSM", "Luminosity"]
  },
  {
    game: "CS:GO",
    year: 2015,
    name: "ESL One Cologne 2015",
    date: "2015-08-20 ~ 08-23",
    location: "德国，科隆",
    champion: "Fnatic",
    runnerUp: "EnVyUs",
    thirdFourth: ["TSM", "Virtus.pro"],
    fifthEighth: ["NaVi", "NiP", "Kinguin", "Luminosity"]
  },
  {
    game: "CS:GO",
    year: 2015,
    name: "ESL One Katowice 2015",
    date: "2015-03-12 ~ 03-15",
    location: "波兰，卡托维兹",
    champion: "Fnatic",
    runnerUp: "NiP",
    thirdFourth: ["EnVyUs", "Virtus.pro"],
    fifthEighth: ["NaVi", "PENTA", "TSM", "Keyd Stars"]
  },
  {
    game: "CS:GO",
    year: 2014,
    name: "DreamHack Winter 2014",
    date: "2014-11-27 ~ 11-29",
    location: "瑞典，延雪平",
    champion: "LDLC",
    runnerUp: "NiP",
    thirdFourth: ["NaVi", "Virtus.pro"],
    fifthEighth: ["Fnatic", "HellRaisers", "PENTA", "Dignitas"]
  },
  {
    game: "CS:GO",
    year: 2014,
    name: "ESL One Cologne 2014",
    date: "2014-08-14 ~ 08-17",
    location: "德国，科隆",
    champion: "NiP",
    runnerUp: "Fnatic",
    thirdFourth: ["LDLC", "Dignitas"],
    fifthEighth: ["NaVi", "Virtus.pro", "Cloud9", "Epsilon"]
  },
  {
    game: "CS:GO",
    year: 2014,
    name: "EMS One Katowice 2014",
    date: "2014-03-13 ~ 03-16",
    location: "波兰，卡托维兹",
    champion: "Virtus.pro",
    runnerUp: "NiP",
    thirdFourth: ["Dignitas", "LGB"],
    fifthEighth: ["Fnatic", "coL", "HellRaisers", "LDLC"]
  },
  {
    game: "CS:GO",
    year: 2013,
    name: "DreamHack Winter 2013",
    date: "2013-11-28 ~ 11-30",
    location: "瑞典，延雪平",
    champion: "Fnatic",
    runnerUp: "NiP",
    thirdFourth: ["coL", "VG"],
    fifthEighth: ["LGB", "Astana Dragons", "Recursive", "CPH Wolves"]
  }
];
