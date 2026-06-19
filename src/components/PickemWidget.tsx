import React, { useState } from "react";
import { PickSlot, StageKey, SlotType } from "../types";
import { cn } from "../lib/utils";
import { CheckCircle2, Clock, DownloadCloud, AlertTriangle, ArrowRight } from "lucide-react";
import { PickEmDock } from "./PickEmDock";
import { TeamLogo } from "./TeamLogo";
import { MiniPlayoffsBracket } from "./MiniPlayoffsBracket";
import { dialog } from "./DialogManager";
import { Modal } from "./Modal";

interface PickemWidgetProps {
  newNickname: string;
  setNewNickname: (val: string) => void;
  steamId?: string;
  setSteamId?: (val: string) => void;
  steamAuthCode?: string;
  setSteamAuthCode?: (val: string) => void;
  setPicks?: React.Dispatch<React.SetStateAction<Record<string, PickSlot[]>>>;
  currentEventId?: string;
  currentEventExternalId?: string;
  steamEventId?: number;
  handleSavePick: () => void;
  activeStage: StageKey;
  currentPoolTeams: any[];
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
  currentSlots: PickSlot[];
  handleDrop: (e: React.DragEvent, slotId: string) => void;
  handleAssignSlot: (teamId: string, slotId: string) => void;
  handleClear: (slotId: string) => void;
  activeStageActuals: PickSlot[];
  checkPrediction: (
    teamId: string | null,
    type: SlotType,
    stage: string,
  ) => "correct" | "incorrect" | "unknown";
  getSetStatus: (picks: PickSlot[], stage: string) => any;
  showResults: boolean;
  setShowResults: (val: boolean) => void;
  getStageStatus: (s: string) => string;
}

import { TEAMS } from "../data/teams";

