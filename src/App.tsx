import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { TEAMS, INITIAL_SLOTS, PLAYOFFS_SLOTS } from "./data/teams";
import { MATCHES, ACTUAL_RESULTS } from "./data/matches";
import { PickSlot, PickSet, StageKey, SlotType, TournamentEvent } from "./types";
import { cn } from "./lib/utils";
import { TopNav } from "./components/TopNav";
import { HomeView } from "./views/HomeView";
import { SummaryView } from "./views/SummaryView";
import { MajorsHistoryView } from "./views/MajorsHistoryView";
import { RankingsView } from "./views/RankingsView";
import { GlobalSimulationView } from "./views/GlobalSimulationView";
import { SimulatorView } from "./views/SimulatorView";
import { ImageExportModal } from "./components/ImageExportModal";
import { TextExportModal } from "./components/TextExportModal";
import { DialogManager, dialog } from "./components/DialogManager";
import { FloatingPanel } from "./components/FloatingPanel";
import { PickemWidget } from "./components/PickemWidget";
import { MatchDialog } from "./components/MatchDialog";
import { BracketMatch } from "./types";
import { SwissBracket } from "./components/SwissBracket";
import { PlayoffsBracket } from "./components/PlayoffsBracket";
import { TestBracket } from "./components/TestBracket";
import { MatchScheduleBanner } from "./components/MatchScheduleBanner";
import { useMatchLogic } from "./hooks/useMatchLogic";

export const EVENTS: TournamentEvent[] = [
  {
    id: "iem_cologne_2026",
    name: "IEM Cologne Major 2026",
    shortName: "Cologne 26",
    logoUrl: "https://img-cdn.hltv.org/eventlogo/ZMmU3y7hAV248CmzgxsohP.png?ixlib=java-2.1.0&w=100&s=4678a6eb60daacfa1b58d33a5026075d",
    isSwissAllBo3: false,
    steamEventId: 26,
    stages: {
      stage1: { externalId: "csgo_tt_9028" },
      stage2: { externalId: "csgo_tt_9029" },
      stage3: { externalId: "csgo_tt_8301" }
    }
  },
  {
    id: "pgl_singapore_2026",
    name: "PGL Singapore Major 2026",
    shortName: "Singapore 26",
    logoUrl: "https://img-cdn.hltv.org/eventlogo/u-4VdjFWGYz_GwBxLGrr11.png?ixlib=java-2.1.0&w=50&s=e78a8a6b716fa437cc3cfbb9f6b48ee6",
    isSwissAllBo3: true,
    steamEventId: 27,
    stages: {}
  },
  {
    id: "the_minor",
    name: "The Minor",
    shortName: "The Minor",
    logoUrl: "https://img-cdn.hltv.org/eventlogo/u-4VdjFWGYz_GwBxLGrr11.png?ixlib=java-2.1.0&w=50&s=e78a8a6b716fa437cc3cfbb9f6b48ee6",
    isSwissAllBo3: false,
    stagesInfo: [
      { id: "stage0", label: "预选赛 (8192进1024)", format: "double_elim_8192_1024", groups: 1 },
      { id: "stage1", label: "阶段一 (1024进256)", format: "single_elim_64", groups: 16 },
      { id: "stage2", label: "阶段二 (256进128)", format: "round_robin_8", groups: 32 },
      { id: "stage3", label: "阶段三 (128进32)", format: "double_elim_16", groups: 8 },
      { id: "stage4", label: "阶段四 (32进16)", format: "swiss_16", groups: 2 },
      { id: "stage5", label: "阶段五 (16进8)", format: "gsl_4", groups: 4 },
      { id: "stage6", label: "阶段六 (8进4)", format: "double_round_robin_4", groups: 2 },
      { id: "stage7", label: "阶段七 (4进1)", format: "gauntlet_4", groups: 1 },
    ]
  }
];

