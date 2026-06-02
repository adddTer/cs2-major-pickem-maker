import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TEAMS, INITIAL_SLOTS, PLAYOFFS_SLOTS } from './data/teams';
import { ACTUAL_RESULTS } from './data/matches';
import { PickSlot, PickSet, StageKey, SlotType } from './types';
import { TopNav } from './components/TopNav';
import { HomeView } from './views/HomeView';
import { EditView } from './views/EditView';
import { SummaryView } from './views/SummaryView';
import { ImageExportModal } from './components/ImageExportModal';
import { useMatchLogic } from './hooks/useMatchLogic';

export default function App() {
  type ViewMode = 'home' | 'edit' | 'summary';
  
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [newNickname, setNewNickname] = useState('');
  const [activeStage, setActiveStage] = useState<StageKey>('stage1');
  
  const [showResults, setShowResults] = useState(false);
  const [communityPicks, setCommunityPicks] = useState<PickSet[]>([]);
  const [currentPickSetId, setCurrentPickSetId] = useState<string | null>(null);

  const defaultPicks: Record<string, PickSlot[]> = {
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
  
  const [mobileView, setMobileView] = useState<'bracket' | 'picks'>('picks');
  const [showProbabilityInSummary, setShowProbabilityInSummary] = useState(false);
  
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const {
      getScheduledMatches,
      simulatedFutures,
      getTeamRecords,
      getComputedActuals,
      activeStageActuals,
      checkPrediction,
      getSetStatus,
  } = useMatchLogic(activeStage);

  const handleGeneratePreview = async () => {
    if (imageExportIds.length === 0) {
      alert("请至少选择一项");
      return;
    }
    if (!exportContainerRef.current) return;
    setIsExportingImage(true);
    
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

  const itemFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    communityPicks.forEach(p => {
      const stagePicks = p.picks[activeStage] || [];
      stagePicks.forEach(slot => {
        if (slot.teamId) {
          const type = slot.type === '0-3' ? 'elim' : 'adv';
          const key = `${type}-${slot.teamId}`;
          freq[key] = (freq[key] || 0) + 1;
        }
      });
    });
    return freq;
  }, [communityPicks, activeStage]);

  const sortedCommunityPicks = useMemo(() => {
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
  }, [communityPicks, activeStage, itemFreq]);

  const getStageStatus = (stage: string) => {
    const isComplete = (stage === 'playoffs' && ACTUAL_RESULTS[stage]?.length >= 15) || 
                       (stage !== 'playoffs' && ACTUAL_RESULTS[stage]?.length >= 16);
                       
    if (isComplete) return `比赛已结束`;

    const dates: Record<string, { start: Date, end: Date, label?: string }> = {
      stage1: { start: new Date('2026-06-02T10:30:00Z'), end: new Date('2026-06-05T23:59:59Z') },
      stage2: { start: new Date('2026-06-06T10:30:00Z'), end: new Date('2026-06-09T23:59:59Z') },
      stage3: { start: new Date('2026-06-11T09:00:00Z'), end: new Date('2026-06-15T23:59:59Z') },
      playoffs: { start: new Date('2026-06-18T13:45:00Z'), end: new Date('2026-06-21T15:00:00Z') },
    };
    
    const { start } = dates[stage];
    const now = new Date();

    if (now < start) {
      const diff = start.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);

      if (days > 0) return `距离开始还剩 ${days}天 ${hours}小时`;
      if (hours > 0) return `距离开始还剩 ${hours}小时 ${mins}分钟`;
      return `距离开始还剩 ${mins}分钟`;
    }
    return `比赛进行中`;
  };

  const getAvailableTeams = (stage: string) => {
    if (stage === 'playoffs') return TEAMS;
    if (stage === 'stage1') return TEAMS.filter(t => t.startStage === 1);
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

    setPicks((prev: Record<string, PickSlot[]>) => {
        if (activeStage === 'playoffs' && slotId.includes('qf-')) return prev;

        const nextStage = [...(prev[activeStage] || defaultPicks[activeStage] || [])];
        const targetIdx = nextStage.findIndex((s: PickSlot) => s.id === slotId);
        
        if (activeStage === 'playoffs') {
             const oldTeamId = nextStage[targetIdx].teamId;
             nextStage[targetIdx] = { ...nextStage[targetIdx], teamId };

              if (oldTeamId && oldTeamId !== teamId) {
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
                             const nextSlotIdx = nextStage.findIndex((s: PickSlot) => s.id === nextId);
                             if (nextSlotIdx !== -1 && nextStage[nextSlotIdx].teamId === removedTeam) {
                                  nextStage[nextSlotIdx] = { ...nextStage[nextSlotIdx], teamId: undefined };
                                  cascadeClear(nextId, removedTeam);
                             }
                        }
                   };
                   cascadeClear(slotId, oldTeamId);
              }
             return { ...prev, [activeStage]: nextStage };
        }

        const existingIdx = nextStage.findIndex((s: PickSlot) => s.teamId === teamId);
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
      setPicks((prev: Record<string, PickSlot[]>) => {
          if (activeStage === 'playoffs' && slotId.includes('qf-')) return prev;

          const nextStage = [...(prev[activeStage] || defaultPicks[activeStage] || [])];
          const idx = nextStage.findIndex((s: PickSlot) => s.id === slotId);
          if (idx === -1) return prev;
          
          const oldTeamId = nextStage[idx].teamId;
          nextStage[idx] = { ...nextStage[idx], teamId: undefined };

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
                          const nextSlotIdx = nextStage.findIndex((s: PickSlot) => s.id === nextId);
                          if (nextSlotIdx !== -1 && nextStage[nextSlotIdx].teamId === removedTeam) {
                               nextStage[nextSlotIdx] = { ...nextStage[nextSlotIdx], teamId: undefined };
                               cascadeClear(nextId, removedTeam);
                          }
                     }
                };
                cascadeClear(slotId, oldTeamId);
          }

          return { ...prev, [activeStage]: nextStage };
      });
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/10 rounded-full blur-[150px] pointer-events-none z-0" />
        
        {/* Top Navbar */}
        <TopNav 
           viewMode={viewMode}
           setViewMode={setViewMode}
           currentPickSetId={currentPickSetId}
        />

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
            <EditView 
              newNickname={newNickname}
              setNewNickname={setNewNickname}
              handleSavePick={handleSavePick}
              activeStage={activeStage}
              setActiveStage={setActiveStage}
              picks={picks}
              setPicks={setPicks}
              defaultPicks={defaultPicks}
              currentSlots={currentSlots}
              showResults={showResults}
              setShowResults={setShowResults}
              mobileView={mobileView}
              setMobileView={setMobileView}
              getStageStatus={getStageStatus}
              currentPoolTeams={currentPoolTeams}
              selectedTeamId={selectedTeamId}
              setSelectedTeamId={setSelectedTeamId}
              handleDrop={handleDrop}
              handleAssignSlot={handleAssignSlot}
              handleClear={handleClear}
              checkPrediction={checkPrediction}
              activeStageActuals={activeStageActuals}
              getSetStatus={getSetStatus}
            />
          )}

          {viewMode === 'summary' && (
            <SummaryView 
              communityPicks={communityPicks}
              showProbabilityInSummary={showProbabilityInSummary}
              setShowProbabilityInSummary={setShowProbabilityInSummary}
              setImageExportIds={setImageExportIds}
              setShowImageExportModal={setShowImageExportModal}
              activeStage={activeStage}
              setActiveStage={setActiveStage}
              ACTUAL_RESULTS={ACTUAL_RESULTS}
              PLAYOFFS_SLOTS={PLAYOFFS_SLOTS}
              sortedCommunityPicks={sortedCommunityPicks}
              getSetStatus={getSetStatus}
              itemFreq={itemFreq}
              checkPrediction={checkPrediction}
            />
          )}
        </div>
      </div>

      <ImageExportModal 
        showImageExportModal={showImageExportModal}
        setShowImageExportModal={setShowImageExportModal}
        exportPreviewUrl={exportPreviewUrl}
        setExportPreviewUrl={setExportPreviewUrl}
        imageExportIncludeResults={imageExportIncludeResults}
        setImageExportIncludeResults={setImageExportIncludeResults}
        imageExportShowTeamNames={imageExportShowTeamNames}
        setImageExportShowTeamNames={setImageExportShowTeamNames}
        imageExportStyle={imageExportStyle}
        setImageExportStyle={setImageExportStyle}
        imageExportIds={imageExportIds}
        setImageExportIds={setImageExportIds}
        communityPicks={communityPicks}
        sortedCommunityPicks={sortedCommunityPicks}
        isExportingImage={isExportingImage}
        handleGeneratePreview={handleGeneratePreview}
        handleDownloadImage={handleDownloadImage}
        activeStage={activeStage}
        PLAYOFFS_SLOTS={PLAYOFFS_SLOTS}
        ACTUAL_RESULTS={ACTUAL_RESULTS}
        getSetStatus={getSetStatus}
        itemFreq={itemFreq}
        checkPrediction={checkPrediction}
        exportContainerRef={exportContainerRef}
      />
    </>
  );
}