export const PickemWidget: React.FC<PickemWidgetProps> = ({
  newNickname,
  setNewNickname,
  steamId,
  setSteamId,
  steamAuthCode,
  setSteamAuthCode,
  setPicks,
  currentEventId,
  currentEventExternalId,
  steamEventId,
  handleSavePick,
  activeStage,
  currentPoolTeams,
  selectedTeamId,
  setSelectedTeamId,
  currentSlots,
  handleDrop,
  handleAssignSlot,
  handleClear,
  activeStageActuals,
  checkPrediction,
  getSetStatus,
  showResults,
  setShowResults,
  getStageStatus,
}) => {
  const [isImportingSteam, setIsImportingSteam] = useState(false);
  const [developerApiKey, setDeveloperApiKey] = useState(() => localStorage.getItem("steam_developer_api_key") || "");
  const [showDeveloperKeyInput, setShowDeveloperKeyInput] = useState(true); // Default to showing until proven otherwise
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);
  const [importError, setImportError] = useState<string | null>(null);
  const [diffModalData, setDiffModalData] = useState<{
    local: PickSlot[];
    steam: PickSlot[];
  } | null>(null);

  React.useEffect(() => {
    // Add cache buster
    fetch(`/api/config/steam?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data) => {
        if (data && data.hasSteamApiKey === true) {
          setShowDeveloperKeyInput(false);
        } else {
          setShowDeveloperKeyInput(true);
        }
      })
      .catch((err) => {
        console.error("Failed to check steam config:", err);
        setShowDeveloperKeyInput(true);
      })
      .finally(() => {
        setIsCheckingConfig(false);
      });
  }, []);

  const applySteamPicks = (importedSlots: PickSlot[]) => {
    if (setPicks) {
      setPicks((prev) => ({
        ...prev,
        [activeStage]: importedSlots,
      }));
    }
    setDiffModalData(null);
  };

  const handleSteamImport = async () => {
    if (!steamAuthCode) {
      dialog.alert("请先填写 Auth Code。");
      return;
    }

    setImportError(null);
    setIsImportingSteam(true);
    try {
      const actualEventId = steamEventId?.toString() || "22"; // Dynamic or fallback to Shanghai
      let url = `/api/steam-predictions?event=${actualEventId}&key=${encodeURIComponent(steamAuthCode)}${steamId ? `&steamid=${steamId}` : ''}`;
      const cleanDevKey = developerApiKey.replace(/[^A-Za-z0-9]/g, '');
      if (cleanDevKey) {
        url += `&developerkey=${encodeURIComponent(cleanDevKey)}`;
      }
      const response = await fetch(url).catch((err) => {
        throw new Error(`网络连接失败 (fetch failed)。如果您正在使用浏览器插件拦截请求，请关闭后重试。详情: ${err.message}`);
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        
        let preview = text.substring(0, 200).replace(/\s+/g, ' ');
        if (response.status === 404 || response.status === 502 || response.status === 503) {
           throw new Error(`抱歉，后端服务正在启动或重启中 (HTTP ${response.status})。这通常发生在我们刚修改完代码时，请您等待几秒钟，然后再点击一次“导入数据”。`);
        }
        throw new Error(`服务异常 (HTTP ${response.status})。请确保后端正常运行。返回片段: ${preview}`);
      }
      
      const data = await response.json();

      if (data.needsDeveloperKey) {
        setShowDeveloperKeyInput(true);
        throw new Error(data.error || "服务端未配置全局 Steam API Key，需要提供您自己的 Developer API Key。");
      }

      if (data.error || (!data.success && !data.result)) {
        throw new Error(data.error || "无法获取数据，请检查 Auth Code 和 SteamID 是否正确");
      }

      const predictions = (data.groupedPicks && data.groupedPicks[activeStage]) ? data.groupedPicks[activeStage] : (data.rawPicks || []);
      const STEAM_PICKID_MAP: Record<number, string> = {
        1: 'nip', 6: 'fnatic', 12: 'navi', 28: '3dm', 48: 'liquid',
        59: 'g2', 60: 'astralis', 61: 'faze', 69: 'big', 74: 'tyloo', 80: 'mibr',
        81: 'spirit', 85: 'furia', 87: 'nrg', 89: 'vitality', 95: 'heroic', 102: 'pain',
        104: 'sharks', 106: 'mouz', 112: '9z', 113: 'imperial', 115: 'gamerlegion', 119: 'monte', 121: 'fluxo',
        122: 'mongolz', 126: 'legacy', 127: 'lynn', 131: 'rareatom',
        132: 'flyquest', 133: 'passionua', 134: 'aurora', 135: 'b8',
        137: 'betboom', 139: 'falcons', 140: 'm80', 142: 'parivision', 143: 'thehuns',
        144: 'redcanids', 145: 'fut', 146: 'gaimin', 147: 'sinners', 148: 'thunder'
      };

      const importedSlots: PickSlot[] = currentSlots.map((s, idx) => {
        let steamPick;
        if (activeStage === "playoffs") {
           // predictions has 7 picks for playoffs: 4 QF winners, 2 SF winners, 1 Final winner.
           // They are in groupid order.
           // local currentSlots has 15 slots: qf-1..8 (0..7), sf-1..4 (8..11), final-1..2 (12..13), champion (14).
           if (idx >= 8 && idx <= 11) {
             steamPick = predictions[idx - 8]; // map sf-1..4 to predictions[0..3]
           } else if (idx >= 12 && idx <= 13) {
             steamPick = predictions[idx - 12 + 4]; // map final-1..2 to predictions[4..5]
           } else if (idx === 14) {
             steamPick = predictions[6]; // map champion to predictions[6]
           }
        } else {
           steamPick = predictions.find((p: any) => p.index === idx);
        }
        
        const mappedTeamId = steamPick ? STEAM_PICKID_MAP[steamPick.pick] || null : null;
        return {
          ...s,
          teamId: mappedTeamId,
          _steamPickData: steamPick
        } as any;
      });

      const isCurrentEmpty = currentSlots.every((s) => !s.teamId);
      const isDifferent = currentSlots.some((s, idx) => s.teamId !== importedSlots[idx].teamId);

      if (isCurrentEmpty || !isDifferent) {
        // Direct apply
        applySteamPicks(importedSlots);
        if (!isDifferent && !isCurrentEmpty) {
          dialog.alert("您的网站竞猜与游戏内竞猜完全一致。");
        } else {
          dialog.alert("成功导入游戏内竞猜！");
        }
      } else {
        // Show diff modal
        setDiffModalData({ local: currentSlots, steam: importedSlots });
      }
    } catch (e: any) {
      setImportError(e.message);
    } finally {
      setIsImportingSteam(false);
    }
  };

  const statusData =
    activeStage !== "playoffs" ? getSetStatus(currentSlots, activeStage) : null;

  const cleanKeyLength = developerApiKey.replace(/[^A-Za-z0-9]/g, '').length;

  return (
    <div className="flex flex-col gap-6 w-full h-full relative">
      {/* 1. Predict ID & Save */}
      <div className="flex flex-col gap-4 p-4 bg-zinc-200/40 dark:bg-black/40 rounded-xl border border-black/5 dark:border-white/5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">
              预测昵称
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {getStageStatus(activeStage)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors shadow-inner w-full"
              placeholder="输入昵称..."
            />
            <button
              onClick={handleSavePick}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-black dark:text-white font-bold text-sm transition-colors rounded-lg flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-blue-900/20"
            >
              <CheckCircle2 className="w-4 h-4" /> 保存
            </button>
          </div>
        </div>

        <div className="h-px w-full bg-black/5 dark:bg-white/5" />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              Steam 游戏数据绑定
            </span>
            {(!steamId || !steamAuthCode) && (
              <a
                href="https://help.steampowered.com/en/wizard/HelpWithGameIssue/?appid=730&issueid=128"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-blue-500 hover:text-blue-400 font-bold underline"
              >
                如何获取?
              </a>
            )}
          </div>
          
          {showDeveloperKeyInput ? (
            <div className={`flex flex-col gap-3 p-4 border rounded-xl mb-4 ${cleanKeyLength === 32 ? 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/10' : 'bg-red-50/50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'}`}>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className={`text-[13px] font-bold ${cleanKeyLength === 32 ? 'text-zinc-700 dark:text-zinc-300' : 'text-red-700 dark:text-red-400'}`}>
                      {cleanKeyLength === 32 ? '✅ 已配置: Steam Developer API Key' : '⚠️ 为什么需要提供 Steam API Key？'}
                    </span>
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                      第三方竞猜网站通常使用他们自建的服务器 API Key。但由于我们是开源自建工具，没有全局密钥，所以需要您<b>自己申请一个</b>才能访问 Steam 官方服务器。
                    </span>
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                      <b>关于域名：</b>Steam 申请页面会要求填写一个“域名 (Domain Name)”，这只是走个流程，您可以<b>随意填写</b>，例如 <code>localhost</code> 或者 <code>abc.com</code>。
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <input
                  type="text"
                  value={developerApiKey}
                  onChange={(e) => {
                    setDeveloperApiKey(e.target.value.trim());
                    localStorage.setItem("steam_developer_api_key", e.target.value.trim());
                  }}
                  className={`flex-1 bg-white dark:bg-black border rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none transition-colors shadow-inner ${cleanKeyLength === 32 ? 'border-zinc-300 dark:border-zinc-700 focus:border-blue-500' : 'border-red-300 dark:border-red-500/50 focus:border-red-500'}`}
                  placeholder="在此粘贴 32 位 Steam Web API Key..."
                />
                <a
                  href="https://steamcommunity.com/dev/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-black hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                >
                  前往 Steam 免费申请
                </a>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={steamId || ""}
              onChange={(e) => setSteamId?.(e.target.value)}
              className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors shadow-inner w-full"
              placeholder="Steam ID (形如 7656119...)"
            />
            <input
              type="text"
              value={steamAuthCode || ""}
              onChange={(e) => setSteamAuthCode?.(e.target.value)}
              className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 transition-colors shadow-inner w-full"
              placeholder="游戏鉴权码 (Auth Code / URL)..."
            />
            <button
              onClick={handleSteamImport}
              disabled={isImportingSteam}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs transition-colors rounded-lg flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 shadow-sm"
            >
              <DownloadCloud className="w-3.5 h-3.5" /> 导入数据
            </button>
          </div>
          {importError && (
            <div className="mt-3 flex flex-col gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400">
                <span>❌ 导入失败</span>
              </div>
              <div className="text-[11px] leading-relaxed text-red-600 dark:text-red-300 break-words whitespace-pre-wrap select-text">
                {importError.replace(/^Error:\s*/, "")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Drag Source Pool */}
      <div className="flex flex-col gap-3 p-4 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-xl border border-black/5 dark:border-white/5">
        <div className="text-[11px] text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 font-medium">
          点击队伍，再点击下方槽位；或直接拖动。
        </div>
        {activeStage === "playoffs" && currentPoolTeams.length < 8 && (
          <div className="text-[11px] text-amber-500 bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
            请先在第三阶段竞猜或等待实际比赛完成，以获得 8 支晋级队伍。
          </div>
        )}
        {activeStage !== "stage1" &&
          activeStage !== "playoffs" &&
          currentPoolTeams.length < 16 && (
            <div className="text-[11px] text-amber-500 bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
              请先在上一阶段填满 8 支晋级队伍。
            </div>
          )}
        <div className="flex gap-2.5 flex-wrap">
          {currentPoolTeams.map((team) => {
            const isPlaced =
              activeStage !== "playoffs"
                ? currentSlots.some((s) => s.teamId === team.id)
                : false; // In playoffs, teams can be placed multiple times
            const isSelected = selectedTeamId === team.id;
            return (
              <div
                key={team.id}
                draggable={!isPlaced}
                onDragStart={(e) => {
                  e.dataTransfer.setData("teamId", team.id);
                  e.dataTransfer.effectAllowed = "copyMove";
                }}
                onClick={() => {
                  if (isPlaced) return;
                  setSelectedTeamId(isSelected ? null : team.id);
                }}
                className={cn(
                  "w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] flex items-center justify-center rounded-[6px] transition-all bg-zinc-200/40 dark:bg-black/40 border shrink-0",
                  isPlaced
                    ? "opacity-20 grayscale pointer-events-none border-transparent"
                    : "cursor-pointer active:cursor-grabbing hover:bg-black/10 dark:bg-white/10 hover:border-black/20 dark:border-white/20",
                  isSelected
                    ? "border-blue-500 bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                    : "border-black/5 dark:border-white/5",
                )}
              >
                <div className="w-[30px] h-[30px] sm:w-[32px] sm:h-[32px] flex items-center justify-center pointer-events-none">
                  <TeamLogo
                    team={team}
                    fallbackClasses="rounded-[4px] text-[10px]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PickEm Slots */}
      <div className="flex flex-col gap-3">
        {activeStage === "playoffs" ? (
          <div className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 p-4 rounded-xl border border-black/5 dark:border-white/5 overflow-x-hidden">
            <MiniPlayoffsBracket
              slots={currentSlots.map((s) => ({
                ...s,
                resultStatus: showResults
                  ? checkPrediction(s.teamId, s.type, activeStage)
                  : undefined,
              }))}
              readOnly={false}
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
        ) : (
          <div className="w-full">
            <PickEmDock
              slots={currentSlots.map((s) => {
                const clash = statusData?.clashes?.find(
                  (c: any) => c.slotId === s.id,
                );
                return {
                  ...s,
                  resultStatus: showResults
                    ? checkPrediction(s.teamId, s.type, activeStage)
                    : undefined,
                  clashType: clash?.type,
                };
              })}
              actualResults={activeStageActuals}
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
        )}
      </div>

      <Modal
        isOpen={!!diffModalData}
        onClose={() => setDiffModalData(null)}
        title="发现差异"
        maxWidthClass="max-w-2xl"
      >
        {diffModalData && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-500 text-sm rounded-lg">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>检测到您当前网页填写的槽位与游戏内数据不一致。确认要使用游戏内的数据覆盖当前槽位吗？</span>
            </div>
            
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {diffModalData.local.map((localSlot, idx) => {
                const steamSlot = diffModalData.steam[idx];
                if (localSlot.teamId === steamSlot.teamId) return null;
                
                const getTeam = (id: string | null) => currentPoolTeams.find((t) => t.id === id) || TEAMS.find((t) => t.id === id);
                const lTeam = getTeam(localSlot.teamId);
                const sTeam = getTeam(steamSlot.teamId);

                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded border border-black/5 dark:border-white/5">
                    <div className="text-xs font-bold text-zinc-500 w-16 text-center shrink-0 uppercase">
                      {localSlot.type} {localSlot.bottomText || idx + 1}
                    </div>
                    
                    <div className="flex-1 flex items-center justify-between pl-4">
                      {/* Local Team */}
                      <div className="flex flex-col items-center gap-1 w-16">
                        <span className="text-[10px] text-zinc-400">当前网页</span>
                        {lTeam ? (
                          <TeamLogo team={lTeam} className="w-8 h-8" />
                        ) : (
                          <div className="w-8 h-8 rounded border border-dashed border-zinc-400 flex items-center justify-center text-[10px] text-zinc-400">空</div>
                        )}
                      </div>

                      <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />

                      {/* Steam Team */}
                      <div className="flex flex-col items-center gap-1 w-16">
                        <span className="text-[10px] text-blue-500">Steam</span>
                        {sTeam ? (
                          <TeamLogo team={sTeam} className="w-8 h-8" />
                        ) : (
                          <div className="w-16 h-8 rounded border border-dashed border-zinc-400 flex items-center justify-center text-[9px] text-zinc-400 overflow-hidden text-center break-all">
                            ID: {(steamSlot as any)._steamPickData?.pick || '空'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10 mt-2">
              <button
                onClick={() => setDiffModalData(null)}
                className="px-4 py-2 border border-black/10 dark:border-white/10 hover:bg-black/5 dark:bg-white/5 text-zinc-800 dark:text-zinc-300 font-bold text-sm transition-colors rounded-lg"
              >
                取消
              </button>
              <button
                onClick={() => applySteamPicks(diffModalData.steam)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors rounded-lg shadow-lg shadow-blue-900/20"
              >
                确认覆盖
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
