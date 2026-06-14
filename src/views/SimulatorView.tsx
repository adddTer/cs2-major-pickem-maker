import React, { useState, useEffect, useMemo } from "react";
import { StageKey, MatrixSet, TournamentEvent } from "../types";
import { TEAMS } from "../data/teams";
import { DialogManager, dialog } from "../components/DialogManager";
import { getAllMatrixSets, saveMatrixSet, deleteMatrixSet } from "../lib/db";
import { getLocalStrength } from "../data/localPoints";
import { GLOBAL_SEEDING } from "../data/seedings";
import { Modal } from "../components/Modal";
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
    if (activeStage === "playoffs") return [];
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
    if (!defaultSet && stageTeams.length === 16) {
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
    if (stageTeams.length < 16) return;
    refreshQuickCreateStrengths(powerWeights.hltv, powerWeights.vrs);
    setIsQuickCreateOpen(true);
  };

  const handleQuickCreateSave = async () => {
    const defaultName = `实力换算 - ${new Date().toLocaleDateString()}`;
    const name = await dialog.prompt("请输入新矩阵名称", defaultName);
    if (!name || !name.trim()) return;

    if (stageTeams.length < 16) return;
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
    if (stageTeams.length < 16) return;
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
    if (!activeMatrix || activeMatrix.isDefault) return;
    const updated = { ...activeMatrix, matrix: localMatrixData };
    await saveMatrixSet(updated);
    dialog.alert("矩阵已保存到本地！");
    await loadMatrices();
  };

  const [editVal, setEditVal] = useState<{ r: string; c: string; val: string } | null>(null);

  const onCellChange = (t1Id: string, t2Id: string, val: string) => {
    if (!activeMatrix || activeMatrix.isDefault) return;
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
     return Math.round(prob * 100).toString();
  };

  if (activeStage === "playoffs") {
    return <div className="p-8 text-center text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">目前暂不支持决胜阶段的推演。</div>;
  }

  if (stageTeams.length < 16) {
    return <div className="p-8 text-center text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">该阶段当前首轮对阵未完全确定，无法进行推演。</div>;
  }

  const [aiPickemState, setAiPickemState] = useState<{ isGenerating: boolean, progress: number, phase: string, result: any | null }>({
    isGenerating: false, progress: 0, phase: '', result: null
  });

  const handleAIPickem = () => {
    if (!activeMatrix) return;
    
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
        setAiPickemState(prev => ({ ...prev, isGenerating: false, result: e.data.result }));
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
      <div className="flex border-b border-black/5 dark:border-white/5 items-center px-4 py-2 shrink-0 z-10 w-full bg-zinc-50/80 dark:bg-[#070b09]/80 backdrop-blur">
        {[
          { id: "stage1", label: "第一阶段" },
          { id: "stage2", label: "第二阶段" },
          { id: "stage3", label: "第三阶段" },
        ].map((tab) => {
          const isActive = activeStage === tab.id;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveStage(tab.id as StageKey)}
              className={cn(
                "px-4 py-1.5 rounded-[2px] text-[13px] font-bold cursor-pointer transition-colors flex items-center whitespace-nowrap",
                isActive
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border-b-2 border-emerald-500"
                  : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:text-zinc-300",
              )}
            >
              {tab.label}
            </div>
          );
        })}
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Desktop & Mobile Drawer */}
        <div className={cn(
          "absolute inset-y-0 left-0 z-50 w-64 md:w-56 border-r border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950 flex flex-col shrink-0 transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          showMobileMenu ? "translate-x-0" : "-translate-x-full"
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
        <div className="flex-1 flex flex-col bg-zinc-100/50 dark:bg-zinc-900/50 overflow-hidden relative">
          {activeMatrix ? (
             <div className="flex flex-col h-full p-2 md:p-4 relative z-20">
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 md:mb-4 gap-2 md:gap-4 shrink-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 max-w-full">
                       <button onClick={() => setShowMobileMenu(true)} className="md:hidden p-1.5 -ml-1 hover:bg-black/10 dark:bg-white/10 rounded flex items-center justify-center shrink-0">
                         <Menu className="w-5 h-5 text-zinc-800 dark:text-zinc-300" />
                       </button>
                       <h1 className="text-base md:text-lg font-bold text-black dark:text-white flex items-center gap-2 truncate">
                         {activeMatrix.name}
                         {activeMatrix.isDefault && <span className="px-1.5 py-0.5 bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[9px] md:text-[10px] rounded border border-sky-500/30 shrink-0">系统只读</span>}
                       </h1>
                    </div>
                    <p className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-500 mt-1 pl-7 md:pl-0">
                       此矩阵定义了BO1对决时的单图胜率。推演不含 "特定图elo+150" 机制，BO3会自动乘算。
                    </p>
                  </div>
                     <div className="flex items-center justify-end gap-2 shrink-0">
                       <select 
                         value={numSimulations} 
                         onChange={(e) => setNumSimulations(Number(e.target.value))}
                         disabled={aiPickemState.isGenerating}
                         className="bg-zinc-200 dark:bg-zinc-800 border-none outline-none text-[10px] md:text-xs text-zinc-800 dark:text-zinc-200 rounded px-2 py-1.5 md:py-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                       >
                         <option value={10000}>1万次模拟</option>
                         <option value={50000}>5万次模拟</option>
                         <option value={100000}>10万次模拟</option>
                         <option value={200000}>20万次模拟</option>
                         <option value={500000}>50万次模拟</option>
                       </select>
                       <button onClick={handleAIPickem} disabled={aiPickemState.isGenerating} className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-wait text-black dark:text-white rounded text-[10px] md:text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0">
                          <Calculator className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          {aiPickemState.isGenerating ? "计算中..." : "计算最优作业"}
                       </button>
                       {!activeMatrix.isDefault && (
                         <button onClick={handleSaveLocal} className="px-3 md:px-4 py-1.5 md:py-2 bg-emerald-600 hover:bg-emerald-500 text-black dark:text-white rounded text-[10px] md:text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0">
                            <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            保存修改
                         </button>
                       )}
                     </div>
               </div>

               <div className="flex-1 overflow-auto border border-black/10 dark:border-white/10 rounded bg-zinc-50 dark:bg-[#070b09] custom-scrollbar">
                 <table className="w-full text-center border-collapse min-w-max">
                   <thead className="sticky top-0 z-20 bg-zinc-50 dark:bg-zinc-950 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
                     <tr>
                       <th className="w-16 min-w-[64px] md:w-20 md:min-w-[80px] sticky left-0 z-30 bg-zinc-50 dark:bg-zinc-950 border-r border-b border-black/5 dark:border-white/5 text-[10px] text-zinc-500 dark:text-zinc-500 p-1 font-bold">
                         横(胜率) \ 纵
                       </th>
                       {stageTeams.map(t => (
                         <th key={`col-${t.id}`} className="min-w-[48px] md:min-w-[52px] lg:min-w-[60px] border-r border-b border-black/5 dark:border-white/5 p-1 md:px-1.5 md:py-1 font-normal bg-zinc-50 dark:bg-zinc-950" title={t.name}>
                           <div className="flex items-center justify-center">
                             {t.logo ? (
                               <div className="w-4 h-4 md:w-5 md:h-5 shrink-0">
                                 <TeamLogo team={t} fallbackClasses="text-[10px]" />
                               </div>
                             ) : (
                               <span className="truncate text-[10px] md:text-xs">{t.shortName}</span>
                             )}
                           </div>
                         </th>
                       ))}
                     </tr>
                   </thead>
                   <tbody>
                     {stageTeams.map((rowTeam) => (
                       <tr key={`row-${rowTeam.id}`} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                         <th className="w-16 min-w-[64px] md:w-20 md:min-w-[80px] sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-950 group-hover:bg-zinc-100 dark:group-hover:bg-[#111613] border-r border-b border-black/5 dark:border-white/5 font-normal transition-colors p-1 md:px-1.5">
                           <div className="flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 h-full">
                             {rowTeam.logo && (
                               <div className="w-4 h-4 md:w-5 md:h-5 shrink-0">
                                 <TeamLogo team={rowTeam} fallbackClasses="text-[8px]" />
                               </div>
                             )}
                             <span className="text-[9px] md:text-xs md:font-medium truncate text-zinc-800 dark:text-zinc-300 text-center md:text-left leading-none" title={rowTeam.name}>{rowTeam.shortName}</span>
                           </div>
                         </th>
                         {stageTeams.map((colTeam) => {
                           const isSelf = rowTeam.id === colTeam.id;
                           const prob = localMatrixData[rowTeam.id]?.[colTeam.id] || 0;
                           const probPctNum = Math.round(prob * 100);
                           const probPct = isSelf ? "-" : probPctNum;
                           
                           // Color scale: 50 is center (zinc). > 50 tends to emerald, < 50 tends to rose
                           let valColor = "text-zinc-500 dark:text-zinc-500";
                           if (!isSelf) {
                             if (probPctNum > 65) valColor = "text-emerald-600 dark:text-emerald-400 font-bold";
                             else if (probPctNum > 50) valColor = "text-emerald-500 dark:text-emerald-300";
                             else if (probPctNum === 50) valColor = "text-zinc-500 dark:text-zinc-600 dark:text-zinc-400";
                             else if (probPctNum > 35) valColor = "text-rose-500 dark:text-rose-300";
                             else valColor = "text-rose-600 dark:text-rose-400 font-bold";
                           }

                           return (
                             <td key={`cell-${rowTeam.id}-${colTeam.id}`} className="min-w-[48px] md:min-w-[52px] lg:min-w-[60px] border-r border-b border-black/5 dark:border-white/5 relative min-h-[40px] md:min-h-[40px] p-0 h-[40px]">
                               {isSelf ? (
                                 <span className="text-zinc-400 dark:text-zinc-700 flex items-center justify-center h-full">-</span>
                               ) : (
                                 activeMatrix.isDefault ? (
                                   <div className={cn("flex items-center justify-center w-full h-full text-[10px] md:text-xs cursor-default selection:bg-transparent", valColor)}>
                                     {probPct}%
                                   </div>
                                 ) : (
                                   <input 
                                     className={cn(
                                        "w-full h-full bg-transparent text-center text-[10px] md:text-xs outline-none focus:bg-black/10 dark:focus:bg-white/10 transition-colors absolute inset-0",
                                        valColor
                                     )}
                                     type="text"
                                     inputMode="numeric"
                                     pattern="[0-9]*"
                                     value={getDisplayVal(rowTeam.id, colTeam.id, prob)} // showing integer for simpler edit
                                     onChange={(e) => onCellChange(rowTeam.id, colTeam.id, e.target.value)}
                                     onBlur={() => setEditVal(null)} // clear active edit state on blur
                                     onFocus={(e) => e.target.select()}
                                   />
                                 )
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
      <Modal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        title="通过实力值快速创建"
        maxWidthClass="max-w-xl"
      >
        <div className="text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 text-[11px] md:text-sm mb-4 leading-relaxed">
          通过调整以下队伍的实力值 (Elo) 来快速生成对应的概率矩阵。系统默认采用队伍此时的 VRS / HLTV 等效积分。如果该队伍没有找到相关积分，则会根据种子顺位进行分配。
        </div>

        <div className="mb-5 flex flex-col gap-2 p-3 bg-zinc-200/30 dark:bg-black/30 border border-black/5 dark:border-white/5 rounded">
          <div className="text-sm font-medium text-zinc-800 dark:text-zinc-300">
            基础实力计算比重 <span className="text-zinc-500 dark:text-zinc-500 font-normal ml-2 text-xs">(调节将重置下方所有输入)</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="w-20 text-right text-emerald-400">HLTV {powerWeights.hltv}%</div>
            <input 
              type="range"
              min="0"
              max="100"
              value={powerWeights.hltv}
              onChange={(e) => {
                const hltv = parseInt(e.target.value);
                refreshQuickCreateStrengths(hltv, 100 - hltv);
              }}
              className="flex-1 accent-emerald-500 h-1.5 bg-white dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="w-20 text-sky-400">VRS {powerWeights.vrs}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-6">
          {stageTeams.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-2 bg-zinc-200/20 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded">
              <div className="w-5 h-5 shrink-0">
                <TeamLogo team={t} fallbackClasses="text-xs" />
              </div>
              <span className="flex-1 text-xs md:text-sm font-medium text-zinc-900 dark:text-zinc-200 truncate">{t.name}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-20 bg-zinc-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10 rounded px-2 py-1 text-xs md:text-sm text-right text-emerald-400 focus:outline-none focus:border-emerald-500/50"
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
        <div className="flex justify-end gap-2 shrink-0">
          <button
            onClick={() => setIsQuickCreateOpen(false)}
            className="px-4 py-2 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 text-zinc-800 dark:text-zinc-300 text-sm font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleQuickCreateSave}
            className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-black dark:text-white text-sm font-medium transition-colors shadow-sm"
          >
            生成矩阵
          </button>
        </div>
      </Modal>
      <Modal
        isOpen={aiPickemState.isGenerating || aiPickemState.result !== null}
        onClose={() => {
          if (!aiPickemState.isGenerating) setAiPickemState({ isGenerating: false, progress: 0, phase: '', result: null });
        }}
        title="计算最优作业"
      >
        <div className="flex flex-col gap-6 py-4">
          {aiPickemState.isGenerating ? (
            <div className="flex flex-col items-center justify-center p-8 gap-4">
               <Calculator className="w-12 h-12 text-blue-500 animate-pulse" />
               <div className="text-sm font-bold text-zinc-800 dark:text-zinc-300">
                 {aiPickemState.phase === 'simulating' ? `正在进行 ${numSimulations / 10000}万 次矩阵推演...` : '正在启发式搜索最优化作业...'}
               </div>
               <div className="w-full bg-white dark:bg-zinc-800 rounded-full h-2 mt-4 overflow-hidden">
                 <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${aiPickemState.progress}%` }} />
               </div>
               <div className="text-xs text-zinc-500 dark:text-zinc-500">{aiPickemState.progress}%</div>
            </div>
          ) : aiPickemState.result ? (
            <div className="flex flex-col gap-6">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex flex-col items-center justify-center gap-2">
                <span className="text-emerald-400 font-bold text-lg">保 5 分概率: {(aiPickemState.result.score * 100).toFixed(2)}%</span>
                <span className="text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 text-xs text-center">此概率基于当前选择的胜率矩阵进行{numSimulations / 10000}万次模拟并进行启发式搜索得出。</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest pl-2">3-0 晋级</div>
                  <div className="grid grid-cols-1 gap-2">
                    {aiPickemState.result.t30.map((tid: string) => {
                      const t = TEAMS.find(x => x.id === tid);
                      return t ? (
                        <div key={t.id} className="flex items-center gap-3 p-2 bg-zinc-200/20 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded">
                          <div className="w-5 h-5 shrink-0"><TeamLogo team={t} fallbackClasses="text-xs" /></div>
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{t.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest pl-2">0-3 淘汰</div>
                  <div className="grid grid-cols-1 gap-2">
                    {aiPickemState.result.t03.map((tid: string) => {
                      const t = TEAMS.find(x => x.id === tid);
                      return t ? (
                        <div key={t.id} className="flex items-center gap-3 p-2 bg-zinc-200/20 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded">
                          <div className="w-5 h-5 shrink-0"><TeamLogo team={t} fallbackClasses="text-xs" /></div>
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{t.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest pl-2">其余晋级队伍</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {aiPickemState.result.tAdv.map((tid: string) => {
                    const t = TEAMS.find(x => x.id === tid);
                    return t ? (
                      <div key={t.id} className="flex items-center gap-3 p-2 bg-zinc-200/20 dark:bg-black/20 border border-black/5 dark:border-white/5 rounded">
                        <div className="w-5 h-5 shrink-0"><TeamLogo team={t} fallbackClasses="text-xs" /></div>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{t.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setAiPickemState({ isGenerating: false, progress: 0, phase: '', result: null })}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-black dark:text-white rounded font-bold transition-colors"
                >
                  确定
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};