export default function App() {
  const [currentEventId, setCurrentEventId] = useState<string>("iem_cologne_2026");
  const currentEvent = useMemo(() => EVENTS.find(e => e.id === currentEventId) || EVENTS[0], [currentEventId]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dataLoadError, setDataLoadError] = useState(false);
  const [rankingDegraded, setRankingDegraded] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);

  const handleRefreshMatchData = useCallback(async (isAutoRefresh: boolean = false) => {
    setIsRefreshingData(true);
    try {
      const res = await import("./utils/fetchE5Data").then((m) =>
        m.fetchAndPatchCSGOData(currentEvent, isAutoRefresh),
      );
      setDataLoadError(!res.matchSuccess);
      setRankingDegraded(!res.rankingSuccess);
    } catch {
      setDataLoadError(true);
      setRankingDegraded(true);
    }
    loadPicks();
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => {
      setIsRefreshingData(false);
    }, 500);
  }, [currentEvent]);

  // The event initialization and refresh logic is moved below getRecommendedStage


  useEffect(() => {
    const handler = () => {
      handleRefreshMatchData();
    };
    window.addEventListener("force-refresh-matches", handler);
    return () => window.removeEventListener("force-refresh-matches", handler);
  }, [handleRefreshMatchData]);

  type MainViewMode =
    | "bracket"
    | "summary"
    | "history"
    | "ranking"
    | "globalSim"
    | "simulator";
  type PanelViewMode = "home" | "edit";

  const [mainView, setMainView] = useState<MainViewMode>("bracket");
  const [panelView, setPanelView] = useState<PanelViewMode>("home");



  const setViewMode = useCallback(
    (
      mode: "home" | "edit" | "summary" | "history" | "ranking" | "globalSim" | "simulator",
    ) => {
      if (
        mode === "summary" ||
        mode === "history" ||
        mode === "ranking" ||
        mode === "globalSim" ||
        mode === "simulator"
      ) {
        setMainView(mode);
      } else {
        setMainView("bracket");
        setPanelView(mode as PanelViewMode);
        setIsFloatingPanelExpanded(true);
        if (window.innerWidth < 1024) setIsSchedulePanelExpanded(false);
      }
    },
    [],
  );

  const [newNickname, setNewNickname] = useState("");
  const [steamId, setSteamId] = useState("");
  const [steamAuthCode, setSteamAuthCode] = useState("");
  const [activeStage, setActiveStage] = useState<StageKey>("stage1");
  const [activeGroupId, setActiveGroupId] = useState<number>(0);

  useEffect(() => {
    setActiveGroupId(0);
  }, [activeStage]);

  const [showResults, setShowResults] = useState(false);
  const [communityPicks, setCommunityPicks] = useState<PickSet[]>([]);
  const [currentPickSetId, setCurrentPickSetId] = useState<string | null>(null);

  const defaultPicks: Record<string, PickSlot[]> = {
    stage1: INITIAL_SLOTS.map((s) => ({ ...s, id: `s1-${s.id}` })),
    stage2: INITIAL_SLOTS.map((s) => ({ ...s, id: `s2-${s.id}` })),
    stage3: INITIAL_SLOTS.map((s) => ({ ...s, id: `s3-${s.id}` })),
    playoffs: PLAYOFFS_SLOTS.map((s) => ({ ...s, id: `playoffs-${s.id}` })),
  };
  const [picks, setPicks] = useState<Record<string, PickSlot[]>>(defaultPicks);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showImageExportModal, setShowImageExportModal] = useState(false);
  const [showTextExportModal, setShowTextExportModal] = useState(false);
  const [imageExportIds, setImageExportIds] = useState<string[]>([]);
  const [imageExportShowPrevStage, setImageExportShowPrevStage] =
    useState(true);
  const [imageExportShowProbabilities, setImageExportShowProbabilities] =
    useState(false);
  const [imageExportShowTeamNames, setImageExportShowTeamNames] =
    useState(false);
  const [imageExportSimCount, setImageExportSimCount] =
    useState<number>(100000);
  const [imageExportStyle, setImageExportStyle] = useState<
    "standard" | "compact"
  >("standard");
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [exportPreviewUrl, setExportPreviewUrl] = useState<string | null>(null);

  const [mobileView, setMobileView] = useState<"bracket" | "picks">("picks");
  const [showProbabilityInSummary, setShowProbabilityInSummary] =
    useState(false);

  const [isFloatingPanelExpanded, setIsFloatingPanelExpanded] = useState(false);
  const [isSchedulePanelExpanded, setIsSchedulePanelExpanded] = useState(false);
  const [globalSelectedMatch, setGlobalSelectedMatch] =
    useState<BracketMatch | null>(null);

  useEffect(() => {
    if (globalSelectedMatch) {
      const allStageMaps = [
        MATCHES["stage1"],
        MATCHES["stage2"],
        MATCHES["stage3"],
        MATCHES["playoffs"],
      ];
      let updatedMatch = null;
      out: for (const stageMap of allStageMaps) {
        if (!stageMap) continue;
        for (const group of Object.values(stageMap)) {
          const found = group.find(
            (m: any) =>
              (m.externalId &&
                m.externalId === globalSelectedMatch.externalId) ||
              (m.team1Id === globalSelectedMatch.team1Id &&
                m.team2Id === globalSelectedMatch.team2Id),
          );
          if (found) {
            updatedMatch = found;
            break out;
          }
        }
      }
      if (updatedMatch) {
        if (JSON.stringify(globalSelectedMatch) !== JSON.stringify(updatedMatch)) {
          setGlobalSelectedMatch({ ...updatedMatch });
        }
      }
    }
  }, [refreshTrigger, globalSelectedMatch]);

  const exportContainerRef = useRef<HTMLDivElement>(null);

  const {
    getScheduledMatches,
    simulatedFutures: useMatchSimulatedFutures,
    runSimulationAsync,
    getTeamRecords,
    getComputedActuals,
    activeStageActuals,
    checkPrediction,
    getSetStatus,
    isSimulatingStage,
  } = useMatchLogic(activeStage, refreshTrigger, mainView, currentEvent);

  const getRecommendedStage = useCallback(() => {
    const isStageFinished = (stage: string) => {
      if (stage === "playoffs") {
        const finalMatches = MATCHES.playoffs?.["final"] || [];
        if (finalMatches.length === 0) return false;
        const s = String(finalMatches[0].status).toLowerCase();
        return s === "completed" || s === "past";
      } else {
        const actuals = getComputedActuals(stage) || [];
        return actuals.length >= 16;
      }
    };

    const isStageStarted = (stage: string) => {
      const stageGroup = MATCHES[stage] as Record<string, BracketMatch[]>;
      if (!stageGroup) return false;
      for (const roundMatches of Object.values(stageGroup)) {
        if (roundMatches && roundMatches.some((m: any) => {
          const s = String(m.status).toLowerCase();
          return s === "live" || s === "completed" || s === "past";
        })) {
          return true;
        }
      }
      return false;
    };

    const stages: StageKey[] = currentEvent.stagesInfo 
      ? currentEvent.stagesInfo.map(s => s.id) 
      : ["stage1", "stage2", "stage3", "playoffs"];
    let recommended: StageKey = "stage1";
    
    for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        if (isStageFinished(stage)) {
            const nextStage = stages[i + 1];
            if (nextStage && isStageStarted(nextStage)) {
                recommended = nextStage;
            } else if (nextStage) {
                // Next stage hasn't started, but current is finished, recommend the next upcoming stage to let them pick
                recommended = nextStage;
            } else {
                recommended = stage;
                break;
            }
        } else {
            recommended = stage;
            break;
        }
    }
    
    return recommended;
  }, [getComputedActuals]);

  const [hasAutoSelectedStage, setHasAutoSelectedStage] = useState(false);

  useEffect(() => {
    handleRefreshMatchData().then(() => {
      // Data loaded is now set inside handleRefreshMatchData, but we can set it here too as fallback
      setDataLoaded(true);
    });
    // Reset picks and view state when event changes
    setPicks(defaultPicks);
    setCurrentPickSetId(null);
    setNewNickname("");
    setMainView("bracket");
    setPanelView("home");
    setIsFloatingPanelExpanded(false);
    setHasAutoSelectedStage(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEventId]);

  useEffect(() => {
    if (dataLoaded && !hasAutoSelectedStage) {
      setActiveStage(getRecommendedStage());
      setHasAutoSelectedStage(true);
    }
  }, [dataLoaded, refreshTrigger, getRecommendedStage, hasAutoSelectedStage]);

  useEffect(() => {
    let shouldCheckPrev = false;
    const now = new Date();
    const dates: Record<string, { start: Date; end: Date }> = {
      stage1: {
        start: new Date("2026-06-02T10:30:00Z"),
        end: new Date("2026-06-05T23:59:59Z"),
      },
      stage2: {
        start: new Date("2026-06-06T10:30:00Z"),
        end: new Date("2026-06-09T23:59:59Z"),
      },
      stage3: {
        start: new Date("2026-06-11T09:00:00Z"),
        end: new Date("2026-06-15T23:59:59Z"),
      },
      playoffs: {
        start: new Date("2026-06-18T13:45:00Z"),
        end: new Date("2026-06-21T15:00:00Z"),
      },
    };

    if (activeStage === "stage2" && dates.stage2 && now < dates.stage2.start && (getComputedActuals("stage1") || []).length >= 16) {
      shouldCheckPrev = true;
    }
    if (activeStage === "stage3" && dates.stage3 && now < dates.stage3.start && (getComputedActuals("stage2") || []).length >= 16) {
      shouldCheckPrev = true;
    }
    if (activeStage === "playoffs" && dates.playoffs && now < dates.playoffs.start && (getComputedActuals("stage3") || []).length >= 16) {
      shouldCheckPrev = true;
    }

    setImageExportShowPrevStage(shouldCheckPrev);
  }, [activeStage, getComputedActuals, refreshTrigger]);

  useEffect(() => {
    if (!dataLoaded) return;

    let hasLiveMatch = false;
    const stages = currentEvent.stagesInfo 
      ? currentEvent.stagesInfo.map((s) => s.id)
      : ["stage1", "stage2", "stage3", "playoffs"];
    for (const stage of stages) {
      const stageGroup = MATCHES[stage] as any;
      if (stageGroup) {
        if (stage === "playoffs") {
          for (const round of ["qf", "sf", "final"]) {
            const roundMatches = stageGroup[round] || [];
            if (roundMatches.some((m: any) => m.status === "live")) {
              hasLiveMatch = true;
              break;
            }
          }
        } else {
          for (const bracket of Object.values(stageGroup)) {
            const bMatches = bracket as any[];
            if (bMatches.some((m: any) => m.status === "live")) {
              hasLiveMatch = true;
              break;
            }
          }
        }
      }
      if (hasLiveMatch) break;
    }

    let intervalDelay = 60000;
    if (mainView === "summary") {
      intervalDelay = 10000;
    } else if (hasLiveMatch) {
      intervalDelay = 20000;
    }

    const timerId = setInterval(() => {
      handleRefreshMatchData(true);
    }, intervalDelay);

    return () => clearInterval(timerId);
  }, [dataLoaded, refreshTrigger, mainView, panelView, activeStage]);



  const [detailedFutures, setDetailedFutures] = useState<any>(null);
  const [isSimulatingProbability, setIsSimulatingProbability] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);

  const simulatedFuturesForExport =
    imageExportShowProbabilities && detailedFutures
      ? detailedFutures
      : useMatchSimulatedFutures;

  const handleGeneratePreview = async () => {
    if (imageExportIds.length === 0) {
      dialog.alert("请至少选择一项");
      return;
    }
    if (!exportContainerRef.current) return;
    setIsExportingImage(true);

    if (imageExportShowProbabilities) {
      setIsSimulatingProbability(true);
      setSimulationProgress(0);
      // We defer it slightly to let react render the loading state
      await new Promise((r) => setTimeout(r, 50));
      const futures = await runSimulationAsync(imageExportSimCount, (p) =>
        setSimulationProgress(p),
      );
      setDetailedFutures(futures);
      setIsSimulatingProbability(false);
      // Wait for React to finish re-rendering and mounting the hidden container before dom capture
      await new Promise((r) => setTimeout(r, 300));
    }

    // We also give html-to-image a little time
    setTimeout(() => {
      import("html-to-image").then((htmlToImage) => {
        if (!exportContainerRef.current) return;
        htmlToImage
          .toPng(
            exportContainerRef.current.querySelector("#export-content") ||
              exportContainerRef.current,
            {
              backgroundColor: "#070b09",
              pixelRatio: 3,
              includeQueryParams: true,
              cacheBust: true,
            },
          )
          .then(function (dataUrl) {
            setExportPreviewUrl(dataUrl);
            setIsExportingImage(false);
          })
          .catch(function (error) {
            console.error("oops, something went wrong!", error);
            setIsExportingImage(false);
            dialog.alert("截图生成失败");
          });
      });
    }, 500);
  };

  const handleDownloadImage = () => {
    if (!exportPreviewUrl) return;
    const link = document.createElement("a");
    link.download = `pickem-summary-${activeStage}.png`;
    link.href = exportPreviewUrl;
    link.click();
    setShowImageExportModal(false);
    setExportPreviewUrl(null);
  };

  const loadPicks = useCallback(() => {
    import("./lib/db").then((db) => {
      db.getAllPickSets().then((sets) => {
        setCommunityPicks(
          sets
            .filter((s) => s.eventId === currentEventId || (!s.eventId && currentEventId === "iem_cologne_2026"))
            .sort((a, b) => b.createdAt - a.createdAt)
        );
      });
    });
  }, [currentEventId]);

  useEffect(() => {
    loadPicks();
  }, [mainView, panelView, loadPicks]);

  const itemFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    communityPicks.forEach((p) => {
      const stagePicks = p.picks[activeStage] || [];
      stagePicks.forEach((slot) => {
        if (slot.teamId) {
          const type = slot.type;
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
      const aPoints = getSetStatus(a.picks[activeStage] || [], activeStage)?.correctCount || 0;
      const bPoints = getSetStatus(b.picks[activeStage] || [], activeStage)?.correctCount || 0;
      
      if (bPoints !== aPoints) {
        return bPoints - aPoints;
      }

      const getItems = (p: PickSet) => {
        const items = new Set<string>();
        (p.picks[activeStage] || []).forEach((slot) => {
          if (slot.teamId) {
            const type = slot.type;
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
  }, [communityPicks, activeStage, itemFreq, getSetStatus]);

  const getStageStatus = (stage: string) => {
    const actualsForStage = getComputedActuals(stage) || [];
    const isComplete =
      (stage === "playoffs" && actualsForStage.filter((a: any) => a.teamId).length >= 15) ||
      (stage !== "playoffs" && actualsForStage.length >= 16);

    if (isComplete) return `比赛已结束`;

    const dates: Record<string, { start: Date; end: Date; label?: string }> = {
      stage1: {
        start: new Date("2026-06-02T10:30:00Z"),
        end: new Date("2026-06-05T23:59:59Z"),
      },
      stage2: {
        start: new Date("2026-06-06T10:30:00Z"),
        end: new Date("2026-06-09T23:59:59Z"),
      },
      stage3: {
        start: new Date("2026-06-11T09:00:00Z"),
        end: new Date("2026-06-15T23:59:59Z"),
      },
      playoffs: {
        start: new Date("2026-06-18T13:45:00Z"),
        end: new Date("2026-06-21T15:00:00Z"),
      },
    };

    if (!dates[stage]) {
      return `测试赛程进行中`;
    }

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
    if (currentEvent?.id !== 'iem_cologne_2026') return [];
    
    if (stage === "playoffs") {
      const s3Actuals = getComputedActuals("stage3");
      const s3Advanced = s3Actuals
        .filter((a) => a.type === "3-0" || a.type === "advance")
        .map((a) => a.teamId!);
      if (s3Advanced.length === 8) {
        return TEAMS.filter(
          (t) => t && s3Advanced.includes(t.id) && t.id !== "tbd",
        );
      }
      const s3AdvancedPicks = picks.stage3
        .filter((s) => (s.type === "3-0" || s.type === "advance") && s.teamId)
        .map((s) => s.teamId!);
      return TEAMS.filter(
        (t) => t && s3AdvancedPicks.includes(t.id) && t.id !== "tbd",
      );
    }
    if (stage === "stage1")
      return TEAMS.filter((t) => t.startStage === 1 && t.id !== "tbd");
    if (stage === "stage2") {
      let s1AdvancedIds: string[] = [];
      const s1Actuals = getComputedActuals("stage1");
      const actualAdvanced = s1Actuals
        .filter((a) => a.type === "3-0" || a.type === "advance")
        .map((a) => a.teamId!);
      if (actualAdvanced.length === 8) {
        s1AdvancedIds = actualAdvanced;
      } else {
        s1AdvancedIds = picks.stage1
          .filter((s) => (s.type === "3-0" || s.type === "advance") && s.teamId)
          .map((s) => s.teamId!);
      }
      const s1Advanced = TEAMS.filter(
        (t) => t && s1AdvancedIds.includes(t.id) && t.id !== "tbd",
      );
      const s2Direct = TEAMS.filter(
        (t) => t.startStage === 2 && t.id !== "tbd",
      );
      return [...s1Advanced, ...s2Direct];
    }
    if (stage === "stage3") {
      let s2AdvancedIds: string[] = [];
      const s2Actuals = getComputedActuals("stage2");
      const actualAdvanced = s2Actuals
        .filter((a) => a.type === "3-0" || a.type === "advance")
        .map((a) => a.teamId!);
      if (actualAdvanced.length === 8) {
        s2AdvancedIds = actualAdvanced;
      } else {
        s2AdvancedIds = picks.stage2
          .filter((s) => (s.type === "3-0" || s.type === "advance") && s.teamId)
          .map((s) => s.teamId!);
      }
      const s2Advanced = TEAMS.filter(
        (t) => t && s2AdvancedIds.includes(t.id) && t.id !== "tbd",
      );
      const s3Direct = TEAMS.filter(
        (t) => t.startStage === 3 && t.id !== "tbd",
      );
      return [...s2Advanced, ...s3Direct];
    }
    return [];
  };

  const currentPoolTeams = getAvailableTeams(activeStage);
  const currentSlots = picks[activeStage] || [];

  const handleAssignSlot = (teamId: string, slotId: string) => {
    // Only enforce pool team check for swiss stages
    if (
      activeStage !== "playoffs" &&
      !currentPoolTeams.find((t) => t.id === teamId)
    )
      return;

    setPicks((prev: Record<string, PickSlot[]>) => {
      if (activeStage === "playoffs" && slotId.includes("qf-")) return prev;

      const nextStage = [
        ...(prev[activeStage] || defaultPicks[activeStage] || []),
      ];
      const targetIdx = nextStage.findIndex((s: PickSlot) => s.id === slotId);

      if (activeStage === "playoffs") {
        const oldTeamId = nextStage[targetIdx].teamId;
        nextStage[targetIdx] = { ...nextStage[targetIdx], teamId };

        if (oldTeamId && oldTeamId !== teamId) {
          const cascadeClear = (slotName: string, removedTeam: string) => {
            const localSlotName = slotName.replace("playoffs-", "");
            const relatedAdv: Record<string, string> = {
              "qf-1": "sf-1",
              "qf-2": "sf-1",
              "qf-3": "sf-2",
              "qf-4": "sf-2",
              "qf-5": "sf-3",
              "qf-6": "sf-3",
              "qf-7": "sf-4",
              "qf-8": "sf-4",
              "sf-1": "final-1",
              "sf-2": "final-1",
              "sf-3": "final-2",
              "sf-4": "final-2",
              "final-1": "champion",
              "final-2": "champion",
            };
            const nextIdLocal =
              relatedAdv[localSlotName as keyof typeof relatedAdv];
            if (nextIdLocal) {
              const nextId = `playoffs-${nextIdLocal}`;
              const nextSlotIdx = nextStage.findIndex(
                (s: PickSlot) => s.id === nextId,
              );
              if (
                nextSlotIdx !== -1 &&
                nextStage[nextSlotIdx].teamId === removedTeam
              ) {
                nextStage[nextSlotIdx] = {
                  ...nextStage[nextSlotIdx],
                  teamId: undefined,
                };
                cascadeClear(nextId, removedTeam);
              }
            }
          };
          cascadeClear(slotId, oldTeamId);
        }
        return { ...prev, [activeStage]: nextStage };
      }

      const existingIdx = nextStage.findIndex(
        (s: PickSlot) => s.teamId === teamId,
      );
      if (existingIdx !== -1) {
        nextStage[existingIdx] = {
          ...nextStage[existingIdx],
          teamId: nextStage[targetIdx].teamId,
        };
      }

      nextStage[targetIdx] = { ...nextStage[targetIdx], teamId };
      return { ...prev, [activeStage]: nextStage };
    });
  };

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    const teamId = e.dataTransfer.getData("teamId");
    if (!teamId) return;
    handleAssignSlot(teamId, slotId);
  };

  const handleCreateNew = () => {
    if (!newNickname.trim()) {
      dialog.alert("请输入您的昵称！");
      return;
    }
    const newId = `usr-${Date.now()}`;
    setCurrentPickSetId(newId);
    setSteamId("");
    setSteamAuthCode("");
    setPicks(defaultPicks);
    setViewMode("edit");
  };

  const handleEditExisting = (pickSet: PickSet) => {
    setCurrentPickSetId(pickSet.id);
    setNewNickname(pickSet.name);
    setSteamId(pickSet.steamId || "");
    setSteamAuthCode(pickSet.steamKey || "");
    setPicks({
      ...defaultPicks,
      ...pickSet.picks,
    });
    setViewMode("edit");
  };

  const handleSavePick = async () => {
    if (!newNickname.trim()) {
      dialog.alert("请先输入您的昵称！");
      return;
    }
    if (!currentPickSetId) return;

    const db = await import("./lib/db");
    const pickSet: PickSet = {
      id: currentPickSetId,
      eventId: currentEventId,
      name: newNickname,
      createdAt: Date.now(),
      picks: JSON.parse(JSON.stringify(picks)),
      steamId,
      steamKey: steamAuthCode,
    };
    await db.savePickSet(pickSet);

    const sets = await db.getAllPickSets();
    setCommunityPicks(
      sets
        .filter((s) => s.eventId === currentEventId || (!s.eventId && currentEventId === "iem_cologne_2026"))
        .sort((a, b) => b.createdAt - a.createdAt)
    );

    dialog.alert("竞猜已保存！");
    setViewMode("home");
  };

  const handleClear = (slotId: string) => {
    setPicks((prev: Record<string, PickSlot[]>) => {
      if (activeStage === "playoffs" && slotId.includes("qf-")) return prev;

      const nextStage = [
        ...(prev[activeStage] || defaultPicks[activeStage] || []),
      ];
      const idx = nextStage.findIndex((s: PickSlot) => s.id === slotId);
      if (idx === -1) return prev;

      const oldTeamId = nextStage[idx].teamId;
      nextStage[idx] = { ...nextStage[idx], teamId: undefined };

      if (activeStage === "playoffs" && oldTeamId) {
        const cascadeClear = (slotName: string, removedTeam: string) => {
          const localSlotName = slotName.replace("playoffs-", "");
          const relatedAdv: Record<string, string> = {
            "qf-1": "sf-1",
            "qf-2": "sf-1",
            "qf-3": "sf-2",
            "qf-4": "sf-2",
            "qf-5": "sf-3",
            "qf-6": "sf-3",
            "qf-7": "sf-4",
            "qf-8": "sf-4",
            "sf-1": "final-1",
            "sf-2": "final-1",
            "sf-3": "final-2",
            "sf-4": "final-2",
            "final-1": "champion",
            "final-2": "champion",
          };
          const nextIdLocal =
            relatedAdv[localSlotName as keyof typeof relatedAdv];
          if (nextIdLocal) {
            const nextId = `playoffs-${nextIdLocal}`;
            const nextSlotIdx = nextStage.findIndex(
              (s: PickSlot) => s.id === nextId,
            );
            if (
              nextSlotIdx !== -1 &&
              nextStage[nextSlotIdx].teamId === removedTeam
            ) {
              nextStage[nextSlotIdx] = {
                ...nextStage[nextSlotIdx],
                teamId: undefined,
              };
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
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
        .dark ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        .dark ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      <div className="h-[100dvh] w-full bg-zinc-50 dark:bg-[#070b09] text-zinc-900 dark:text-zinc-200 font-sans flex flex-col relative overflow-hidden select-none">
        {/* Ambient Glow Lights */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/10 rounded-full blur-[150px] pointer-events-none z-0" />

        {/* Top Navbar */}
        <TopNav
          mainView={mainView}
          setMainView={(view) => {
            setMainView(view);
            if (view === 'bracket' && window.innerWidth < 1024) {
              setIsFloatingPanelExpanded(false);
              setIsSchedulePanelExpanded(false);
            }
          }}
          handleRefresh={handleRefreshMatchData}
          isRefreshing={isRefreshingData}
          currentEventId={currentEventId}
          setCurrentEventId={setCurrentEventId}
        />

        {dataLoadError && (
          <div className="bg-rose-500/20 text-rose-300 px-4 py-2 text-sm text-center border-b border-rose-500/30 z-[100]">
            数据加载失败或者无网络连接，暂时无法更新当前赛况。
          </div>
        )}

        <div
          className={cn(
            "w-full flex-1 min-h-0 max-w-full relative z-10 flex flex-col pt-0 overflow-hidden",
            mainView !== "bracket" ? "hidden" : "",
          )}
        >
          <div className="flex border-b border-black/5 dark:border-white/5 items-center justify-center gap-2 pb-2 shrink-0 z-10 w-full bg-zinc-50/80 dark:bg-[#070b09]/80 backdrop-blur sticky top-0 mt-0 overflow-x-auto no-scrollbar">
            {(currentEvent.stagesInfo || [
              { id: "stage1", label: "第一阶段" },
              { id: "stage2", label: "第二阶段" },
              { id: "stage3", label: "第三阶段" },
              { id: "playoffs", label: "决胜阶段" },
            ]).map((tab) => {
              const isActive = activeStage === tab.id;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveStage(tab.id as StageKey)}
                  className={cn(
                    "px-4 py-2 rounded-[2px] text-[13px] font-bold cursor-pointer transition-colors flex items-center whitespace-nowrap",
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

          <div className="flex-1 min-h-0 overflow-hidden bg-zinc-50/40 dark:bg-zinc-950/40 relative flex flex-col">
            {!dataLoaded ? (
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-500 gap-3">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm font-bold animate-pulse">
                  正在同步数据...
                </div>
              </div>
            ) : (() => {
              const activeStageConfig = currentEvent.stagesInfo?.find(s => s.id === activeStage);
              const format = activeStageConfig?.format || (activeStage === "playoffs" ? "playoffs" : "swiss");
              const hasMultipleGroups = activeStageConfig?.groups && activeStageConfig.groups > 1;

              return (
                <>
                  {hasMultipleGroups && (
                    <div className="w-full border-b border-black/5 dark:border-white/5 bg-zinc-100/50 dark:bg-zinc-900/50 z-20 sticky top-0 backdrop-blur-sm flex justify-center">
                      <div className="max-w-2xl mx-auto flex justify-center flex-wrap gap-1.5 p-2 max-h-[140px] overflow-y-auto px-8">
                        {Array.from({ length: activeStageConfig.groups! }).map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveGroupId(idx)}
                            className={cn(
                              "px-3 py-1 text-xs font-bold rounded-full transition-colors flex items-center justify-center whitespace-nowrap",
                              activeGroupId === idx
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200"
                            )}
                          >
                            第 {idx + 1} 组
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {format.startsWith("swiss") ? (
                    <div className="contents" key={activeGroupId}>
                      <SwissBracket activeStage={activeStage} refreshTrigger={refreshTrigger} currentEvent={currentEvent} />
                    </div>
                  ) : format === "playoffs" ? (
                    <div className="w-full flex-1 min-h-0 relative flex flex-col" key={activeGroupId}>
                      <PlayoffsBracket
                        refreshTrigger={refreshTrigger}
                        slots={PLAYOFFS_SLOTS.map((s) => {
                          const sTypeIdx = PLAYOFFS_SLOTS.filter(
                            (x) => x.type === s.type,
                          ).findIndex((x) => x.id === s.id);
                          const act = activeStageActuals.filter(
                            (x) => x.type === s.type,
                          )[sTypeIdx];
                          return {
                            ...s,
                            id: `playoffs-${s.id}`,
                            teamId: act?.teamId,
                          };
                        })}
                        readOnly={true}
                        showResults={false}
                        onMatchClick={(m) => setGlobalSelectedMatch(m)}
                      />
                    </div>
                  ) : (
                    <div className="contents" key={activeGroupId}>
                      <TestBracket format={format} activeGroupId={activeGroupId} />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {mainView === "summary" && (
          <div className="w-full flex-1 relative z-10 flex flex-col p-4 overflow-hidden">
            <SummaryView
              communityPicks={communityPicks}
              showProbabilityInSummary={showProbabilityInSummary}
              setShowProbabilityInSummary={setShowProbabilityInSummary}
              setImageExportIds={setImageExportIds}
              setShowImageExportModal={setShowImageExportModal}
              setShowTextExportModal={setShowTextExportModal}
              activeStage={activeStage}
              setActiveStage={setActiveStage}
              ACTUAL_RESULTS={{ [activeStage]: activeStageActuals }}
              PLAYOFFS_SLOTS={PLAYOFFS_SLOTS}
              sortedCommunityPicks={sortedCommunityPicks}
              getSetStatus={getSetStatus}
              itemFreq={itemFreq}
              checkPrediction={checkPrediction}
              handleRefresh={handleRefreshMatchData}
              isRefreshing={isRefreshingData || isSimulatingStage}
              setViewMode={setViewMode}
            />
          </div>
        )}

        {mainView === "ranking" && (
          <div className="w-full h-full relative z-10 flex flex-col p-4 lg:p-8 overflow-hidden max-w-7xl mx-auto">
            <RankingsView
              activeStage={activeStage}
              setActiveStage={setActiveStage}
              isDegraded={dataLoadError || rankingDegraded}
              getComputedActuals={getComputedActuals}
              currentEvent={currentEvent}
            />
          </div>
        )}

        {mainView === "history" && (
          <div className="w-full flex-1 relative z-10 flex flex-col p-4 overflow-hidden">
            <MajorsHistoryView />
          </div>
        )}

        {mainView === "globalSim" && (
          <div className="w-full flex-1 relative z-10 flex flex-col p-0 overflow-hidden bg-zinc-50 dark:bg-[#070b09]">
            <GlobalSimulationView
              currentMatches={MATCHES}
              computedActuals={{
                stage1: getComputedActuals("stage1"),
                stage2: getComputedActuals("stage2"),
                stage3: getComputedActuals("stage3"),
                playoffs: getComputedActuals("playoffs"),
              }}
              onMatchClick={(m) => setGlobalSelectedMatch(m)}
              currentEvent={currentEvent}
            />
          </div>
        )}

        {mainView === "simulator" && (
          <div className="w-full flex-1 relative z-10 flex flex-col p-0 overflow-hidden bg-zinc-50 dark:bg-[#070b09]">
            <SimulatorView
              activeStage={activeStage}
              setActiveStage={setActiveStage}
              currentMatches={MATCHES}
              currentEvent={currentEvent}
            />
          </div>
        )}

        {mainView === "bracket" && (
          <>
            <FloatingPanel
              isExpanded={isFloatingPanelExpanded}
              setIsExpanded={(val) => {
                setIsFloatingPanelExpanded(val);
                if (val && window.innerWidth < 1024)
                  setIsSchedulePanelExpanded(false);
              }}
              title="竞猜"
              position="right"
              mobilePosition="bottom-right"
            >
              {panelView === "home" && (
                <HomeView
                  newNickname={newNickname}
                  setNewNickname={setNewNickname}
                  communityPicks={communityPicks}
                  handleCreateNew={handleCreateNew}
                  handleEditExisting={handleEditExisting}
                  refreshPicks={loadPicks}
                />
              )}
              {panelView === "edit" && (
                <PickemWidget
                  newNickname={newNickname}
                  setNewNickname={setNewNickname}
                  steamId={steamId}
                  setSteamId={setSteamId}
                  steamAuthCode={steamAuthCode}
                  setSteamAuthCode={setSteamAuthCode}
                  handleSavePick={handleSavePick}
                  activeStage={activeStage}
                  currentPoolTeams={currentPoolTeams}
                  selectedTeamId={selectedTeamId}
                  setSelectedTeamId={setSelectedTeamId}
                  currentSlots={currentSlots}
                  handleDrop={handleDrop}
                  handleAssignSlot={handleAssignSlot}
                  handleClear={handleClear}
                  activeStageActuals={activeStageActuals}
                  checkPrediction={checkPrediction}
                  getSetStatus={getSetStatus}
                  showResults={showResults}
                  setShowResults={setShowResults}
                  getStageStatus={getStageStatus}
                  currentEventId={currentEvent.id}
                  currentEventExternalId={currentEvent.stages?.[activeStage]?.externalId}
                  steamEventId={currentEvent.steamEventId}
                  setPicks={setPicks}
                />
              )}
            </FloatingPanel>

            <FloatingPanel
              isExpanded={isSchedulePanelExpanded}
              setIsExpanded={(val) => {
                setIsSchedulePanelExpanded(val);
                if (val && window.innerWidth < 1024)
                  setIsFloatingPanelExpanded(false);
              }}
              title="赛程"
              position="left"
              mobilePosition="bottom-left"
            >
              <MatchScheduleBanner
                activeStage={activeStage}
                onMatchClick={(m) => setGlobalSelectedMatch(m)}
              />
            </FloatingPanel>
          </>
        )}
      </div>

      <MatchDialog
        match={globalSelectedMatch}
        onClose={() => setGlobalSelectedMatch(null)}
      />

      <ImageExportModal
        showImageExportModal={showImageExportModal}
        setShowImageExportModal={setShowImageExportModal}
        exportPreviewUrl={exportPreviewUrl}
        setExportPreviewUrl={setExportPreviewUrl}
        imageExportShowPrevStage={imageExportShowPrevStage}
        setImageExportShowPrevStage={setImageExportShowPrevStage}
        imageExportShowProbabilities={imageExportShowProbabilities}
        setImageExportShowProbabilities={setImageExportShowProbabilities}
        imageExportShowTeamNames={imageExportShowTeamNames}
        setImageExportShowTeamNames={setImageExportShowTeamNames}
        imageExportSimCount={imageExportSimCount}
        setImageExportSimCount={setImageExportSimCount}
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
        ACTUAL_RESULTS={{
          stage1: getComputedActuals("stage1"),
          stage2: getComputedActuals("stage2"),
          stage3: getComputedActuals("stage3"),
          playoffs: getComputedActuals("playoffs")
        }}
        getSetStatus={getSetStatus}
        itemFreq={itemFreq}
        checkPrediction={checkPrediction}
        simulatedFutures={simulatedFuturesForExport}
        isSimulatingProbability={isSimulatingProbability}
        simulationProgress={simulationProgress}
        exportContainerRef={exportContainerRef}
        currentEvent={currentEvent}
      />
      <TextExportModal
        showModal={showTextExportModal}
        setShowModal={setShowTextExportModal}
        communityPicks={communityPicks}
        sortedCommunityPicks={sortedCommunityPicks}
        PLAYOFFS_SLOTS={PLAYOFFS_SLOTS}
        ACTUAL_RESULTS={{ [activeStage]: activeStageActuals }}
        checkPrediction={checkPrediction}
      />
      <DialogManager />
    </>
  );
}
