import React, { useState, useEffect } from 'react';
import { TEAMS, INITIAL_SLOTS, PLAYOFFS_SLOTS } from './data/teams';
import { ACTUAL_RESULTS, MATCHES } from './data/matches';
import { PickSlot, SlotType, PickSet } from './types';
import { cn } from './lib/utils';
import { Trophy, RefreshCw, Clock, Users, Edit3, CheckCircle2, Home, CheckSquare, Square, Download, Copy } from 'lucide-react';
import { SwissBracket } from './components/SwissBracket';
import { PickEmDock } from './components/PickEmDock';
import { PlayoffsBracket } from './components/PlayoffsBracket';
import { MiniPicksDisplay } from './components/MiniPicksDisplay';
import { MiniPlayoffsBracket } from './components/MiniPlayoffsBracket';
import { HomeView } from './views/HomeView';
import { TeamLogo } from './components/TeamLogo';
import { Modal } from './components/Modal';

export default function App() {
  type StageKey = 'stage1' | 'stage2' | 'stage3' | 'playoffs';
  type ViewMode = 'home' | 'edit' | 'summary';
  
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [newNickname, setNewNickname] = useState('');
  const [activeStage, setActiveStage] = useState<StageKey>('stage1');
  const [showResults, setShowResults] = useState(false);
  const [communityPicks, setCommunityPicks] = useState<PickSet[]>([]);
  const [currentPickSetId, setCurrentPickSetId] = useState<string | null>(null);

  const defaultPicks = {
    stage1: INITIAL_SLOTS.map(s => ({ ...s, id: `s1-${s.id}` })),
    stage2: INITIAL_SLOTS.map(s => ({ ...s, id: `s2-${s.id}` })),
    stage3: INITIAL_SLOTS.map(s => ({ ...s, id: `s3-${s.id}` })),
    playoffs: PLAYOFFS_SLOTS.map(s => ({ ...s, id: `playoffs-${s.id}` })),
  };
  const [picks, setPicks] = useState<Record<string, PickSlot[]>>(defaultPicks);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showImageExportModal, setShowImageExportModal] = useState(false);
  const [imageExportIds, setImageExportIds] = useState<string[]>([]);
  const [imageExportIncludeResults, setImageExportIncludeResults] = useState(true);
  const [imageExportShowTeamNames, setImageExportShowTeamNames] = useState(false);
  const [imageExportStyle, setImageExportStyle] = useState<'standard' | 'compact'>('standard');
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [exportPreviewUrl, setExportPreviewUrl] = useState<string | null>(null);
  const exportContainerRef = React.useRef<HTMLDivElement>(null);

  const handleGeneratePreview = async () => {
    if (imageExportIds.length === 0) {
      alert("请至少选择一项");
      return;
    }
    if (!exportContainerRef.current) return;
    setIsExportingImage(true);
    
    // Allow React to render the hidden container
    setTimeout(() => {
        import('html-to-image').then(htmlToImage => {
            if (!exportContainerRef.current) return;
            htmlToImage.toPng(exportContainerRef.current, { backgroundColor: '#070b09', pixelRatio: 3 })
                .then(function (dataUrl) {
                    setExportPreviewUrl(dataUrl);
                    setIsExportingImage(false);
                })
                .catch(function (error) {
                    console.error('oops, something went wrong!', error);
                    setIsExportingImage(false);
                    alert("截图生成失败");
                });
        });
    }, 500);
  };
  
  const handleDownloadImage = () => {
    if (!exportPreviewUrl) return;
    const link = document.createElement('a');
    link.download = `pickem-summary-${activeStage}.png`;
    link.href = exportPreviewUrl;
    link.click();
    setShowImageExportModal(false);
    setExportPreviewUrl(null);
  };
  const loadPicks = () => {
    import('./lib/db').then(db => {
      db.getAllPickSets().then(sets => {
        setCommunityPicks(sets.sort((a, b) => b.createdAt - a.createdAt));
      });
    });
  };

  useEffect(() => {
    loadPicks();
  }, [viewMode]);

  const itemFreq = React.useMemo(() => {
    const freq: Record<string, number> = {};

    communityPicks.forEach(p => {
      const picks = p.picks[activeStage] || [];
      picks.forEach(slot => {
        if (slot.teamId) {
          const type = slot.type === '0-3' ? 'elim' : 'adv';
          const key = `${type}-${slot.teamId}`;
          freq[key] = (freq[key] || 0) + 1;
        }
      });
    });
    return freq;
  }, [communityPicks, activeStage]);

  const sortedCommunityPicks = React.useMemo(() => {
    const sortedItemIds = Object.keys(itemFreq).sort((a, b) => {
      const diff = itemFreq[b] - itemFreq[a];
      if (diff !== 0) return diff;
      return a.localeCompare(b);
    });

    return [...communityPicks].sort((a, b) => {
      const getItems = (p: PickSet) => {
        const items = new Set<string>();
        (p.picks[activeStage] || []).forEach(slot => {
          if (slot.teamId) {
            const type = slot.type === '0-3' ? 'elim' : 'adv';
            items.add(`${type}-${slot.teamId}`);
          }
        });
        return items;
      };

      const aItems = getItems(a);
      const bItems = getItems(b);

      for (const itemId of sortedItemIds) {
        const aHas = aItems.has(itemId) ? 1 : 0;
        const bHas = bItems.has(itemId) ? 1 : 0;
        if (aHas !== bHas) {
          return bHas - aHas;
        }
      }
      return b.createdAt - a.createdAt;
    });
  }, [communityPicks, activeStage]);

  const getStageStatus = (stage: string) => {
    const isComplete = (stage === 'playoffs' && ACTUAL_RESULTS[stage]?.length >= 15) || 
                       (stage !== 'playoffs' && ACTUAL_RESULTS[stage]?.length >= 16);
                       
    if (isComplete) return `比赛已结束`;

    const dates: Record<string, { start: Date, end: Date }> = {
      stage1: { start: new Date('2026-06-02T00:00:00Z'), end: new Date('2026-06-05T23:59:59Z') },
      stage2: { start: new Date('2026-06-06T00:00:00Z'), end: new Date('2026-06-09T23:59:59Z') },
      stage3: { start: new Date('2026-06-11T00:00:00Z'), end: new Date('2026-06-15T23:59:59Z') },
      playoffs: { start: new Date('2026-06-18T00:00:00Z'), end: new Date('2026-06-21T23:59:59Z') },
    };
    
    const { start, end } = dates[stage];
    const now = new Date();

    if (now < start) {
      const diff = start.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      if (days > 0) return `距离开始还有 ${days} 天`;
      return `距离开始还有 ${hours} 小时`;
    } else if (now >= start && now <= end) {
      return `比赛进行中`;
    } else {
      return `比赛已结束`;
    }
  };

  const getAvailableTeams = (stage: string) => {
    if (stage === 'playoffs') {
      return TEAMS; // allow picking any team for playoffs in sandbox
    }

    if (stage === 'stage1') {
      return TEAMS.filter(t => t.startStage === 1);
    }
    if (stage === 'stage2') {
      const s1AdvancedIds = picks.stage1.filter(s => (s.type === '3-0' || s.type === 'advance') && s.teamId).map(s => s.teamId);
      const s1Advanced = TEAMS.filter(t => t && s1AdvancedIds.includes(t.id));
      const s2Direct = TEAMS.filter(t => t.startStage === 2);
      return [...s1Advanced, ...s2Direct];
    }
    if (stage === 'stage3') {
      const s2AdvancedIds = picks.stage2.filter(s => (s.type === '3-0' || s.type === 'advance') && s.teamId).map(s => s.teamId);
      const s2Advanced = TEAMS.filter(t => t && s2AdvancedIds.includes(t.id));
      const s3Direct = TEAMS.filter(t => t.startStage === 3);
      return [...s2Advanced, ...s3Direct];
    }
    return [];
  };

  const currentPoolTeams = getAvailableTeams(activeStage);
  const currentSlots = picks[activeStage] || [];
  
  const handleAssignSlot = (teamId: string, slotId: string) => {
    if (!currentPoolTeams.find(t => t.id === teamId)) return;

    setPicks(prev => {
        const nextStage = [...(prev[activeStage] || defaultPicks[activeStage] || [])];
        const targetIdx = nextStage.findIndex(s => s.id === slotId);
        
        if (activeStage === 'playoffs') {
             // In playoffs, if we change a slot (e.g. sf-1), we should clear any downstream slots 
             // (final-1, champion) that had the *old* team which is now replaced.
             const oldTeamId = nextStage[targetIdx].teamId;
             nextStage[targetIdx] = { ...nextStage[targetIdx], teamId };

              if (oldTeamId && oldTeamId !== teamId) {
                   // Forward cascade clear
                   // If QF changes, if the old team was in SF, clear the SF. Then cascade.
                   const cascadeClear = (slotName: string, removedTeam: string) => {
                        const localSlotName = slotName.replace('playoffs-', '');
                        const relatedAdv = {
                            'qf-1': 'sf-1', 'qf-2': 'sf-1',
                            'qf-3': 'sf-2', 'qf-4': 'sf-2',
                            'qf-5': 'sf-3', 'qf-6': 'sf-3',
                            'qf-7': 'sf-4', 'qf-8': 'sf-4',
                            'sf-1': 'final-1', 'sf-2': 'final-1',
                            'sf-3': 'final-2', 'sf-4': 'final-2',
                            'final-1': 'champion', 'final-2': 'champion'
                        };
                        const nextIdLocal = relatedAdv[localSlotName as keyof typeof relatedAdv];
                        if (nextIdLocal) {
                             const nextId = `playoffs-${nextIdLocal}`;
                             const nextSlotIdx = nextStage.findIndex(s => s.id === nextId);
                             if (nextSlotIdx !== -1 && nextStage[nextSlotIdx].teamId === removedTeam) {
                                  nextStage[nextSlotIdx] = { ...nextStage[nextSlotIdx], teamId: null };
                                  cascadeClear(nextId, removedTeam);
                             }
                        }
                   };
                   cascadeClear(slotId, oldTeamId);
              }

             return { ...prev, [activeStage]: nextStage };
        }

        const existingIdx = nextStage.findIndex(s => s.teamId === teamId);
        if (existingIdx !== -1) {
            nextStage[existingIdx] = { ...nextStage[existingIdx], teamId: nextStage[targetIdx].teamId };
        }
        
        nextStage[targetIdx] = { ...nextStage[targetIdx], teamId };
        return { ...prev, [activeStage]: nextStage };
    });
  };

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    const teamId = e.dataTransfer.getData('teamId');
    if (!teamId) return;
    handleAssignSlot(teamId, slotId);
  };

  const handleCreateNew = () => {
    if (!newNickname.trim()) {
      alert("请输入您的昵称！");
      return;
    }
    const newId = `usr-${Date.now()}`;
    setCurrentPickSetId(newId);
    setPicks(defaultPicks);
    setViewMode('edit');
  };

  const handleEditExisting = (pickSet: PickSet) => {
    setCurrentPickSetId(pickSet.id);
    setNewNickname(pickSet.name);
    setPicks({
        ...defaultPicks,
        ...pickSet.picks
    });
    setViewMode('edit');
  };

  const handleSavePick = async () => {
    if (!newNickname.trim()) {
       alert("请先输入您的昵称！");
       return;
    }
    if (!currentPickSetId) return;

    const db = await import('./lib/db');
    const pickSet: PickSet = {
       id: currentPickSetId,
       name: newNickname,
       createdAt: Date.now(),
       picks: JSON.parse(JSON.stringify(picks))
    };
    await db.savePickSet(pickSet);
    
    const sets = await db.getAllPickSets();
    setCommunityPicks(sets.sort((a,b) => b.createdAt - a.createdAt));
    
    alert("竞猜已保存！");
    setViewMode('home');
  };

  const handleClear = (slotId: string) => {
      setPicks(prev => {
          const nextStage = [...(prev[activeStage] || defaultPicks[activeStage] || [])];
          const idx = nextStage.findIndex(s => s.id === slotId);
          if (idx === -1) return prev;
          
          const oldTeamId = nextStage[idx].teamId;
          nextStage[idx] = { ...nextStage[idx], teamId: null };

          if (activeStage === 'playoffs' && oldTeamId) {
                const cascadeClear = (slotName: string, removedTeam: string) => {
                     const localSlotName = slotName.replace('playoffs-', '');
                     const relatedAdv: Record<string, string> = {
                         'qf-1': 'sf-1', 'qf-2': 'sf-1',
                         'qf-3': 'sf-2', 'qf-4': 'sf-2',
                         'qf-5': 'sf-3', 'qf-6': 'sf-3',
                         'qf-7': 'sf-4', 'qf-8': 'sf-4',
                         'sf-1': 'final-1', 'sf-2': 'final-1',
                         'sf-3': 'final-2', 'sf-4': 'final-2',
                         'final-1': 'champion', 'final-2': 'champion'
                     };
                     const nextIdLocal = relatedAdv[localSlotName as keyof typeof relatedAdv];
                     if (nextIdLocal) {
                          const nextId = `playoffs-${nextIdLocal}`;
                          const nextSlotIdx = nextStage.findIndex(s => s.id === nextId);
                          if (nextSlotIdx !== -1 && nextStage[nextSlotIdx].teamId === removedTeam) {
                               nextStage[nextSlotIdx] = { ...nextStage[nextSlotIdx], teamId: null };
                               cascadeClear(nextId, removedTeam);
                          }
                     }
                };
                cascadeClear(slotId, oldTeamId);
          }

          return { ...prev, [activeStage]: nextStage };
      });
  };

  const getTeamRecords = (stage: string) => {
      const records: Record<string, { w: number; l: number }> = {};
      const matchesMap = MATCHES[stage] || {};
      
      Object.entries(matchesMap).forEach(([bracket, matches]) => {
          const [wStr, lStr] = bracket.split(':');
          const w = parseInt(wStr, 10);
          const l = parseInt(lStr, 10);
          if (isNaN(w) || isNaN(l)) return;
          
          matches.forEach(m => {
              if (m.team1Id) {
                  const cur = records[m.team1Id] || { w: 0, l: 0 };
                  if (w + l >= cur.w + cur.l) records[m.team1Id] = { w, l };
              }
              if (m.team2Id) {
                  const cur = records[m.team2Id] || { w: 0, l: 0 };
                  if (w + l >= cur.w + cur.l) records[m.team2Id] = { w, l };
              }
          });
      });
      
      const actuals = ACTUAL_RESULTS[stage] || [];
      actuals.forEach(a => {
          if (a.teamId) {
              if (a.type === '3-0') records[a.teamId] = { w: 3, l: 0 };
              else if (a.type === '0-3') records[a.teamId] = { w: 0, l: 3 };
              else if (a.type === 'advance') {
                  const cur = records[a.teamId] || { w: 0, l: 0 };
                  records[a.teamId] = { w: 3, l: cur.l > 0 ? cur.l : 1 };
              }
          }
      });
      return records;
  };

  const checkPrediction = (teamId: string | null, type: SlotType, stage: string): 'correct' | 'incorrect' | 'unknown' => {
      if (!teamId) return 'unknown';
      
      const actuals = ACTUAL_RESULTS[stage] || [];
      
      if (stage === 'playoffs') {
          if (!actuals || actuals.length === 0) return 'unknown';
          const isInActuals = actuals.some(a => a.teamId === teamId && a.type === type);
          // In playoffs, if the match for this slot has a result, it should be in actuals.
          // Since we don't have detailed bracket progress tracking yet, we will just use the old logic for playoffs,
          // but we shouldn't mark it incorrect unless we know the match happened. Actually for playoffs it's harder.
          // Let's just say if actuals has the EXACT slot (we can match by ID, but `type` is qf/sf/etc). 
          // Since playoffs doesn't have 5-pick threshold, maybe just leave it 'unknown' unless correct, or if that type has all winners?
          // For now:
          const typeCount = actuals.filter(a => a.type === type).length;
          const maxForType = type === 'qf' ? 8 : type === 'sf' ? 4 : type === 'final' ? 2 : 1;
          if (isInActuals) return 'correct';
          if (typeCount >= maxForType) return 'incorrect'; // All slots for this type are filled
          return 'unknown';
      }

      const isInActuals = actuals.some(a => a.teamId === teamId);
      if (isInActuals) {
          const isCorrect = actuals.some(a => a.teamId === teamId && a.type === type);
          if (isCorrect) return 'correct';
          
          // If they are in actuals but with a DIFFERENT type, e.g. picked 3-0 but got advance
          // Wait, 'advance' pick is correct if the team is '3-0' or 'advance'.
          if (type === 'advance') {
              const actualType = actuals.find(a => a.teamId === teamId)?.type;
              if (actualType === '3-0' || actualType === 'advance') return 'correct';
          }
          return 'incorrect';
      }
      
      const records = getTeamRecords(stage);
      const record = records[teamId];
      if (!record) return 'unknown'; 
      
      if (type === '3-0') {
          if (record.l > 0) return 'incorrect'; 
      } else if (type === '0-3') {
          if (record.w > 0) return 'incorrect'; 
      } else if (type === 'advance') {
          if (record.l === 3) return 'incorrect'; 
      }
      
      // Check if all spots for a type are filled
      if (type === '3-0' && actuals.filter(a => a.type === '3-0').length >= 2) return 'incorrect';
      if (type === '0-3' && actuals.filter(a => a.type === '0-3').length >= 2) return 'incorrect';
      if (type === 'advance' && actuals.filter(a => a.type === 'advance' || a.type === '3-0').length >= 8) return 'incorrect';
      
      return 'unknown';
  };

  const getSetStatus = (theirPicks: PickSlot[], stage: string) => {
      if (stage === 'playoffs') return null;
      
      const records = getTeamRecords(stage);
      
      // Check if Round 1 is completely finished (all 16 teams must have played at least 1 match)
      const teamsWithRecords = Object.values(records).filter(r => (r.w + r.l) > 0);
      if (teamsWithRecords.length < 16) {
          return null; 
      }
      
      // Check if all 10 picks are filled for Swiss stage
      const filledPicks = theirPicks.filter(p => p.teamId);
      if (filledPicks.length < 10) {
          return null;
      }
      
      let guaranteed = 0;
      let possible = 0;
      theirPicks.forEach(p => {
          const status = checkPrediction(p.teamId, p.type, stage);
          if (status === 'correct') guaranteed++;
          else if (status === 'unknown') possible++;
      });
      
      let statusId = 'unknown';
      if (guaranteed >= 5) statusId = 'passed';
      else if (guaranteed + possible < 5) statusId = 'failed';
      else {
          const needed = 5 - Math.max(guaranteed, 0);
          const ratio = needed / (possible || 1);
          if (ratio <= 0.4) statusId = 'great_chance';
          else if (ratio > 0.7) statusId = 'slim_chance';
          else statusId = 'uncertain';
      }
      return { statusId, guaranteed, possible };
  };

  const getStatusStyles = (statusData: ReturnType<typeof getSetStatus>) => {
      if (!statusData) return { bg: 'bg-zinc-900/80', border: 'border-white/5' };
      switch (statusData.statusId) {
          case 'passed': return { bg: 'bg-zinc-900/60 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-zinc-900/60 to-zinc-900/80', border: 'border-emerald-500/20' };
          case 'failed': return { bg: 'bg-zinc-900/60 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-900/40 via-zinc-900/60 to-zinc-900/80', border: 'border-rose-500/20' };
          case 'great_chance': return { bg: 'bg-zinc-900/60 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-zinc-900/60 to-zinc-900/80', border: 'border-blue-500/20' };
          case 'uncertain': return { bg: 'bg-zinc-900/60 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/40 via-zinc-900/60 to-zinc-900/80', border: 'border-amber-500/20' };
          case 'slim_chance': return { bg: 'bg-zinc-900/60 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-900/40 via-zinc-900/60 to-zinc-900/80', border: 'border-orange-500/20' };
          default: return { bg: 'bg-zinc-900/80', border: 'border-white/5' };
      }
  };

  const PickSetStatusText = ({ statusData }: { statusData: ReturnType<typeof getSetStatus> }) => {
      if (!statusData) return null;
      const { statusId, guaranteed, possible } = statusData;
      
      switch (statusId) {
          case 'passed':
              return (
                  <div className="text-emerald-400 text-[11px] font-bold shrink-0 opacity-90">
                      已达成
                  </div>
              );
          case 'failed':
              return (
                  <div className="text-rose-500 text-[11px] font-bold shrink-0 opacity-90">
                      未达成
                  </div>
              );
          case 'great_chance':
              return (
                  <div className="text-blue-400 text-[11px] font-bold shrink-0 opacity-90" title={`需要${5 - guaranteed}题，剩余${possible}题`}>
                      形势大好 {guaranteed}/5通过
                  </div>
              );
          case 'uncertain':
              return (
                  <div className="text-amber-500 text-[11px] font-bold shrink-0 opacity-90" title={`需要${5 - guaranteed}题，剩余${possible}题`}>
                      胜负难测 {guaranteed}/5通过
                  </div>
              );
          case 'slim_chance':
              return (
                  <div className="text-orange-500 text-[11px] font-bold shrink-0 opacity-90" title={`需要${5 - guaranteed}题，剩余${possible}题`}>
                      希望渺茫 {guaranteed}/5通过
                  </div>
              );
          default:
              return null;
      }
  };

  return (
    <>
      <style>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
      
      <div className="h-[100dvh] w-full bg-[#070b09] text-zinc-200 font-sans flex flex-col relative overflow-hidden select-none">
        {/* Ambient Glow Lights */}
        <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none z-0" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none z-0" />
        
        {/* Top Navbar */}
        <div className="h-14 border-b border-white/5 bg-zinc-900/40 backdrop-blur-md flex items-center px-2 sm:px-6 justify-between shrink-0 z-20 overflow-x-auto custom-scrollbar">
           <div className="flex items-center gap-1.5 sm:gap-2 mr-4 min-w-max">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0" />
              <span className="text-[10px] sm:text-sm font-bold tracking-widest text-zinc-100 hidden sm:block">IEM Cologne Major 2026</span>
              <span className="text-[10px] sm:hidden font-bold tracking-widest text-zinc-100">Cologne 26</span>
           </div>
           
           <div className="flex bg-black/40 p-0.5 sm:p-1 rounded-md border border-white/5 shrink-0 min-w-max">
              <div 
                 onClick={() => setViewMode('home')}
                 className={cn("px-2 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 sm:gap-2", viewMode === 'home' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
              >
                 <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">首页</span><span className="sm:hidden">首页</span>
              </div>
              <div 
                 onClick={() => {
                    if (!currentPickSetId) {
                        alert("请先从首页创建或选择竞猜 ID！");
                        return;
                    }
                    setViewMode('edit');
                 }}
                 className={cn("px-2 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 sm:gap-2", viewMode === 'edit' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
              >
                 <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">编辑竞猜</span><span className="sm:hidden">竞猜</span>
              </div>
              <div 
                 onClick={() => setViewMode('summary')}
                 className={cn("px-2 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 sm:gap-2", viewMode === 'summary' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
              >
                 <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">社区汇总</span><span className="sm:hidden">汇总</span>
              </div>
           </div>
        </div>

        {/* Outer App Container */}
        <div className="w-full flex-1 max-w-full relative z-10 flex flex-col lg:flex-row gap-4 lg:gap-6 p-3 lg:p-6 overflow-y-auto lg:overflow-hidden">
          {viewMode === 'home' && (
            <HomeView 
              newNickname={newNickname} 
              setNewNickname={setNewNickname} 
              communityPicks={communityPicks} 
              handleCreateNew={handleCreateNew} 
              handleEditExisting={handleEditExisting}
              refreshPicks={loadPicks}
            />
          )}

          {viewMode === 'edit' && (
            <>
              {/* Left Sidebar */}
              <div className="w-full lg:w-[300px] flex flex-col bg-zinc-900/60 border border-white/5 rounded-lg shrink-0 shadow-xl relative backdrop-blur-md lg:overflow-hidden">
                <div className="p-4 lg:p-6 bg-zinc-900/40 shrink-0 lg:border-b border-white/5 flex flex-col sm:flex-row lg:flex-col justify-between sm:items-center lg:items-start gap-4">
                    <div>
                        <h2 className="text-[14px] lg:text-[15px] font-bold tracking-wide mb-1 lg:mb-2 text-zinc-100 flex items-center gap-2">
                           当前活跃的竞猜
                        </h2>
                        <p className="text-[10px] lg:text-[11px] text-zinc-400 font-medium leading-relaxed">正在编辑 <span className="text-blue-400 font-bold">{newNickname}</span></p>
                    </div>
                    
                    <div className="flex lg:hidden items-center gap-2 w-full sm:w-auto">
                        <input 
                            type="text" 
                            value={newNickname}
                            onChange={e => setNewNickname(e.target.value)}
                            className="bg-black/40 border border-white/5 rounded px-3 py-2 text-xs text-zinc-100 outline-none focus:border-blue-500/50 flex-1 min-w-0 shadow-inner"
                            placeholder="预测 ID"
                        />
                        <button onClick={handleSavePick} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors rounded flex items-center gap-1.5 shrink-0 shadow-lg shadow-blue-900/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 保存
                        </button>
                    </div>
                </div>

                <div className="hidden lg:flex flex-1 overflow-y-auto px-6 py-6 flex-col gap-6 z-10">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">预测 ID</label>
                      <input 
                          type="text" 
                          value={newNickname}
                          onChange={e => setNewNickname(e.target.value)}
                          className="bg-black/40 border border-white/5 rounded px-3 py-2 text-sm text-zinc-100 outline-none focus:border-blue-500/50 transition-colors shadow-inner"
                      />
                    </div>
                    
                    <button onClick={handleSavePick} className="mt-auto px-5 py-3 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors rounded-md flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20">
                        <CheckCircle2 className="w-4 h-4" /> 保存竞猜
                    </button>
                </div>
              </div>

              {/* Right Main Pick'Em Board */}
              <div className="flex-1 flex flex-col bg-zinc-900/60 border border-white/5 rounded-lg shadow-xl relative backdrop-blur-md overflow-hidden min-h-[600px] lg:min-h-0">
                {/* Tabs Header */}
                <div className="h-12 border-b border-white/5 flex items-center px-4 justify-between bg-black/20 shrink-0 gap-4 overflow-x-auto custom-scrollbar">
                    <div className="flex bg-zinc-950 p-1 rounded gap-0.5 border border-white/5 shrink-0">
                      {[
                          { id: 'stage1', label: '第一阶段' },
                          { id: 'stage2', label: '第二阶段' },
                          { id: 'stage3', label: '第三阶段' },
                          { id: 'playoffs', label: '决胜阶段' }
                      ].map(tab => {
                          const isActive = activeStage === tab.id;
                          return (
                            <div 
                              key={tab.id}
                              onClick={() => setActiveStage(tab.id as StageKey)}
                              className={cn(
                                "px-3 py-1.5 rounded-[2px] text-[11px] font-bold cursor-pointer transition-colors flex items-center whitespace-nowrap",
                                isActive ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                              )}
                            >
                              {isActive ? (
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block mr-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                              ) : (
                                <span className="w-1 h-1 bg-zinc-700 rounded-full inline-block mr-1.5"></span>
                              )}
                              {tab.label}
                            </div>
                          );
                      })}
                    </div>
                    <div className="flex gap-2">
                        <button 
                          onClick={() => {
                              setPicks(prev => ({
                                ...prev,
                                [activeStage]: (prev[activeStage] || defaultPicks[activeStage] || []).map(s => ({ ...s, teamId: undefined }))
                              }));
                          }}
                          className="p-1.5 border border-white/10 hover:bg-white/20 rounded-[3px] transition-colors opacity-80 text-zinc-400 group flex items-center justify-center w-7 h-7"
                          title="重置当前阶段"
                        >
                          <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                    </div>
                </div>
                {/* Content Area */}
                <div className="flex-1 flex flex-col xl:flex-row min-h-0 overflow-hidden relative">
                  {/* Team Drag Source Pool */}
                  {activeStage !== 'playoffs' && (
                    <div className="w-full xl:w-[320px] max-h-[35vh] xl:max-h-none p-4 lg:p-6 flex flex-col min-h-0 overflow-hidden border-b xl:border-r border-white/5 bg-zinc-900/30 shrink-0 z-10 shadow-[5px_0_15px_rgba(0,0,0,0.2)]">
                        <div className="text-[12px] font-bold text-zinc-400 mb-2 xl:mb-6 flex items-center gap-2">
                            <Clock className="w-4 h-4 opacity-60"/> {getStageStatus(activeStage)}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-[24px] h-[24px] bg-black/40 flex items-center justify-center rounded-full opacity-60">
                              <div className="w-[14px] h-[14px] border-2 border-dashed border-zinc-500 rounded-full"></div>
                            </div>
                            <p className="text-[11px] text-zinc-500 font-medium">点击队伍选择，然后点击下方槽位填入；或直接拖动。</p>
                        </div>

                        {activeStage !== 'stage1' && activeStage !== 'playoffs' && currentPoolTeams.length < 16 && (
                            <div className="text-[11px] text-orange-400/90 mb-4 bg-orange-500/10 p-3 rounded border border-orange-500/20 shadow-inner">
                              请先在上一阶段选择8支晋级队伍。
                            </div>
                        )}

                        <div className="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-3 gap-3 flex-1 content-start overflow-y-auto pr-2 pb-2 xl:pb-10 min-h-[50px] custom-scrollbar">
                            {currentPoolTeams.map(team => {
                                const isPlaced = currentSlots.some(s => s.teamId === team.id);
                                const isSelected = selectedTeamId === team.id;
                                return (
                                  <div 
                                      key={team.id}
                                      draggable={!isPlaced}
                                      onDragStart={(e) => { e.dataTransfer.setData('teamId', team.id); e.dataTransfer.effectAllowed = 'copyMove'; }}
                                      onClick={() => {
                                          if (isPlaced) return;
                                          setSelectedTeamId(isSelected ? null : team.id);
                                      }}
                                      className={cn(
                                        "w-12 h-12 sm:w-[76px] sm:h-[76px] mx-auto flex items-center justify-center rounded-[6px] transition-all bg-black/20 hover:bg-white/10",
                                        isPlaced ? "opacity-15 grayscale pointer-events-none" : "cursor-pointer active:cursor-grabbing border",
                                        isSelected ? "border-blue-500 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "border-transparent hover:border-white/20 hover:shadow-md"
                                      )}
                                  >
                                      <div className="w-8 h-8 sm:w-[54px] sm:h-[54px] flex items-center justify-center pointer-events-none">
                                        <TeamLogo team={team} fallbackClasses="rounded-[4px] text-[10px] sm:text-[15px]" />
                                      </div>
                                  </div>
                                );
                            })}
                        </div>
                    </div>
                  )}
                  
                  {/* Main PickEm Area Layout */}
                  <div className="flex-1 flex flex-col min-w-0 bg-zinc-950/20 overflow-hidden xl:mx-4 xl:my-4 rounded-xl xl:border border-white/5 relative shadow-inner">
                      {activeStage === 'playoffs' ? (
                          <div className="flex-1 w-full h-full overflow-auto custom-scrollbar">
                              <PlayoffsBracket 
                                slots={currentSlots} 
                                onDrop={handleDrop}
                                onClick={(slotId, teamId) => {
                                    if (selectedTeamId) {
                                      handleAssignSlot(selectedTeamId, slotId);
                                      setSelectedTeamId(null);
                                    } else if (teamId) {
                                      // Smart advance logic for Playoffs
                                      const isQF = slotId.includes('qf-');
                                      const isSF = slotId.includes('sf-');
                                      const isFinal = slotId.includes('final-');

                                      if (isQF) {
                                          const qfNum = parseInt(slotId.split('-')[2]);
                                          const targetSf = `playoffs-sf-${Math.ceil(qfNum / 2)}`;
                                          handleAssignSlot(teamId, targetSf);
                                      } else if (isSF) {
                                          const sfNum = parseInt(slotId.split('-')[2]);
                                          const targetFinal = `playoffs-final-${Math.ceil(sfNum / 2)}`;
                                          handleAssignSlot(teamId, targetFinal);
                                      } else if (isFinal) {
                                          handleAssignSlot(teamId, 'playoffs-champion');
                                      } else if (slotId.includes('champion')) {
                                          handleClear(slotId);
                                      } else {
                                          handleClear(slotId);
                                      }
                                    }
                                }}
                              />
                          </div>
                      ) : (
                          <>
                              {/* Top: Mock Background Swiss Bracket */}
                              <div className="flex-1 min-h-[300px] items-center justify-center relative overflow-hidden hidden xl:flex">
                                <SwissBracket activeStage={activeStage} />
                              </div>
                              
                              {/* Bottom: Playable Slots */}
                              <div className="w-full bg-zinc-950/80 backdrop-blur-md shrink-0 shadow-[0_-15px_30px_rgba(0,0,0,0.5)] border-t border-white/5 z-20 overflow-y-auto p-4 xl:p-6 pb-6 relative flex-1 xl:flex-none">
                                  <PickEmDock 
                                    slots={currentSlots} 
                                    showResults={showResults} 
                                    onToggleResults={() => setShowResults(!showResults)} 
                                    onDrop={handleDrop}
                                    onClick={(slotId, teamId) => {
                                        if (selectedTeamId) {
                                          handleAssignSlot(selectedTeamId, slotId);
                                          setSelectedTeamId(null);
                                        } else if (teamId) {
                                          handleClear(slotId);
                                        }
                                    }}
                                  />
                              </div>
                          </>
                      )}
                  </div>
                </div>
              </div>
            </>
          )}

          {viewMode === 'summary' && (
            <div className="flex-1 flex flex-col bg-zinc-900/60 border border-white/5 rounded-lg shadow-xl relative backdrop-blur-md overflow-hidden">
                <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6 shrink-0">
                      <h2 className="text-sm font-bold text-zinc-100">社区竞猜详情汇总 ({communityPicks.length})</h2>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                          <button 
                              onClick={() => {
                                  setImageExportIds(communityPicks.map(p => p.id));
                                  setShowImageExportModal(true);
                              }}
                              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
                          >
                              导出为图片
                          </button>
                          <div className="flex bg-black/40 p-1 rounded-md border border-white/5 overflow-x-auto custom-scrollbar shrink-0 max-w-full">
                              {['stage1', 'stage2', 'stage3', 'playoffs'].map(tabId => {
                                  const stageLabel = tabId === 'stage1' ? '第一阶段' : tabId === 'stage2' ? '第二阶段' : tabId === 'stage3' ? '第三阶段' : '决胜阶段';
                                  return (
                                    <div 
                                      key={`sum-${tabId}`}
                                      onClick={() => setActiveStage(tabId as StageKey)}
                                      className={cn(
                                        "px-3 py-1 text-[11px] font-bold rounded-[2px] cursor-pointer transition-colors whitespace-nowrap shrink-0",
                                        activeStage === tabId ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                                      )}
                                    >
                                      {stageLabel}
                                    </div>
                                  );
                              })}
                          </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 xl:grid-cols-2 gap-4 content-start">
                      <div className="bg-zinc-900/80 border border-emerald-500/20 p-4 rounded-lg shadow-sm flex flex-col gap-4 xl:col-span-2">
                          <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-3">
                              <h3 className="text-sm font-bold text-emerald-400 tracking-wider">实际比赛结果</h3>
                          </div>
                          {activeStage === 'playoffs' ? (
                              <MiniPlayoffsBracket 
                                  slots={PLAYOFFS_SLOTS.map((s, i) => ({ ...s, teamId: ACTUAL_RESULTS[activeStage]?.filter(x => x.type === s.type)[i]?.teamId || ACTUAL_RESULTS[activeStage]?.[i]?.teamId, resultStatus: 'unknown' }))}
                              />
                          ) : (
                              <MiniPicksDisplay 
                                  title30="3:0 晋级"
                                  slots30={Array(2).fill(null).map((_, i) => ({ id: `r30-${i}`, type: '3-0' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter(s => s.type === '3-0')[i]?.teamId || ACTUAL_RESULTS[activeStage]?.[i]?.teamId, resultStatus: 'unknown' }))}
                                  titleAdvance="3:1 3:2 晋级"
                                  slotsAdvance={Array(6).fill(null).map((_, i) => ({ id: `ra-${i}`, type: 'advance' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter(s => s.type === 'advance')[i]?.teamId || ACTUAL_RESULTS[activeStage]?.[i+2]?.teamId, resultStatus: 'unknown' }))}
                                  title03="0:3 淘汰"
                                  slots03={Array(2).fill(null).map((_, i) => ({ id: `r03-${i}`, type: '0-3' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter(s => s.type === '0-3')[i]?.teamId || ACTUAL_RESULTS[activeStage]?.[i+8]?.teamId, resultStatus: 'unknown' }))}
                              />
                          )}
                      </div>
                      
                      {communityPicks.length === 0 && (
                          <div className="col-span-full py-12 text-center text-zinc-500 text-sm">
                              暂无社区竞猜数据
                          </div>
                      )}

                      {sortedCommunityPicks.map(participant => {
                          const theirPicks = participant.picks[activeStage] || [];

                          if (activeStage === 'playoffs') {
                              return (
                                  <div key={participant.id} className="bg-zinc-900/80 border border-white/5 p-4 rounded-lg shadow-sm flex flex-col gap-4">
                                      <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                                          <div className="font-bold text-sm text-zinc-200">{participant.name}</div>
                                      </div>
                                      <MiniPlayoffsBracket 
                                          slots={PLAYOFFS_SLOTS.map((s) => {
                                              const pick = theirPicks.find(p => p.id === s.id || p.id === `playoffs-${s.id}`);
                                              return { ...s, teamId: pick?.teamId || null, resultStatus: 'unknown' };
                                          })}
                                      />
                                  </div>
                              );
                          }

                          const picks30 = theirPicks.filter(s => s.type === '3-0');
                          const sorted30Picks = [...picks30].sort((a, b) => {
                            const aKey = a.teamId ? `adv-${a.teamId}` : null;
                            const bKey = b.teamId ? `adv-${b.teamId}` : null;
                            if (!aKey && !bKey) return 0;
                            if (!aKey) return 1;
                            if (!bKey) return -1;
                            const freqDiff = (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0);
                            if (freqDiff !== 0) return freqDiff;
                            return a.teamId!.localeCompare(b.teamId!);
                          }).map(s => ({ ...s, resultStatus: checkPrediction(s.teamId, '3-0', activeStage) }));

                          const picksAdvance = theirPicks.filter(s => s.type === 'advance');
                          const sortedAdvancePicks = [...picksAdvance].sort((a, b) => {
                            const aKey = a.teamId ? `adv-${a.teamId}` : null;
                            const bKey = b.teamId ? `adv-${b.teamId}` : null;
                            if (!aKey && !bKey) return 0;
                            if (!aKey) return 1;
                            if (!bKey) return -1;
                            const freqDiff = (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0);
                            if (freqDiff !== 0) return freqDiff;
                            return a.teamId!.localeCompare(b.teamId!);
                          }).map(s => ({ ...s, resultStatus: checkPrediction(s.teamId, 'advance', activeStage) }));

                          const elimPicks = theirPicks.filter(s => s.type === '0-3');
                          const sortedElimPicks = [...elimPicks].sort((a, b) => {
                            const aKey = a.teamId ? `elim-${a.teamId}` : null;
                            const bKey = b.teamId ? `elim-${b.teamId}` : null;
                            if (!aKey && !bKey) return 0;
                            if (!aKey) return 1;
                            if (!bKey) return -1;
                            const freqDiff = (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0);
                            if (freqDiff !== 0) return freqDiff;
                            return a.teamId!.localeCompare(b.teamId!);
                          }).map(s => ({ ...s, resultStatus: checkPrediction(s.teamId, '0-3', activeStage) }));
                          
                          const statusData = getSetStatus(theirPicks, activeStage);
                          const statusStyles = getStatusStyles(statusData);
                          
                          return (
                              <div key={participant.id} className={cn("p-4 rounded-lg flex flex-col gap-4 border", statusStyles.bg, statusStyles.border)}>
                                <div className={cn("flex items-center justify-between border-b pb-3", statusStyles.border)}>
                                    <div className="font-bold text-sm text-zinc-200">{participant.name}</div>
                                    <PickSetStatusText statusData={statusData} />
                                </div>
                                <MiniPicksDisplay 
                                    title30="3:0 晋级"
                                    slots30={sorted30Picks}
                                    titleAdvance="3:1 3:2 晋级"
                                    slotsAdvance={sortedAdvancePicks}
                                    title03="0:3 淘汰"
                                    slots03={sortedElimPicks}
                                />
                              </div>
                          )
                      })}
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showImageExportModal} onClose={() => { setShowImageExportModal(false); setExportPreviewUrl(null); }} title={exportPreviewUrl ? "预览" : "导出为图片"}>
          {exportPreviewUrl ? (
              <div className="flex flex-col gap-4">
                  <div className="bg-black/40 rounded-lg overflow-auto max-h-[60vh] border border-white/10 p-2 relative custom-scrollbar">
                       <img src={exportPreviewUrl} alt="Preview" className="w-full h-auto rounded" />
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                      <button 
                          onClick={() => setExportPreviewUrl(null)}
                          className="px-4 py-2 border border-white/10 hover:bg-white/5 text-zinc-300 font-bold text-sm transition-colors rounded-md"
                      >
                          返回修改
                      </button>
                      <button 
                          onClick={async () => {
                              try {
                                  const response = await fetch(exportPreviewUrl);
                                  const blob = await response.blob();
                                  await navigator.clipboard.write([
                                      new ClipboardItem({ [blob.type]: blob })
                                  ]);
                                  // Could show a toast, but alert works for now
                                  alert('图片已复制到剪贴板！');
                              } catch (err) {
                                  console.error(err);
                                  alert('复制失败，请尝试直接下载。');
                              }
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors rounded-md shadow-lg shadow-blue-900/20 flex items-center gap-2"
                      >
                          <Copy className="w-4 h-4" /> 复制图片
                      </button>
                      <button 
                          onClick={handleDownloadImage}
                          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors rounded-md shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                      >
                          <Download className="w-4 h-4" /> 下载图片
                      </button>
                  </div>
              </div>
          ) : (
          <div className="flex flex-col gap-4">
              <div 
                  className="flex items-center justify-between p-3 bg-zinc-800/50 rounded cursor-pointer border border-white/5"
                  onClick={() => setImageExportIncludeResults(!imageExportIncludeResults)}
              >
                  <span className="text-sm font-bold text-zinc-200">包含实际比赛结果</span>
                  {imageExportIncludeResults ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5 text-zinc-500" />}
              </div>
              <div 
                  className="flex items-center justify-between p-3 bg-zinc-800/50 rounded cursor-pointer border border-white/5"
                  onClick={() => setImageExportShowTeamNames(!imageExportShowTeamNames)}
              >
                  <span className="text-sm font-bold text-zinc-200">显示队伍名称</span>
                  {imageExportShowTeamNames ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5 text-zinc-500" />}
              </div>

              <div className="flex flex-col gap-2">
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">展示样式</div>
                  <div className="flex gap-2">
                      <button 
                          onClick={() => setImageExportStyle('standard')}
                          className={`flex-1 py-2 text-sm font-bold rounded border transition-colors ${imageExportStyle === 'standard' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-zinc-800/50 text-zinc-400 border-white/5 hover:bg-zinc-800'}`}
                      >标准</button>
                      <button 
                          onClick={() => setImageExportStyle('compact')}
                          className={`flex-1 py-2 text-sm font-bold rounded border transition-colors ${imageExportStyle === 'compact' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-zinc-800/50 text-zinc-400 border-white/5 hover:bg-zinc-800'}`}
                      >紧凑</button>
                  </div>
              </div>

              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-2 px-1">选择包含的社区竞猜</div>
              <div className="flex flex-col gap-2">
                  <div 
                      className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded cursor-pointer hover:bg-zinc-800 transition-colors border border-white/5"
                      onClick={() => setImageExportIds(imageExportIds.length === communityPicks.length ? [] : communityPicks.map(p => p.id))}
                  >
                      {imageExportIds.length === communityPicks.length && communityPicks.length > 0 ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5 text-zinc-500" />}
                      <span className="font-bold text-sm text-zinc-200">全选 ({imageExportIds.length}/{communityPicks.length})</span>
                  </div>
                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[160px] custom-scrollbar">
                      {sortedCommunityPicks.map(item => {
                          const isSelected = imageExportIds.includes(item.id);
                          return (
                              <div 
                                  key={item.id}
                                  className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors border ${isSelected ? 'bg-blue-500/10 border-blue-500/30' : 'bg-black/20 border-white/5 hover:bg-black/40'}`}
                                  onClick={() => setImageExportIds(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id])}
                              >
                                  {isSelected ? <CheckSquare className="w-5 h-5 text-blue-400" /> : <Square className="w-5 h-5 text-zinc-500" />}
                                  <span className="font-bold text-sm text-zinc-200 truncate">{item.name}</span>
                              </div>
                          );
                      })}
                  </div>
              </div>
              <div className="mt-4 flex justify-end">
                  <button 
                      onClick={handleGeneratePreview}
                      disabled={isExportingImage || imageExportIds.length === 0}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors rounded-md shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                      {isExportingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                      生成预览
                  </button>
              </div>
          </div>
          )}
      </Modal>

      {/* Hidden container for image export */}
      {(showImageExportModal || isExportingImage) && (
          <div className="absolute left-[-9999px] top-[-9999px]">
              <div 
                  ref={exportContainerRef} 
                  className="bg-[#070b09] p-8 w-max min-w-[500px] max-w-[1000px] flex flex-col gap-6"
                  style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
              >
                  <div className="flex flex-col items-center justify-center border-b border-white/10 pb-6 mb-2">
                       <h1 className="text-2xl font-black text-white tracking-widest flex items-center gap-2">IEM Cologne 2026 - {activeStage === 'stage1' ? '第一阶段' : activeStage === 'stage2' ? '第二阶段' : activeStage === 'stage3' ? '第三阶段' : '决胜阶段'}</h1>
                  </div>
                  {imageExportIncludeResults && imageExportStyle !== 'compact' && (
                      <div className="bg-zinc-900/80 border border-emerald-500/20 p-5 rounded-lg flex flex-col gap-4">
                          <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-3">
                              <h3 className="text-base font-bold text-emerald-400 tracking-wider">实际比赛结果</h3>
                          </div>
                          {activeStage === 'playoffs' ? (
                              <MiniPlayoffsBracket 
                                  slots={PLAYOFFS_SLOTS.map((s, i) => ({ ...s, teamId: ACTUAL_RESULTS[activeStage]?.[i]?.teamId, resultStatus: 'unknown' }))}
                                  showTeamNames={imageExportShowTeamNames}
                              />
                          ) : (
                              <MiniPicksDisplay 
                                  title30="3:0 晋级"
                                  slots30={Array(2).fill(null).map((_, i) => ({ id: `r30-${i}`, type: '3-0' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.[i]?.teamId, resultStatus: 'unknown' }))}
                                  titleAdvance="3:1 3:2 晋级"
                                  slotsAdvance={Array(6).fill(null).map((_, i) => ({ id: `ra-${i}`, type: 'advance' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.[i+2]?.teamId, resultStatus: 'unknown' }))}
                                  title03="0:3 淘汰"
                                  slots03={Array(2).fill(null).map((_, i) => ({ id: `r03-${i}`, type: '0-3' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.[i+8]?.teamId, resultStatus: 'unknown' }))}
                                  compact={false}
                                  showTeamNames={imageExportShowTeamNames}
                              />
                          )}
                      </div>
                  )}
                  <div className={`grid ${imageExportStyle === 'compact' ? 'grid-cols-1 gap-0 bg-zinc-900/80 border border-white/5 rounded-lg shadow-sm overflow-hidden' : 'grid-cols-1 gap-6'}`}>
                      {imageExportIncludeResults && imageExportStyle === 'compact' && (
                           <div className={`flex items-center gap-4 py-3 px-5 bg-emerald-900/20`}>
                               <div className="font-bold text-sm text-emerald-400 w-32 shrink-0 break-words line-clamp-2 leading-snug">实际比赛结果</div>
                               <div className="flex-1">
                                   {activeStage === 'playoffs' ? (
                                       <MiniPlayoffsBracket 
                                           slots={PLAYOFFS_SLOTS.map((s, i) => ({ ...s, teamId: ACTUAL_RESULTS[activeStage]?.filter(x => x.type === s.type)[i]?.teamId || ACTUAL_RESULTS[activeStage]?.[i]?.teamId, resultStatus: 'unknown' }))}
                                           compact={true}
                                           showTeamNames={imageExportShowTeamNames}
                                       />
                                   ) : (
                                       <MiniPicksDisplay 
                                           title30="3:0 晋级"
                                           slots30={Array(2).fill(null).map((_, i) => ({ id: `r30-${i}`, type: '3-0' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter(s => s.type === '3-0')[i]?.teamId || ACTUAL_RESULTS[activeStage]?.[i]?.teamId, resultStatus: 'unknown' }))}
                                           titleAdvance="3:1 3:2 晋级"
                                           slotsAdvance={Array(6).fill(null).map((_, i) => ({ id: `ra-${i}`, type: 'advance' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter(s => s.type === 'advance')[i]?.teamId || ACTUAL_RESULTS[activeStage]?.[i+2]?.teamId, resultStatus: 'unknown' }))}
                                           title03="0:3 淘汰"
                                           slots03={Array(2).fill(null).map((_, i) => ({ id: `r03-${i}`, type: '0-3' as SlotType, teamId: ACTUAL_RESULTS[activeStage]?.filter(s => s.type === '0-3')[i]?.teamId || ACTUAL_RESULTS[activeStage]?.[i+8]?.teamId, resultStatus: 'unknown' }))}
                                           compact={true}
                                           showTeamNames={imageExportShowTeamNames}
                                       />
                                   )}
                               </div>
                           </div>
                      )}
                      {sortedCommunityPicks.filter(p => imageExportIds.includes(p.id)).map((participant, index) => {
                          const theirPicks = participant.picks[activeStage] || [];
                          
                          if (activeStage === 'playoffs') {
                              return (
                                   <div key={participant.id} className={imageExportStyle === 'compact' ? `flex items-center gap-4 py-3 px-5 ${(index !== 0 || imageExportIncludeResults) ? 'border-t border-white/5' : ''}` : "bg-zinc-900/80 border border-white/5 p-5 rounded-lg shadow-sm flex flex-col gap-4"}>
                                       {imageExportStyle === 'compact' ? (
                                           <div className="font-bold text-sm text-zinc-200 w-32 shrink-0 break-words line-clamp-2 leading-snug">{participant.name}</div>
                                       ) : (
                                           <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                                               <div className="font-bold text-base text-zinc-200">{participant.name}</div>
                                           </div>
                                       )}
                                       <div className={imageExportStyle === 'compact' ? "flex-1" : ""}>
                                           <MiniPlayoffsBracket 
                                               slots={PLAYOFFS_SLOTS.map((s) => {
                                                   const pick = theirPicks.find(p => p.id === s.id || p.id === `playoffs-${s.id}`);
                                                   return { ...s, teamId: pick?.teamId || null, resultStatus: 'unknown' };
                                               })}
                                               compact={imageExportStyle === 'compact'}
                                               showTeamNames={imageExportShowTeamNames}
                                           />
                                       </div>
                                   </div>
                              );
                          }

                          const picks30 = theirPicks.filter(s => s.type === '3-0');
                          const sorted30Picks = [...picks30].sort((a, b) => {
                            const aKey = a.teamId ? `adv-${a.teamId}` : null;
                            const bKey = b.teamId ? `adv-${b.teamId}` : null;
                            if (!aKey && !bKey) return 0;
                            if (!aKey) return 1;
                            if (!bKey) return -1;
                            return (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0) || a.teamId!.localeCompare(b.teamId!);
                          }).map(s => ({ ...s, resultStatus: imageExportIncludeResults ? checkPrediction(s.teamId, '3-0', activeStage) : undefined }));

                          const picksAdvance = theirPicks.filter(s => s.type === 'advance');
                          const sortedAdvancePicks = [...picksAdvance].sort((a, b) => {
                            const aKey = a.teamId ? `adv-${a.teamId}` : null;
                            const bKey = b.teamId ? `adv-${b.teamId}` : null;
                            if (!aKey && !bKey) return 0;
                            if (!aKey) return 1;
                            if (!bKey) return -1;
                            return (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0) || a.teamId!.localeCompare(b.teamId!);
                          }).map(s => ({ ...s, resultStatus: imageExportIncludeResults ? checkPrediction(s.teamId, 'advance', activeStage) : undefined }));

                          const elimPicks = theirPicks.filter(s => s.type === '0-3');
                          const sortedElimPicks = [...elimPicks].sort((a, b) => {
                            const aKey = a.teamId ? `elim-${a.teamId}` : null;
                            const bKey = b.teamId ? `elim-${b.teamId}` : null;
                            if (!aKey && !bKey) return 0;
                            if (!aKey) return 1;
                            if (!bKey) return -1;
                            return (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0) || a.teamId!.localeCompare(b.teamId!);
                          }).map(s => ({ ...s, resultStatus: imageExportIncludeResults ? checkPrediction(s.teamId, '0-3', activeStage) : undefined }));
                          
                          const statusData = getSetStatus(theirPicks, activeStage);
                          const statusStyles = getStatusStyles(statusData);
                          
                          if (imageExportStyle === 'compact') {
                              return (
                                  <div key={participant.id} className={cn(`flex items-center gap-4 py-3 px-5 ${(index !== 0 || imageExportIncludeResults) ? 'border-t' : ''}`, statusStyles.border, statusStyles.bg)}>
                                      <div className="font-bold text-sm text-zinc-200 w-32 shrink-0 break-words line-clamp-2 leading-snug flex flex-col gap-1.5">
                                          {participant.name}
                                          <PickSetStatusText statusData={statusData} />
                                      </div>
                                      <div className="flex-1">
                                          <MiniPicksDisplay 
                                              title30="3:0 晋级"
                                              slots30={sorted30Picks}
                                              titleAdvance="3:1 3:2 晋级"
                                              slotsAdvance={sortedAdvancePicks}
                                              title03="0:3 淘汰"
                                              slots03={sortedElimPicks}
                                              compact={true}
                                              showTeamNames={imageExportShowTeamNames}
                                          />
                                      </div>
                                  </div>
                              );
                          }
                          
                          return (
                              <div key={participant.id} className={cn("border p-5 rounded-lg flex flex-col gap-4", statusStyles.bg, statusStyles.border)}>
                                <div className={cn("flex items-center justify-between border-b pb-3", statusStyles.border)}>
                                    <div className="font-bold text-base text-zinc-200">{participant.name}</div>
                                    <PickSetStatusText statusData={statusData} />
                                </div>
                                <MiniPicksDisplay 
                                    title30="3:0 晋级"
                                    slots30={sorted30Picks}
                                    titleAdvance="3:1 3:2 晋级"
                                    slotsAdvance={sortedAdvancePicks}
                                    title03="0:3 淘汰"
                                    slots03={sortedElimPicks}
                                    showTeamNames={imageExportShowTeamNames}
                                />
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
      )}
    </>
  );
}
