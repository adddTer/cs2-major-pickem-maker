import React from "react";
import { PickSet, StageKey, SlotType } from "../types";
import { ExportContext } from "../lib/ExportContext";
import { RefreshCw, Copy, Download } from "lucide-react";
import { dialog } from "./DialogManager";
import { MiniPlayoffsBracket } from "./MiniPlayoffsBracket";
import { MiniPicksDisplay } from "./MiniPicksDisplay";
import { PickSetStatusText, getStatusStyles } from "./PickSetStatus";
import { SwissBracket } from "./SwissBracket";
import { simulateSwiss } from "../utils/simulateSwiss";
import { MATCHES } from "../data/matches";
import { TEAMS } from "../data/teams";
import { cn } from "../lib/utils";
import { PopupUI } from "./PopupUI";

interface ImageExportModalProps {
  showImageExportModal: boolean;
  setShowImageExportModal: (val: boolean) => void;
  exportPreviewUrl: string | null;
  setExportPreviewUrl: (val: string | null) => void;
  imageExportShowPrevStage: boolean;
  setImageExportShowPrevStage: (val: boolean) => void;
  imageExportShowProbabilities: boolean;
  setImageExportShowProbabilities: (val: boolean) => void;
  imageExportShowTeamNames: boolean;
  setImageExportShowTeamNames: (val: boolean) => void;
  imageExportTheme: "light" | "dark";
  setImageExportTheme: (val: "light" | "dark") => void;
  imageExportShowIcon: boolean;
  setImageExportShowIcon: (val: boolean) => void;
  imageExportShowName: boolean;
  setImageExportShowName: (val: boolean) => void;
  imageExportStyle: "standard" | "compact";
  setImageExportStyle: (val: "standard" | "compact") => void;
  imageExportSimCount: number;
  setImageExportSimCount: (val: number) => void;
  imageExportIds: string[];
  setImageExportIds: React.Dispatch<React.SetStateAction<string[]>>;
  communityPicks: PickSet[];
  sortedCommunityPicks: PickSet[];
  isExportingImage: boolean;
  handleGeneratePreview: () => void;
  handleDownloadImage: () => void;
  activeStage: StageKey;
  PLAYOFFS_SLOTS: any[];
  ACTUAL_RESULTS: any;
  getSetStatus: (picks: any[], stage: string, customFutures?: any[]) => any;
  itemFreq: Record<string, number>;
  checkPrediction: (
    teamId: string | null,
    type: SlotType,
    stage: string,
  ) => "correct" | "incorrect" | "unknown";
  simulatedFutures: any[];
  isSimulatingProbability?: boolean;
  simulationProgress?: number;
  exportContainerRef: React.RefObject<HTMLDivElement>;
  currentEvent?: import("../types").TournamentEvent;
}

