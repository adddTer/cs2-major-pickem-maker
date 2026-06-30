import React, { useState, useEffect, useMemo } from "react";
import { StageKey, MatrixSet, TournamentEvent } from "../types";
import { TEAMS } from "../data/teams";
import { DialogManager, dialog } from "../components/DialogManager";
import { getAllMatrixSets, saveMatrixSet, deleteMatrixSet } from "../lib/db";
import { getLocalStrength } from "../data/localPoints";
import { GLOBAL_SEEDING } from "../data/seedings";
import { PopupUI } from "../components/PopupUI";
import { Trash2, Copy, Plus, Save, Edit2, Menu, X, Calculator } from "lucide-react";
import { cn } from "../lib/utils";
import { TeamLogo } from "../components/TeamLogo";

interface SimulatorViewProps {
  activeStage: StageKey;
  setActiveStage: (stage: StageKey) => void;
  currentMatches: any;
  currentEvent?: TournamentEvent;
}

const getSingleMapProb = (s1: number, s2: number) => {
  const M = 1300;
  return 1 / (1 + Math.pow(10, (s2 - s1) / M));
};

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  activeStage,
  setActiveStage,
  currentMatches,
  currentEvent,
}) => {
  const [matrices, setMatrices] = useState<MatrixSet[]>([]);
  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);
  const [localMatrixData, setLocalMatrixData] = useState<Record<string, Record<string, number>>>({});
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickCreateStrengths, setQuickCreateStrengths] = useState<Record<string, string>>({});
  const [powerWeights, setPowerWeights] = useState({ hltv: 50, vrs: 50 });
  const [numSimulations, setNumSimulations] = useState<number>(100000);

  // Get teams for the active stage
  const stageTeams = useMemo(() => {
    if (activeStage === "playoffs") {
      const playoffsTeams = new Set<string>();
      const pMatches = currentMatches["playoffs"] || {};
      Object.values(pMatches).forEach((round: any) => {
        round.forEach((m: any) => {
          if (m.team1Id && m.team1Id !== "tbd") playoffsTeams.add(m.team1Id);
          if (m.team2Id && m.team2Id !== "tbd") playoffsTeams.add(m.team2Id);
        });
      });
      const arr = Array.from(playoffsTeams);
      if (arr.length > 0) {
        return arr.map(t => TEAMS.find(x => x.id === t)).filter(Boolean) as typeof TEAMS;
      } else {
        // Fallback to stage 3 teams if playoffs hasn't started
        const s3Matches = currentMatches["stage3"];
        if (s3Matches && s3Matches["0:0"]) {
           const s3Teams = new Set<string>();
           s3Matches["0:0"].forEach((m: any) => {
             if (m.team1Id && m.team1Id !== "tbd") s3Teams.add(m.team1Id);
             if (m.team2Id && m.team2Id !== "tbd") s3Teams.add(m.team2Id);
           });
           const s3Arr = Array.from(s3Teams);
           return s3Arr.map(t => TEAMS.find(x => x.id === t)).filter(Boolean) as typeof TEAMS;
        }
      }
      return [];
    }

    const stageMatches = currentMatches[activeStage];
    if (!stageMatches || !stageMatches["0:0"]) return [];
    
    const teamsIn00 = new Set<string>();
    stageMatches["0:0"].forEach((m: any) => {
      if (m.team1Id && m.team1Id !== "tbd") teamsIn00.add(m.team1Id);
      if (m.team2Id && m.team2Id !== "tbd") teamsIn00.add(m.team2Id);
    });
    
    if (teamsIn00.size < 16) return []; // Not determined yet
    const arr = Array.from(teamsIn00);
    // Sort by default seeding
    return arr.map(t => TEAMS.find(x => x.id === t)).filter(Boolean) as typeof TEAMS;
  }, [activeStage, currentMatches]);

  const generateDefaultMatrix = () => {
    const data: Record<string, Record<string, number>> = {};
    if (stageTeams.length === 0) return data;
    
    stageTeams.forEach(t1 => {
      data[t1.id] = {};
      stageTeams.forEach(t2 => {
        if (t1.id === t2.id) {
          data[t1.id][t2.id] = 0;
        } else {
          const s1 = getLocalStrength(t1.id) || 2000 - (GLOBAL_SEEDING[t1.id] || 32) * 30;
          const s2 = getLocalStrength(t2.id) || 2000 - (GLOBAL_SEEDING[t2.id] || 32) * 30;
          data[t1.id][t2.id] = getSingleMapProb(s1, s2);
        }
      });
    });
    return data;
  };

  const loadMatrices = async (forceSelectId?: string) => {
    const all = await getAllMatrixSets(activeStage, currentEvent?.id);
    let defaultSet = all.find(m => m.isDefault);
    if (!defaultSet && (stageTeams.length === 16 || (activeStage === "playoffs" && stageTeams.length >= 2))) {
       // Create it
       defaultSet = {
         id: `default-${activeStage}-${currentEvent?.id || 'iem_cologne_2026'}`,
         eventId: currentEvent?.id || 'iem_cologne_2026',
         name: "系统默认胜率 (VRS/HLTV)",
         stage: activeStage,
         isDefault: true,
         matrix: generateDefaultMatrix(),
         createdAt: Date.now()
       };
       await saveMatrixSet(defaultSet);
       all.push(defaultSet);
    }
    setMatrices(all);
    const selId = forceSelectId || selectedMatrixId;
    if (!selId && all.length > 0) {
      setSelectedMatrixId(all[0].id);
      setLocalMatrixData(JSON.parse(JSON.stringify(all[0].matrix)));
    } else if (selId) {
      const found = all.find(m => m.id === selId);
      if (found) {
        if (forceSelectId) setSelectedMatrixId(found.id);
        setLocalMatrixData(JSON.parse(JSON.stringify(found.matrix)));
      } else if (all.length > 0) {
        setSelectedMatrixId(all[0].id);
        setLocalMatrixData(JSON.parse(JSON.stringify(all[0].matrix)));
      }
    }
  };

  useEffect(() => {
    loadMatrices();
  }, [activeStage, stageTeams, currentEvent?.id]);

  const activeMatrix = matrices.find(m => m.id === selectedMatrixId);

  const handleDuplicate = async (m: MatrixSet) => {
    const defaultName = `${m.name} (副本)`;
    const name = await dialog.prompt("请输入新矩阵名称", defaultName);
    if (!name || !name.trim()) return;

    const newId = `usr-matrix-${Date.now()}`;
    const newSet: MatrixSet = {
      id: newId,
      eventId: currentEvent?.id || 'iem_cologne_2026',
      name: name.trim(),
      stage: activeStage,
      isDefault: false,
      matrix: JSON.parse(JSON.stringify(m.matrix)),
      createdAt: Date.now()
    };
    await saveMatrixSet(newSet);
    await loadMatrices(newId);
  };

  const refreshQuickCreateStrengths = (hltv: number, vrs: number) => {
    const strengths: Record<string, string> = {};
    stageTeams.forEach(t => {
       const defaultStr = getLocalStrength(t.id, hltv / 100, vrs / 100) || 2000 - (GLOBAL_SEEDING[t.id] || 32) * 30;
       strengths[t.id] = String(Math.round(defaultStr));
    });
    setQuickCreateStrengths(strengths);
    setPowerWeights({ hltv, vrs });
  };

  const handleOpenQuickCreate = () => {
    if (activeStage === "playoffs" ? stageTeams.length < 2 : stageTeams.length < 16) return;
    refreshQuickCreateStrengths(powerWeights.hltv, powerWeights.vrs);
    setIsQuickCreateOpen(true);
  };

  const handleQuickCreateSave = async () => {
    const defaultName = `实力换算 - ${new Date().toLocaleDateString()}`;
    const name = await dialog.prompt("请输入新矩阵名称", defaultName);
    if (!name || !name.trim()) return;

    if (activeStage === "playoffs" ? stageTeams.length < 2 : stageTeams.length < 16) return;
    const data: Record<string, Record<string, number>> = {};
    stageTeams.forEach(t1 => {
      data[t1.id] = {};
      stageTeams.forEach(t2 => {
        if (t1.id === t2.id) {
          data[t1.id][t2.id] = 0;
        } else {
          const s1 = quickCreateStrengths[t1.id] ? Number(quickCreateStrengths[t1.id]) : 0;
          const s2 = quickCreateStrengths[t2.id] ? Number(quickCreateStrengths[t2.id]) : 0;
          data[t1.id][t2.id] = getSingleMapProb(s1, s2);
        }
      });
    });

    const newId = `usr-matrix-${Date.now()}`;
    const newSet: MatrixSet = {
       id: newId,
       eventId: currentEvent?.id || 'iem_cologne_2026',
       name: name.trim(),
       stage: activeStage,
       isDefault: false,
       matrix: data,
       createdAt: Date.now()
    };
    await saveMatrixSet(newSet);
    await loadMatrices(newId);
    setIsQuickCreateOpen(false);
  };

  const handleCreateNew = async () => {
    if (activeStage === "playoffs" ? stageTeams.length < 2 : stageTeams.length < 16) return;
    const defaultName = `自定义概率 - ${new Date().toLocaleDateString()}`;
    const name = await dialog.prompt("请输入新矩阵名称", defaultName);
    if (!name || !name.trim()) return;

    const data: Record<string, Record<string, number>> = {};
    stageTeams.forEach(t1 => {
      data[t1.id] = {};
      stageTeams.forEach(t2 => {
         data[t1.id][t2.id] = t1.id === t2.id ? 0 : 0.5; // default to 50/50
      });
    });
    const newId = `usr-matrix-${Date.now()}`;
    const newSet: MatrixSet = {
       id: newId,
       eventId: currentEvent?.id || 'iem_cologne_2026',
       name: name.trim(),
       stage: activeStage,
       isDefault: false,
       matrix: data,
       createdAt: Date.now()
    };
    await saveMatrixSet(newSet);
    await loadMatrices(newId);
  };

  const handleRename = async (m: MatrixSet) => {
    const name = await dialog.prompt("请输入新的名称", m.name);
    if (name && name.trim()) {
      m.name = name.trim();
      await saveMatrixSet(m);
      await loadMatrices();
    }
  };

  const handleDelete = async (m: MatrixSet) => {
    const confirm = await dialog.confirm(`确定要删除矩阵 "${m.name}" 吗？`);
    if (!confirm) return;

    await deleteMatrixSet(m.id);
    if (selectedMatrixId === m.id) {
       setSelectedMatrixId(null);
    }
    await loadMatrices();
  };

  const handleSaveLocal = async () => {
    if (!activeMatrix) return;
    const updated = { ...activeMatrix, matrix: localMatrixData };
    await saveMatrixSet(updated);
    dialog.alert("矩阵已保存到本地！");
    await loadMatrices();
  };

  const [editVal, setEditVal] = useState<{ r: string; c: string; val: string } | null>(null);

  const onCellChange = (t1Id: string, t2Id: string, val: string) => {
    if (!activeMatrix) return;
    if (val === "") {
       setEditVal({ r: t1Id, c: t2Id, val });
       return;
    }
    let num = parseFloat(val);
    if (isNaN(num)) return;
    num = Math.max(0, Math.min(100, num)); // percentage
    
    setEditVal({ r: t1Id, c: t2Id, val });
    setLocalMatrixData(prev => {
      const next = { ...prev };
      if (!next[t1Id]) next[t1Id] = {};
      if (!next[t2Id]) next[t2Id] = {};
      next[t1Id][t2Id] = num / 100;
      next[t2Id][t1Id] = 1 - (num / 100);
      return next;
    });
  };

  const getDisplayVal = (r: string, c: string, prob: number) => {
     if (editVal && editVal.r === r && editVal.c === c) return editVal.val;
     return Math.round(prob * 100).toString() + "%";
  };

  if (activeStage === "playoffs" && stageTeams.length < 2) {
    return <div className="p-8 text-center text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">决胜阶段队伍尚未产生，无法进行推演。</div>;
  }

  if (activeStage !== "playoffs" && stageTeams.length < 16) {
    return <div className="p-8 text-center text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">该阶段当前首轮对阵未完全确定，无法进行推演。</div>;
  }

  const [aiPickemState, setAiPickemState] = useState<{ isGenerating: boolean, progress: number, phase: string, result: any | null, activeCandidateIndex: number, resultTab: 'candidates' | 'probabilities' }>({
    isGenerating: false, progress: 0, phase: '', result: null, activeCandidateIndex: 0, resultTab: 'candidates'
  });

  const handleAIPickem = () => {
    if (!activeMatrix) return;
    
    if (activeStage === "playoffs") {
      const pm = currentMatches['playoffs'] || {};
      const qm = pm['qf'] || [];
      const hasPlayoffsTeams = qm.some((m: any) => m.team1Id && m.team1Id !== 'tbd' && m.team2Id && m.team2Id !== 'tbd');
      
      if (!hasPlayoffsTeams) {
        dialog.alert("决胜阶段对阵尚未确定，无法进行推演。请在淘汰赛对阵出炉后再尝试。");
        return;
      }

      setAiPickemState({ isGenerating: true, progress: 0, phase: 'simulating', result: null });
      
      const getProb = (t1: string, t2: string) => {
        return activeMatrix.matrix[t1]?.[t2] ?? 0.5;
      };
      
      const teams = [
        qm[0]?.team1Id, qm[0]?.team2Id,
        qm[1]?.team1Id, qm[1]?.team2Id,
        qm[2]?.team1Id, qm[2]?.team2Id,
        qm[3]?.team1Id, qm[3]?.team2Id,
      ];
      
      // Calculate exact probabilities
      const teamProbabilities: Record<string, any> = {};
      teams.forEach(t => {
        if (t && t !== 'tbd') {
           teamProbabilities[t] = { pSF: 0, pFinal: 0, pChamp: 0 };
        }
      });
      
      let allBrackets = [];
      
      const getP = (t1: string, t2: string) => {
         if (!t1 || t1 === 'tbd') return 0;
         if (!t2 || t2 === 'tbd') return 1;
         return getProb(t1, t2);
      };

      for(let i=0; i<128; i++) {
         let w0 = (i & 1) ? teams[0] : teams[1];
         let w1 = (i & 2) ? teams[2] : teams[3];
         let w2 = (i & 4) ? teams[4] : teams[5];
         let w3 = (i & 8) ? teams[6] : teams[7];
         let ws0 = (i & 16) ? w0 : w1;
         let ws1 = (i & 32) ? w2 : w3;
         let champ = (i & 64) ? ws0 : ws1;
         
         if (!w0 || !w1 || !w2 || !w3 || !ws0 || !ws1 || !champ || w0 === 'tbd' || w1 === 'tbd' || w2 === 'tbd' || w3 === 'tbd' || ws0 === 'tbd' || ws1 === 'tbd' || champ === 'tbd') continue;
         
         let p = 1.0;
         p *= (i & 1) ? getP(teams[0], teams[1]) : getP(teams[1], teams[0]);
         p *= (i & 2) ? getP(teams[2], teams[3]) : getP(teams[3], teams[2]);
         p *= (i & 4) ? getP(teams[4], teams[5]) : getP(teams[5], teams[4]);
         p *= (i & 8) ? getP(teams[6], teams[7]) : getP(teams[7], teams[6]);
         p *= (i & 16) ? getP(w0, w1) : getP(w1, w0);
         p *= (i & 32) ? getP(w2, w3) : getP(w3, w2);
         p *= (i & 64) ? getP(ws0, ws1) : getP(ws1, ws0);
         
         allBrackets.push({
            tQFW: [w0, w1, w2, w3],
            tSFW: [ws0, ws1],
            tChamp: champ,
            score: p,
            p1: 0, p2: 0, p3: 0, sortScore: 0
         });
      }
      
      allBrackets.forEach(c => {
         let p1 = 0, p2 = 0, p3 = 0;
         allBrackets.forEach(o => {
            let qfCorrect = c.tQFW.filter((t: string) => o.tQFW.includes(t)).length;
            let sfCorrect = c.tSFW.filter((t: string) => o.tSFW.includes(t)).length;
            let champCorrect = c.tChamp === o.tChamp ? 1 : 0;
            
            let goals = 0;
            if (qfCorrect >= 2) goals++;
            if (sfCorrect >= 1) goals++;
            if (champCorrect) goals++;
            
            if (goals === 1) p1 += o.score;
            else if (goals === 2) p2 += o.score;
            else if (goals === 3) p3 += o.score;
         });
         c.p1 = p1;
         c.p2 = p2;
         c.p3 = p3;
         c.sortScore = p3 * 10000 + p2 * 100 + p1;
      });
      
      allBrackets.sort((a, b) => b.sortScore - a.sortScore);
      let candidates = allBrackets.slice(0, 5);
      
      // Calculate exact team probabilities by marginalizing over brackets
      allBrackets.forEach(b => {
         b.tQFW.forEach(t => { teamProbabilities[t].pSF += b.score; });
         b.tSFW.forEach(t => { teamProbabilities[t].pFinal += b.score; });
         teamProbabilities[b.tChamp].pChamp += b.score;
      });

      setTimeout(() => {
        setAiPickemState({
          isGenerating: false,
          progress: 100,
          phase: 'done',
          result: { type: 'playoffs', candidates, teamProbabilities },
          activeCandidateIndex: 0,
          resultTab: 'candidates'
        });
      }, 500);
      return;
    }

    setAiPickemState({ isGenerating: true, progress: 0, phase: 'simulating', result: null });
    
    const stageMatchesMap = currentMatches[activeStage];
    const r0 = stageMatchesMap["0:0"] || [];
    const orderedTeams = new Array(16).fill("");
    r0.forEach((m: any, idx: number) => {
      if (m.team1Id && m.team1Id !== "tbd") orderedTeams[idx] = m.team1Id;
      if (m.team2Id && m.team2Id !== "tbd") orderedTeams[15 - idx] = m.team2Id;
    });
    let allTeams = orderedTeams.filter((t) => t !== "");
    if (allTeams.length < 16) allTeams = stageTeams.map(t => t.id);

    const pastMatches: any[] = [];
    const scheduledMatches: { t1: string; t2: string }[] = [];

    if (stageMatchesMap && stageMatchesMap["0:0"]) {
      stageMatchesMap["0:0"].forEach((m: any) => {
        if (m.team1Id && m.team2Id && m.team1Id !== "tbd" && m.team2Id !== "tbd") {
          scheduledMatches.push({ t1: m.team1Id, t2: m.team2Id });
        }
      });
    }

    const w = new Worker(new URL('../workers/calcBestPickemWorker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e) => {
      if (e.data.type === 'progress') {
        setAiPickemState(prev => ({ ...prev, progress: e.data.progress, phase: e.data.phase }));
      } else if (e.data.type === 'done') {
        setAiPickemState(prev => ({ ...prev, isGenerating: false, result: e.data.result, activeCandidateIndex: 0, resultTab: 'candidates' }));
        w.terminate();
      }
    };

    w.postMessage({
      allTeams,
      pastMatches,
      scheduledMatches,
      numSimulations,
      activeStage,
      customMatrix: activeMatrix.matrix,
      isSwissAllBo3: currentEvent?.isSwissAllBo3
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-sm relative z-20">
      <div className="flex items-center justify-center gap-2 py-4 shrink-0 z-10 w-full bg-transparent overflow-x-auto hide-scrollbar">
        <div className="flex p-1.5 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-black/5 dark:border-white/5 shadow-sm max-w-full">
          {[
            { id: "stage1", label: "第一阶段" },
            { id: "stage2", label: "第二阶段" },
            { id: "stage3", label: "第三阶段" },
            { id: "playoffs", label: "决胜阶段" },
          ].map((tab) => {
            const isActive = activeStage === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStage(tab.id as StageKey)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[0.8125rem] font-display font-bold cursor-pointer transition-all duration-300 flex items-center whitespace-nowrap",
                  isActive
                    ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-black/5 dark:ring-white/10"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative px-2 sm:px-4 pb-4">
        <div className="w-full h-full flex flex-row overflow-hidden bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm relative">
          
          {/* Sidebar - Desktop & Mobile Drawer */}
          <div className={cn(
            "absolute inset-y-0 left-0 z-50 w-64 md:w-56 border-r border-black/5 dark:border-white/5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 rounded-l-[2rem] md:rounded-l-[2rem]",
            showMobileMenu ? "translate-x-0 shadow-2xl" : "-translate-x-full md:shadow-none"
          )}>
          <div className="p-4 border-b border-black/5 dark:border-white/5 shrink-0 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <h2 className="font-bold text-zinc-800 dark:text-zinc-300">概率矩阵</h2>
             </div>
             <div className="flex items-center gap-1">
               <button onClick={handleOpenQuickCreate} className="p-1 hover:bg-black/10 dark:bg-white/10 rounded text-sky-400" title="修改实力来快速创建矩阵">
                 <Calculator className="w-4 h-4" />
               </button>
               <button onClick={handleCreateNew} className="p-1 hover:bg-black/10 dark:bg-white/10 rounded text-emerald-400" title="新建纯空白矩阵">
                 <Plus className="w-4 h-4" />
               </button>
               <button onClick={() => setShowMobileMenu(false)} className="md:hidden p-1 hover:bg-black/10 dark:bg-white/10 rounded text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 ml-1">
                 <X className="w-4 h-4" />
               </button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {matrices.map(m => (
              <div 
                key={m.id} 
                className={cn(
                  "p-2 rounded cursor-pointer group flex items-center justify-between text-xs",
                  selectedMatrixId === m.id ? "bg-white dark:bg-zinc-800 text-black dark:text-white" : "hover:bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-600 dark:text-zinc-400"
                )}
                onClick={() => {
                   setSelectedMatrixId(m.id);
                   setLocalMatrixData(JSON.parse(JSON.stringify(m.matrix)));
                   setShowMobileMenu(false);
                }}
              >
                <span className="truncate flex-1" title={m.name}>{m.name}</span>
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                   <button onClick={(e) => { e.stopPropagation(); handleDuplicate(m); }} className="p-1.5 md:p-1 hover:text-emerald-600 dark:hover:text-emerald-400 bg-zinc-200/20 dark:bg-black/20 rounded md:bg-transparent" title="复制">
                      <Copy className="w-3.5 h-3.5" />
                   </button>
                   {!m.isDefault && (
                     <>
                     <button onClick={(e) => { e.stopPropagation(); handleRename(m); }} className="p-1.5 md:p-1 hover:text-blue-600 dark:hover:text-blue-400 bg-zinc-200/20 dark:bg-black/20 rounded md:bg-transparent" title="重命名">
                        <Edit2 className="w-3.5 h-3.5" />
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); handleDelete(m); }} className="p-1.5 md:p-1 hover:text-rose-600 dark:hover:text-rose-400 bg-zinc-200/20 dark:bg-black/20 rounded md:bg-transparent" title="删除">
                        <Trash2 className="w-3.5 h-3.5" />
                     </button>
                     </>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Mobile menu backdrop */}
        {showMobileMenu && (
          <div 
            className="absolute inset-0 z-40 bg-zinc-200/50 dark:bg-black/50 md:hidden" 
            onClick={() => setShowMobileMenu(false)} 
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-transparent overflow-hidden relative">
          {activeMatrix ? (
             <div className="flex flex-col h-full p-4 relative z-20">
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 shrink-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 max-w-full">
                       <button onClick={() => setShowMobileMenu(true)} className="md:hidden p-2 -ml-2 hover:bg-black/10 dark:bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                         <Menu className="w-5 h-5 text-zinc-800 dark:text-zinc-300" />
                       </button>
                       <h1 className="text-lg md:text-xl font-display font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3 truncate">
                         {activeMatrix.name}
                         {activeMatrix.isDefault && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[0.625rem] rounded border border-blue-500/20 shrink-0 font-medium">系统预设</span>}
                       </h1>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 shrink-0 bg-white/60 dark:bg-black/40 p-1.5 rounded-2xl border border-black/5 dark:border-white/5 backdrop-blur-sm">
                    {activeStage !== 'playoffs' && (
                      <select 
                        value={numSimulations} 
                        onChange={(e) => setNumSimulations(Number(e.target.value))}
                        disabled={aiPickemState.isGenerating}
                        className="bg-transparent border-none outline-none text-xs text-zinc-600 dark:text-zinc-300 px-2 py-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 font-medium"
                      >
                        <option value={10000}>1万次推演</option>
                        <option value={50000}>5万次推演</option>
                        <option value={100000}>10万次推演</option>
                        <option value={200000}>20万次推演</option>
                        <option value={500000}>50万次推演</option>
                      </select>
                    )}
                    <button onClick={handleAIPickem} disabled={aiPickemState.isGenerating} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-wait text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0">
                       <Calculator className="w-4 h-4" />
                       {aiPickemState.isGenerating ? "计算中..." : "推演最优作业"}
                    </button>
                    <button onClick={handleSaveLocal} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-white text-white dark:text-black rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0">
                       <Save className="w-4 h-4" />
                       保存修改
                    </button>
                  </div>
               </div>

               <div className="flex-1 overflow-auto rounded-2xl bg-white/60 dark:bg-zinc-950/60 custom-scrollbar border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner">
                 <table className="w-full text-center border-collapse min-w-max text-[13px]">
                   <thead className="sticky top-0 z-20 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                     <tr>
                       <th className="w-16 min-w-[64px] md:w-20 md:min-w-[80px] sticky left-0 z-30 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-md border-r border-b border-zinc-200/50 dark:border-zinc-800/50 text-[11px] text-zinc-500 dark:text-zinc-400 p-2 font-display uppercase tracking-wider">
                         胜率
                       </th>
                       {stageTeams.map(t => (
                         <th key={`col-${t.id}`} className="min-w-[48px] md:min-w-[52px] lg:min-w-[60px] border-r border-b border-zinc-200/50 dark:border-zinc-800/50 p-2 font-normal bg-transparent" title={t.name}>
                           <div className="flex items-center justify-center">
                             {t.logo ? (
                               <div className="w-5 h-5 md:w-6 md:h-6 shrink-0 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-700 shadow-sm">
                                 <TeamLogo team={t} fallbackClasses="text-[9px]" />
                               </div>
                             ) : (
                               <span className="truncate text-xs font-bold text-zinc-700 dark:text-zinc-300">{t.shortName}</span>
                             )}
                           </div>
                         </th>
                       ))}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                     {stageTeams.map((rowTeam) => (
                       <tr key={`row-${rowTeam.id}`} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors group">
                         <th className="w-16 min-w-[64px] md:w-20 md:min-w-[80px] sticky left-0 z-10 bg-white/90 dark:bg-zinc-950/90 group-hover:bg-zinc-50/90 dark:group-hover:bg-zinc-900/90 backdrop-blur-md border-r border-zinc-200/50 dark:border-zinc-800/50 font-normal transition-colors p-2">
                           <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 h-full">
                             {rowTeam.logo && (
                               <div className="w-5 h-5 md:w-6 md:h-6 shrink-0 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-700 shadow-sm group-hover:border-zinc-300 dark:group-hover:border-zinc-600 transition-colors">
                                 <TeamLogo team={rowTeam} fallbackClasses="text-[10px]" />
                               </div>
                             )}
                             <span className="text-[10px] md:text-[13px] md:font-bold truncate text-zinc-800 dark:text-zinc-200 text-center md:text-left leading-none group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={rowTeam.name}>{rowTeam.shortName}</span>
                           </div>
                         </th>
                         {stageTeams.map((colTeam) => {
                           const isSelf = rowTeam.id === colTeam.id;
                           const prob = localMatrixData[rowTeam.id]?.[colTeam.id] || 0;
                           const probPctNum = Math.round(prob * 100);
                           const probPct = isSelf ? "-" : probPctNum;
                           
                           // Color scale
                           let valColor = "text-zinc-500 dark:text-zinc-500";
                           let bgColor = "bg-transparent";
                           if (!isSelf) {
                             if (probPctNum > 65) { valColor = "text-emerald-700 dark:text-emerald-300 font-bold"; bgColor = "bg-emerald-50/50 dark:bg-emerald-900/10"; }
                             else if (probPctNum > 50) { valColor = "text-emerald-600 dark:text-emerald-400 font-medium"; }
                             else if (probPctNum === 50) { valColor = "text-zinc-500 dark:text-zinc-400"; }
                             else if (probPctNum > 35) { valColor = "text-rose-600 dark:text-rose-400 font-medium"; }
                             else { valColor = "text-rose-700 dark:text-rose-300 font-bold"; bgColor = "bg-rose-50/50 dark:bg-rose-900/10"; }
                           }

                           return (
                             <td key={`cell-${rowTeam.id}-${colTeam.id}`} className={cn("min-w-[48px] md:min-w-[52px] lg:min-w-[60px] border-r border-zinc-200/50 dark:border-zinc-800/50 relative min-h-[44px] md:min-h-[48px] p-0 h-[44px]", bgColor)}>
                               {isSelf ? (
                                 <span className="text-zinc-300 dark:text-zinc-700 flex items-center justify-center h-full font-black text-lg">-</span>
                               ) : (
                                   <input 
                                     className={cn(
                                        "w-full h-full bg-transparent text-center text-xs md:text-[13px] font-mono outline-none transition-colors absolute inset-0 z-10",
                                        valColor,
                                        "focus:bg-zinc-100 dark:focus:bg-zinc-800/50 focus:ring-2 focus:ring-inset focus:ring-blue-500/50"
                                     )}
                                     type="text"
                                     inputMode="numeric"
                                     pattern="[0-9]*"
                                     value={getDisplayVal(rowTeam.id, colTeam.id, prob)}
                                     onChange={(e) => {
                                        onCellChange(rowTeam.id, colTeam.id, e.target.value);
                                     }}
                                     onBlur={() => setEditVal(null)}
                                     onFocus={(e) => {
                                        e.target.select();
                                     }}
                                   />
                               )}
                             </td>
                           );
                         })}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          ) : (
             <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-500">
               请选择或创建一个概率矩阵
             </div>
          )}
        </div>
        </div>
      </div>
      <PopupUI.Modal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        title="通过实力值快速创建"
        maxWidthClass="max-w-xl"
      >
        <div className="flex flex-col gap-6 pt-2">
          <div className="text-zinc-500 dark:text-zinc-400 text-[13px] leading-relaxed">
            通过调整以下队伍的实力值 (Elo) 来快速生成对应的概率矩阵。系统默认采用队伍此时的 VRS / HLTV 等效积分。如果该队伍没有找到相关积分，则会根据种子顺位进行分配。
          </div>

          <div className="flex flex-col gap-3 p-5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl shadow-sm">
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display flex items-center justify-between">
              基础实力计算比重
              <span className="text-zinc-400 dark:text-zinc-500 font-normal text-[11px] tracking-wide">(调节将重置下方所有输入)</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono font-bold">
              <div className="w-20 text-right text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">HLTV {powerWeights.hltv}%</div>
              <input 
                type="range"
                min="0"
                max="100"
                value={powerWeights.hltv}
                onChange={(e) => {
                  const hltv = parseInt(e.target.value);
                  refreshQuickCreateStrengths(hltv, 100 - hltv);
                }}
                className="flex-1 accent-blue-500 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all"
              />
              <div className="w-20 text-center text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 py-1.5 rounded-lg border border-sky-100 dark:border-sky-500/20">VRS {powerWeights.vrs}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
            {stageTeams.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl shadow-sm transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700">
                <div className="w-6 h-6 shrink-0 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
                  <TeamLogo team={t} fallbackClasses="text-xs" />
                </div>
                <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{t.name}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-20 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-sm font-mono text-right text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                  value={quickCreateStrengths[t.id] ?? ""}
                  onChange={(e) => {
                    setQuickCreateStrengths(prev => ({ ...prev, [t.id]: e.target.value }));
                  }}
                  onBlur={(e) => {
                     if (!e.target.value || e.target.value.trim() === "") {
                        setQuickCreateStrengths(prev => ({ ...prev, [t.id]: "0" }));
                     }
                  }}
                  onFocus={(e) => e.target.select()}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <PopupUI.ActionButton
              label="取消"
              variant="secondary"
              onClick={() => setIsQuickCreateOpen(false)}
            />
            <PopupUI.ActionButton
              label="生成矩阵"
              variant="success"
              onClick={handleQuickCreateSave}
            />
          </div>
        </div>
      </PopupUI.Modal>
      <PopupUI.Modal
        isOpen={aiPickemState.isGenerating || aiPickemState.result !== null}
        onClose={() => {
          if (!aiPickemState.isGenerating) setAiPickemState({ isGenerating: false, progress: 0, phase: '', result: null });
        }}
        title="计算最优作业"
      >
        <div className="flex flex-col gap-6 pt-4">
          {aiPickemState.isGenerating ? (
            <div className="flex flex-col items-center justify-center p-12 gap-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner">
               <Calculator className="w-16 h-16 text-blue-500 animate-pulse drop-shadow-lg" />
               <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-display text-center">
                 {aiPickemState.phase === 'simulating' ? `正在进行 ${numSimulations / 10000}万 次矩阵推演...` : '正在启发式搜索最优化作业...'}
               </div>
               <div className="w-full max-w-sm bg-zinc-200 dark:bg-zinc-800 rounded-full h-3 mt-4 overflow-hidden relative shadow-inner border border-zinc-300/50 dark:border-zinc-700/50">
                 <div className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${aiPickemState.progress}%` }} />
               </div>
               <div className="text-sm font-mono font-bold text-zinc-500 dark:text-zinc-400">{aiPickemState.progress}%</div>
            </div>
          ) : aiPickemState.result ? (
            <div className="flex flex-col gap-8">
              
              <div className="flex items-center justify-center gap-2 -mb-2">
                <button 
                  onClick={() => setAiPickemState(prev => ({ ...prev, resultTab: 'candidates' }))}
                  className={cn(
                    "px-4 py-2 text-sm font-bold rounded-xl transition-colors",
                    aiPickemState.resultTab === 'candidates' ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  )}
                >
                  推荐作业
                </button>
                <button 
                  onClick={() => setAiPickemState(prev => ({ ...prev, resultTab: 'probabilities' }))}
                  className={cn(
                    "px-4 py-2 text-sm font-bold rounded-xl transition-colors",
                    aiPickemState.resultTab === 'probabilities' ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  )}
                >
                  队伍概率
                </button>
              </div>

              {aiPickemState.resultTab === 'candidates' ? (() => {
                 const activeCand = aiPickemState.result.candidates[aiPickemState.activeCandidateIndex];
                 return (
                   <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                         <button 
                           onClick={() => setAiPickemState(prev => ({ ...prev, activeCandidateIndex: Math.max(0, prev.activeCandidateIndex - 1) }))}
                           disabled={aiPickemState.activeCandidateIndex === 0}
                           className="p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-900 dark:text-zinc-100 transition-colors"
                         >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                         </button>
                         <div className="flex flex-col items-center">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-lg font-display">候选方案 {aiPickemState.activeCandidateIndex + 1}</span>
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              {aiPickemState.result.type === 'playoffs' 
                                ? `完成3个目标: ${(activeCand.p3 * 100).toFixed(1)}% | 2个: ${(activeCand.p2 * 100).toFixed(1)}% | 1个: ${(activeCand.p1 * 100).toFixed(1)}%` 
                                : `保 5 分概率: ${(activeCand.score * 100).toFixed(2)}%`}
                            </span>
                         </div>
                         <button 
                           onClick={() => setAiPickemState(prev => ({ ...prev, activeCandidateIndex: Math.min(prev.result.candidates.length - 1, prev.activeCandidateIndex + 1) }))}
                           disabled={aiPickemState.activeCandidateIndex === aiPickemState.result.candidates.length - 1}
                           className="p-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-900 dark:text-zinc-100 transition-colors"
                         >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                         </button>
                      </div>

                      {aiPickemState.result.type === 'playoffs' ? (
                        <div className="flex flex-col gap-6">
                          <div className="flex flex-col gap-4">
                            <PopupUI.SectionTitle>冠军</PopupUI.SectionTitle>
                            <div className="grid grid-cols-1 gap-2.5">
                              {(() => {
                                const t = TEAMS.find(x => x.id === activeCand.tChamp);
                                return t ? (
                                  <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl shadow-sm">
                                    <div className="w-10 h-10 shrink-0 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center border border-amber-200 dark:border-amber-700 shadow-sm"><TeamLogo team={t} fallbackClasses="text-lg" /></div>
                                    <span className="text-lg font-black text-amber-700 dark:text-amber-500 font-display tracking-wider">{t.name}</span>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          </div>
                          <div className="flex flex-col gap-4">
                            <PopupUI.SectionTitle>亚军</PopupUI.SectionTitle>
                            <div className="grid grid-cols-2 gap-3">
                              {activeCand.tSFW.map((tid: string) => {
                                const t = TEAMS.find(x => x.id === tid);
                                return t ? (
                                  <div key={t.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                                    <div className="w-6 h-6 shrink-0 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-700"><TeamLogo team={t} fallbackClasses="text-xs" /></div>
                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{t.shortName}</span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                          <div className="flex flex-col gap-4">
                            <PopupUI.SectionTitle>3-4th</PopupUI.SectionTitle>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {activeCand.tQFW.map((tid: string) => {
                                const t = TEAMS.find(x => x.id === tid);
                                return t ? (
                                  <div key={t.id} className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
                                    <div className="w-5 h-5 shrink-0 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-700"><TeamLogo team={t} fallbackClasses="text-[10px]" /></div>
                                    <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{t.shortName}</span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-4">
                              <PopupUI.SectionTitle>3-0 晋级</PopupUI.SectionTitle>
                              <div className="grid grid-cols-1 gap-2.5">
                                {activeCand.t30.map((tid: string) => {
                                  const t = TEAMS.find(x => x.id === tid);
                                  return t ? (
                                    <div key={t.id} className="flex items-center gap-4 p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                      <div className="w-8 h-8 shrink-0 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-700"><TeamLogo team={t} fallbackClasses="text-sm" /></div>
                                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t.name}</span>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                            <div className="flex flex-col gap-4">
                              <PopupUI.SectionTitle>0-3 淘汰</PopupUI.SectionTitle>
                              <div className="grid grid-cols-1 gap-2.5">
                                {activeCand.t03.map((tid: string) => {
                                  const t = TEAMS.find(x => x.id === tid);
                                  return t ? (
                                    <div key={t.id} className="flex items-center gap-4 p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                      <div className="w-8 h-8 shrink-0 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-700"><TeamLogo team={t} fallbackClasses="text-sm" /></div>
                                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t.name}</span>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-4">
                            <PopupUI.SectionTitle>3-1/3-2 晋级</PopupUI.SectionTitle>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {activeCand.tAdv.map((tid: string) => {
                                const t = TEAMS.find(x => x.id === tid);
                                return t ? (
                                  <div key={t.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="w-6 h-6 shrink-0 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-700"><TeamLogo team={t} fallbackClasses="text-xs" /></div>
                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{t.shortName}</span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        </>
                      )}
                   </div>
                 );
              })() : (
                 <div className="flex flex-col gap-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-4 bg-zinc-100 dark:bg-zinc-900/50 text-xs font-bold text-zinc-500 dark:text-zinc-400 p-3 border-b border-zinc-200 dark:border-zinc-800">
                      <div className="col-span-1">队伍</div>
                      {aiPickemState.result.type === 'playoffs' ? (
                        <>
                          <div className="text-center">四强</div>
                          <div className="text-center">决赛</div>
                          <div className="text-center">冠军</div>
                        </>
                      ) : (
                        <>
                          <div className="text-center">3-0</div>
                          <div className="text-center">0-3</div>
                          <div className="text-center">晋级</div>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col max-h-[50vh] overflow-y-auto hide-scrollbar">
                      {Object.keys(aiPickemState.result.teamProbabilities).map((tid) => {
                         const t = TEAMS.find(x => x.id === tid);
                         if (!t) return null;
                         const probs = aiPickemState.result.teamProbabilities[tid];
                         return (
                           <div key={tid} className="grid grid-cols-4 p-3 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 items-center">
                             <div className="col-span-1 flex items-center gap-2">
                               <div className="w-5 h-5 shrink-0 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-700"><TeamLogo team={t} fallbackClasses="text-[10px]" /></div>
                               <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{t.shortName}</span>
                             </div>
                             {aiPickemState.result.type === 'playoffs' ? (
                               <>
                                 <div className="text-center text-xs font-mono text-zinc-600 dark:text-zinc-400">{(probs.pSF * 100).toFixed(1)}%</div>
                                 <div className="text-center text-xs font-mono text-zinc-600 dark:text-zinc-400">{(probs.pFinal * 100).toFixed(1)}%</div>
                                 <div className="text-center text-xs font-mono font-bold text-amber-600 dark:text-amber-500">{(probs.pChamp * 100).toFixed(1)}%</div>
                               </>
                             ) : (
                               <>
                                 <div className="text-center text-xs font-mono text-blue-600 dark:text-blue-400">{(probs.p30 * 100).toFixed(1)}%</div>
                                 <div className="text-center text-xs font-mono text-rose-600 dark:text-rose-400">{(probs.p03 * 100).toFixed(1)}%</div>
                                 <div className="text-center text-xs font-mono font-bold text-emerald-600 dark:text-emerald-500">{((probs.p30 + probs.pAdv) * 100).toFixed(1)}%</div>
                               </>
                             )}
                           </div>
                         );
                      })}
                    </div>
                 </div>
              )}


              <div className="flex justify-end mt-4 pt-6 border-t border-zinc-100 dark:border-zinc-800/60">
                <PopupUI.ActionButton
                  label="确定"
                  variant="primary"
                  onClick={() => setAiPickemState({ isGenerating: false, progress: 0, phase: '', result: null })}
                />
              </div>
            </div>
          ) : null}
        </div>
      </PopupUI.Modal>
    </div>
  );
};