export const ImageExportModal: React.FC<ImageExportModalProps> = ({
  showImageExportModal,
  setShowImageExportModal,
  exportPreviewUrl,
  setExportPreviewUrl,
  imageExportShowPrevStage,
  setImageExportShowPrevStage,
  imageExportShowProbabilities,
  setImageExportShowProbabilities,
  imageExportShowTeamNames,
  setImageExportShowTeamNames,
  imageExportTheme,
  setImageExportTheme,
  imageExportShowIcon,
  setImageExportShowIcon,
  imageExportShowName,
  setImageExportShowName,
  imageExportStyle,
  setImageExportStyle,
  imageExportSimCount,
  setImageExportSimCount,
  imageExportIds,
  setImageExportIds,
  communityPicks,
  sortedCommunityPicks,
  isExportingImage,
  handleGeneratePreview,
  handleDownloadImage,
  activeStage,
  PLAYOFFS_SLOTS,
  ACTUAL_RESULTS,
  getSetStatus,
  itemFreq,
  checkPrediction,
  simulatedFutures,
  isSimulatingProbability,
  simulationProgress = 0,
  exportContainerRef,
  currentEvent,
}) => {
  const [exportSession, setExportSession] = React.useState<number>(1);
  const [animFrame, setAnimFrame] = React.useState<Record<string, any> | null>(null);
  const [localSimulating, setLocalSimulating] = React.useState(false);
  const isSimRef = React.useRef(isSimulatingProbability);

  const hasActualPicks = ACTUAL_RESULTS[activeStage] && ACTUAL_RESULTS[activeStage].length > 0;
  const actualResultsPickSet: PickSet = {
    id: "actual_results",
    name: "赛段真实赛果",
    picks: ACTUAL_RESULTS,
    createdAt: Date.now(),
  };

  const extendedCommunityPicks = hasActualPicks ? [actualResultsPickSet, ...communityPicks] : communityPicks;
  const extendedSortedCommunityPicks = hasActualPicks ? [actualResultsPickSet, ...sortedCommunityPicks] : sortedCommunityPicks;

  React.useEffect(() => {
    isSimRef.current = isSimulatingProbability;
    if (isSimulatingProbability) {
      setLocalSimulating(true);
    }
  }, [isSimulatingProbability]);

  React.useEffect(() => {
    if (isExportingImage) setExportSession(Date.now());
  }, [isExportingImage]);

  React.useEffect(() => {
    if (localSimulating && activeStage !== "playoffs") {
      const stageMatchesMap = MATCHES[activeStage];
      if (!stageMatchesMap) return;

      const pastMatches: { t1: string; t2: string; winner: string }[] = [];
      const scheduledMatches: { t1: string; t2: string }[] = [];

      const r0 = stageMatchesMap["0:0"] || [];
      const orderedTeams = new Array(16).fill("");
      r0.forEach((m, idx) => {
        if (m.team1Id && m.team1Id !== "tbd") orderedTeams[idx] = m.team1Id;
        if (m.team2Id && m.team2Id !== "tbd")
          orderedTeams[15 - idx] = m.team2Id;
      });
      const allTeams = orderedTeams.filter((t) => t !== "");

      Object.values(stageMatchesMap).forEach((batch) => {
        batch.forEach((m) => {
          if (m.team1Id && m.team2Id && m.team1Id !== "tbd" && m.team2Id !== "tbd") {
            if (m.score1 !== undefined && m.score2 !== undefined && m.status === "past") {
              const t1Wins = m.score1! > m.score2!;
              pastMatches.push({ t1: m.team1Id, t2: m.team2Id, winner: t1Wins ? m.team1Id : m.team2Id });
            } else {
              scheduledMatches.push({ t1: m.team1Id, t2: m.team2Id });
            }
          }
        });
      });

      const teamStrengths: Record<string, number> = {};
      TEAMS.forEach((t) => { if (t.strength) teamStrengths[t.id] = t.strength; });

      let cancel = false;

      const runAnimationLoop = async () => {
        while (!cancel) {
          const results = simulateSwiss(allTeams, pastMatches, scheduledMatches, 1, teamStrengths, activeStage, undefined, currentEvent?.isSwissAllBo3);
          if (results && results.length > 0 && results[0].simPredictionsByRound) {
            const rounds = results[0].simPredictionsByRound;
            for (let i = 0; i < rounds.length; i++) {
              if (cancel) break;
              setAnimFrame(rounds[i]);
              await new Promise((r) => setTimeout(r, 600));
            }
            if (!cancel) {
              await new Promise((r) => setTimeout(r, 1500));
            }
          } else {
            await new Promise((r) => setTimeout(r, 1000));
          }

          if (!cancel && !isSimRef.current) {
             setLocalSimulating(false);
             break;
          }
        }
      };

      runAnimationLoop();

      return () => {
        cancel = true;
      };
    } else {
      setAnimFrame(null);
    }
  }, [localSimulating, activeStage]);

  const simulatingOverlay = (localSimulating && activeStage !== "playoffs") ? (
    <div className="fixed inset-0 z-[100000] bg-[#0A0A0A]/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="absolute top-12 flex flex-col items-center z-50 pointer-events-none w-full px-8">
        <h2 className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100 mb-2 tracking-wide flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 animate-spin" />
          正在生成概率分布...
        </h2>
        <div className="flex items-center gap-3 w-[320px] max-w-[80vw] mt-1">
           <span className="text-[0.625rem] font-mono text-zinc-500 dark:text-zinc-500 w-10 text-right">
             {Math.floor((simulationProgress / 100) * imageExportSimCount).toLocaleString()}
           </span>
           <div className="flex-1 h-1 bg-white dark:bg-zinc-800 rounded-full overflow-hidden relative">
             <div
                className="absolute left-0 top-0 h-full bg-zinc-300 transition-all duration-300 ease-out"
                style={{ width: `${Math.max(1, simulationProgress)}%` }}
             />
           </div>
           <span className="text-[0.625rem] font-mono text-zinc-500 dark:text-zinc-500 w-10 text-left">
             {imageExportSimCount.toLocaleString()}
           </span>
        </div>
      </div>
      <div className="w-full h-full opacity-75 pointer-events-none mt-4 flex-1 mix-blend-screen">
        <SwissBracket activeStage={activeStage} externalPredictions={animFrame || undefined} isAnimating={true} currentEvent={currentEvent} />
      </div>
    </div>
  ) : null;

  return (
    <>
      {simulatingOverlay}
      <PopupUI.Modal
        isOpen={showImageExportModal}
        onClose={() => {
          setShowImageExportModal(false);
          setExportPreviewUrl(null);
        }}
        title={exportPreviewUrl ? "预览" : "导出为图片"}
      >
        {exportPreviewUrl ? (
          <div className="flex flex-col gap-6">
            <div className="bg-zinc-100/50 dark:bg-zinc-900/50 rounded-2xl overflow-auto max-h-[60vh] border border-zinc-200/50 dark:border-zinc-800/50 p-3 relative custom-scrollbar shadow-inner flex items-center justify-center">
              <img
                src={exportPreviewUrl}
                alt="Preview"
                className="max-w-full h-auto rounded-xl drop-shadow-md"
              />
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <PopupUI.ActionButton
                label="返回修改"
                variant="secondary"
                onClick={() => setExportPreviewUrl(null)}
              />
              <PopupUI.ActionButton
                label="复制图片"
                icon={Copy}
                onClick={async () => {
                  try {
                    const response = await fetch(exportPreviewUrl);
                    const blob = await response.blob();
                    await navigator.clipboard.write([
                      new ClipboardItem({ [blob.type]: blob }),
                    ]);
                    dialog.alert("图片已复制到剪贴板！");
                  } catch (err) {
                    console.error(err);
                    dialog.alert("复制失败，请尝试直接下载。");
                  }
                }}
              />
              <PopupUI.ActionButton
                label="下载图片"
                icon={Download}
                variant="success"
                onClick={handleDownloadImage}
              />
            </div>
          </div>
        ) : isSimulatingProbability || isExportingImage ? (
          <div className="flex flex-col items-center justify-center py-12 gap-5">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin opacity-80" />
            <div className="text-zinc-900 dark:text-zinc-200 font-bold text-lg text-center whitespace-pre-line leading-relaxed">
              {isSimulatingProbability ? "模拟中……" : "渲染高清长图中..."}
            </div>
            {isSimulatingProbability && (
              <div className="w-full max-w-xs bg-black/80 dark:bg-white/80 dark:bg-zinc-800/80 rounded-full h-1.5 mt-2 overflow-hidden shadow-inner border border-black/5 dark:border-white/5 relative">
                <div
                  className="bg-blue-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${simulationProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activeStage !== "stage1" && (
              <PopupUI.SwitchRow
                label="显示上阶段成绩"
                checked={imageExportShowPrevStage}
                onChange={setImageExportShowPrevStage}
              />
            )}
            <div className="flex flex-col bg-black/5 dark:bg-white/5 rounded border border-black/5 dark:border-white/5 overflow-hidden">
              <PopupUI.SwitchRow
                label="显示概率而非对错"
                checked={imageExportShowProbabilities}
                onChange={setImageExportShowProbabilities}
                className="mb-0 border-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
              />
              
              <div
                className={`transition-all duration-300 ease-in-out grid ${
                  imageExportShowProbabilities
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden bg-zinc-200/20 dark:bg-black/20">
                  <div className="flex flex-col gap-3 p-4 border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">模拟次数精度</span>
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded shadow-sm border border-blue-500/20">
                        {imageExportSimCount >= 1000000 
                          ? `${(imageExportSimCount / 1000000).toFixed(1)}M` 
                          : `${imageExportSimCount / 1000}K`}
                      </span>
                    </div>
                    <PopupUI.Slider
                      min={10000}
                      max={5000000}
                      step={10000}
                      value={imageExportSimCount}
                      onChange={setImageExportSimCount}
                      leftLabel="10K (极速)"
                      rightLabel="5M (精确)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <PopupUI.SwitchRow
              label="显示队伍名称"
              checked={imageExportShowTeamNames}
              onChange={setImageExportShowTeamNames}
            />

            <div>
              <PopupUI.SectionTitle>展示样式</PopupUI.SectionTitle>
              <PopupUI.ButtonGroup
                options={[
                  { label: "标准", value: "standard" },
                  { label: "紧凑", value: "compact" }
                ]}
                value={imageExportStyle}
                onChange={(val) => setImageExportStyle(val as any)}
              />
            </div>

            <div>
              <PopupUI.SectionTitle>外观设置</PopupUI.SectionTitle>
              <PopupUI.ButtonGroup
                options={[
                  { label: "浅色", value: "light" },
                  { label: "深色", value: "dark" }
                ]}
                value={imageExportTheme}
                onChange={(val) => setImageExportTheme(val as any)}
              />
            </div>
            
            <PopupUI.SwitchRow
              label="显示比赛图标"
              checked={imageExportShowIcon}
              onChange={setImageExportShowIcon}
            />

            <PopupUI.SwitchRow
              label="显示比赛名称"
              checked={imageExportShowName}
              onChange={setImageExportShowName}
            />

            <PopupUI.SectionTitle>选择包含的社区竞猜</PopupUI.SectionTitle>
            <div className="flex flex-col gap-2">
              {(() => {
                const validIds = extendedCommunityPicks
                  .filter((p) => {
                    const stagePicks = p.picks[activeStage] || [];
                    if (activeStage === "playoffs") {
                      const userPicks = stagePicks.filter(
                        (s) => !s.id.startsWith("qf-"),
                      );
                      return (
                        userPicks.length === 7 &&
                        userPicks.every((s) => !!s.teamId)
                      );
                    } else {
                      return (
                        stagePicks.length === 10 &&
                        stagePicks.every((s) => !!s.teamId)
                      );
                    }
                  })
                  .map((p) => p.id);
                
                const validIdsCount = validIds.length;
                const isAllSelected = imageExportIds.length === validIdsCount && validIdsCount > 0;

                return (
                  <PopupUI.CheckboxRow
                    label={`全选完整预测`}
                    countText={`(${imageExportIds.length}/${validIdsCount})`}
                    checked={isAllSelected}
                    onChange={() => {
                      setImageExportIds(
                        isAllSelected ? [] : validIds,
                      );
                    }}
                    className="bg-black/5 dark:bg-white/5 border-none"
                  />
                );
              })()}
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[160px] custom-scrollbar">
                {extendedSortedCommunityPicks.map((item) => (
                  <PopupUI.CheckboxRow
                    key={item.id}
                    label={item.name}
                    checked={imageExportIds.includes(item.id)}
                    onChange={() =>
                      setImageExportIds((prev) =>
                        prev.includes(item.id)
                          ? prev.filter((x) => x !== item.id)
                          : [...prev, item.id],
                      )
                    }
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <PopupUI.ActionButton
                label="生成预览"
                isLoading={isExportingImage}
                disabled={isExportingImage || imageExportIds.length === 0}
                onClick={handleGeneratePreview}
              />
            </div>
          </div>
        )}
      </PopupUI.Modal>

      {/* Hidden container for image export */}
      {!isSimulatingProbability &&
        (showImageExportModal || isExportingImage) && (
          <ExportContext.Provider
            value={isExportingImage ? exportSession : false}
          >
            <div className="fixed left-0 top-0 opacity-0 pointer-events-none -z-50 overflow-visible">
              <div
                ref={exportContainerRef}
                className={cn(
                  "bg-zinc-50 dark:bg-[#070b09] p-8 w-max min-w-[500px] max-w-[1200px] flex flex-col gap-6",
                  imageExportTheme === "dark" ? "dark" : ""
                )}
                style={{
                  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                }}
              >
                <div className="relative">
                  {/* Background accent */}
                  {imageExportTheme === "dark" && (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />
                  )}
                  
                  {(imageExportShowIcon || imageExportShowName) && (
                    <div className="flex flex-col items-center gap-6 z-50 mt-4 mb-10 shrink-0 relative w-full pt-4">
                      {imageExportShowIcon && currentEvent?.logoUrl && (
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/20 blur-[50px] rounded-full scale-150 pointer-events-none" />
                          <img src={`https://wsrv.nl/?url=${encodeURIComponent(currentEvent.logoUrl)}`} crossOrigin="anonymous" referrerPolicy="no-referrer" className="relative h-32 w-auto object-contain drop-shadow-2xl" alt="Logo" />
                        </div>
                      )}
                      {imageExportShowName && (
                        <div className="flex flex-col items-center gap-3 mt-2">
                          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase font-sans text-center text-transparent bg-clip-text bg-gradient-to-b from-black to-black/60 dark:from-white dark:to-white/60 drop-shadow-sm">
                            {currentEvent?.name || "IEM Cologne 2026"} -{" "}
                            {activeStage === "stage1"
                              ? "第一阶段"
                              : activeStage === "stage2"
                                ? "第二阶段"
                                : activeStage === "stage3"
                                  ? "第三阶段"
                                  : "决胜阶段"}
                          </h1>
                          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 rounded-full" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div
                  className={`grid ${imageExportStyle === "compact" ? "grid-cols-1 gap-0 bg-zinc-100/80 dark:bg-zinc-900/80 border border-black/5 dark:border-white/5 rounded-lg shadow-sm overflow-hidden" : "grid-cols-1 gap-6"}`}
                >
                  {extendedSortedCommunityPicks
                    .filter((p) => imageExportIds.includes(p.id))
                    .map((participant, index) => {
                      const theirPicks = participant.picks[activeStage] || [];

                      if (activeStage === "playoffs") {
                        return (
                          <div
                            key={participant.id}
                            className={
                              imageExportStyle === "compact"
                                ? `flex gap-3 py-2 px-4 ${index !== 0 ? "border-t border-black/5 dark:border-white/5" : ""}`
                                : "bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm flex flex-col gap-4"
                            }
                          >
                            {imageExportStyle === "compact" ? (
                              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-200 w-36 shrink-0 break-words line-clamp-2 leading-snug pt-3">
                                {participant.name}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between min-h-[32px]">
                                <div className="font-black text-[15px] text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                                  <div className={cn("w-2 h-2 rounded-full", "bg-zinc-300 dark:bg-zinc-600")}></div>
                                  {participant.name}
                                </div>
                              </div>
                            )}
                            <div
                              className={
                                imageExportStyle === "compact" ? "flex-1" : "bg-zinc-50/80 dark:bg-zinc-950/50 rounded-xl p-4 border border-black/5 dark:border-white/5"
                              }
                            >
                              <MiniPlayoffsBracket
                                slots={PLAYOFFS_SLOTS.map((s) => {
                                  const pick = theirPicks.find(
                                    (p) =>
                                      p.id === s.id ||
                                      p.id === `playoffs-${s.id}`,
                                  );
                                  let teamId = pick?.teamId || null;
                                  if (s.type === "qf" && !teamId) {
                                    const qfActuals =
                                      ACTUAL_RESULTS[activeStage]?.filter(
                                        (x: any) => x.type === "qf",
                                      ) || [];
                                    const sTypeIdx = PLAYOFFS_SLOTS.filter(
                                      (x) => x.type === "qf",
                                    ).findIndex((x) => x.id === s.id);
                                    teamId =
                                      qfActuals[sTypeIdx]?.teamId || null;
                                  }
                                  return {
                                    ...s,
                                    teamId,
                                    resultStatus: checkPrediction(
                                      teamId,
                                      s.type as SlotType,
                                      activeStage,
                                    ),
                                  };
                                })}
                                compact={imageExportStyle === "compact"}
                                showTeamNames={imageExportShowTeamNames}
                                isExport={true}
                              />
                            </div>
                          </div>
                        );
                      }

                      const statusData = getSetStatus(
                        theirPicks,
                        activeStage,
                        simulatedFutures,
                      );
                      const statusStyles = getStatusStyles(statusData);

                      let prevStageStatusData = null;
                      if (
                        imageExportShowPrevStage &&
                        activeStage !== "stage1"
                      ) {
                        const prevStage =
                          activeStage === "stage2"
                            ? "stage1"
                            : activeStage === "stage3"
                              ? "stage2"
                              : activeStage === "playoffs"
                                ? "stage3"
                                : null;
                        if (prevStage) {
                          const theirPrevPicks =
                            participant.picks[prevStage] || [];
                          prevStageStatusData = getSetStatus(
                            theirPrevPicks,
                            prevStage,
                          );
                        }
                      }

                      const decorateSlot = (s: any, type: SlotType) => {
                        const clash = statusData?.clashes?.find(
                          (c: any) => c.slotId === s.id,
                        );
                        return {
                          ...s,
                          resultStatus: checkPrediction(
                            s.teamId,
                            type,
                            activeStage,
                          ),
                          clashType: clash?.type,
                        };
                      };

                      const picks30 = theirPicks.filter(
                        (s) => s.type === "3-0",
                      );
                      const sorted30Picks = [...picks30]
                        .sort((a, b) => {
                          const aKey = a.teamId ? `3-0-${a.teamId}` : null;
                          const bKey = b.teamId ? `3-0-${b.teamId}` : null;
                          if (!aKey && !bKey) return 0;
                          if (!aKey) return 1;
                          if (!bKey) return -1;
                          return (
                            (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0) ||
                            a.teamId!.localeCompare(b.teamId!)
                          );
                        })
                        .map((s) => decorateSlot(s, "3-0"));

                      const picksAdvance = theirPicks.filter(
                        (s) => s.type === "advance",
                      );
                      const sortedAdvancePicks = [...picksAdvance]
                        .sort((a, b) => {
                          const aKey = a.teamId ? `advance-${a.teamId}` : null;
                          const bKey = b.teamId ? `advance-${b.teamId}` : null;
                          if (!aKey && !bKey) return 0;
                          if (!aKey) return 1;
                          if (!bKey) return -1;
                          return (
                            (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0) ||
                            a.teamId!.localeCompare(b.teamId!)
                          );
                        })
                        .map((s) => decorateSlot(s, "advance"));

                      const elimPicks = theirPicks.filter(
                        (s) => s.type === "0-3",
                      );
                      const sortedElimPicks = [...elimPicks]
                        .sort((a, b) => {
                          const aKey = a.teamId ? `0-3-${a.teamId}` : null;
                          const bKey = b.teamId ? `0-3-${b.teamId}` : null;
                          if (!aKey && !bKey) return 0;
                          if (!aKey) return 1;
                          if (!bKey) return -1;
                          return (
                            (itemFreq[bKey] || 0) - (itemFreq[aKey] || 0) ||
                            a.teamId!.localeCompare(b.teamId!)
                          );
                        })
                        .map((s) => decorateSlot(s, "0-3"));

                      if (imageExportStyle === "compact") {
                        return (
                          <div
                            key={participant.id}
                            className={`flex items-center gap-3 py-2 px-4 ${index !== 0 ? "border-t" : ""} ${statusStyles.border} ${statusStyles.bg}`}
                          >
                            <div className="flex flex-col gap-1.5 w-36 shrink-0 justify-center">
                              <div className="font-bold text-sm text-zinc-900 dark:text-zinc-200 break-words line-clamp-2 leading-snug">
                                {participant.name}
                              </div>
                              {imageExportShowPrevStage &&
                              activeStage !== "stage1" ? (
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="text-[0.625rem] text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 font-bold bg-black/80 dark:bg-white/80 dark:bg-zinc-800/80 px-1 py-0.5 rounded leading-none shrink-0 border border-zinc-300 dark:border-zinc-700 shadow-sm w-max">
                                    上阶段
                                  </span>
                                  <div className="transform origin-top-left scale-90">
                                    <PickSetStatusText
                                      statusData={prevStageStatusData}
                                      showProbability={false}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="transform origin-top-left scale-90">
                                  <PickSetStatusText
                                    statusData={statusData}
                                    showProbability={imageExportShowProbabilities}
                                  />
                                </div>
                              )}
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
                                isExport={true}
                              />
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={participant.id}
                          className={cn("bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm flex flex-col gap-4", statusStyles.border)}
                        >
                          <div
                            className="flex items-center justify-between min-h-[32px]"
                          >
                            <div className="font-black text-[15px] text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                              <div className={cn("w-2 h-2 rounded-full", statusStyles.bg)}></div>
                              {participant.name}
                            </div>
                            {imageExportShowPrevStage &&
                            activeStage !== "stage1" ? (
                              <div className="flex items-center max-w-[200px] overflow-hidden whitespace-nowrap">
                                <span className="text-[0.625rem] text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 font-bold bg-black/80 dark:bg-white/80 dark:bg-zinc-800/80 px-1 py-0.5 rounded leading-none shrink-0 border border-zinc-300 dark:border-zinc-700 mr-1 shadow-sm opacity-90">
                                  上阶段
                                </span>
                                <PickSetStatusText
                                  statusData={prevStageStatusData}
                                  showProbability={false}
                                />
                              </div>
                            ) : (
                              <PickSetStatusText
                                statusData={statusData}
                                showProbability={imageExportShowProbabilities}
                              />
                            )}
                          </div>
                          <div className="bg-zinc-50/80 dark:bg-zinc-950/50 rounded-xl p-3 border border-black/5 dark:border-white/5">
                            <MiniPicksDisplay
                              title30="3:0 晋级"
                              slots30={sorted30Picks}
                              titleAdvance="3:1 3:2 晋级"
                              slotsAdvance={sortedAdvancePicks}
                              title03="0:3 淘汰"
                              slots03={sortedElimPicks}
                              showTeamNames={imageExportShowTeamNames}
                              isExport={true}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </ExportContext.Provider>
        )}
    </>
  );
};
