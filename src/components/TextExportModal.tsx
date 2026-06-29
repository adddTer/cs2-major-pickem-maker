import React, { useState } from "react";
import { PickSet, StageKey, SlotType, PickSlot, BracketMatch } from "../types";
import { Copy, Download, FileText } from "lucide-react";
import { TEAMS } from "../data/teams";
import { MATCHES } from "../data/matches";
import { dialog } from "./DialogManager";
import { PopupUI } from "./PopupUI";

interface TextExportModalProps {
  showModal: boolean;
  setShowModal: (val: boolean) => void;
  communityPicks: PickSet[];
  sortedCommunityPicks: PickSet[];
  PLAYOFFS_SLOTS: PickSlot[];
  ACTUAL_RESULTS: Record<string, PickSlot[]>;
  checkPrediction: (
    teamId: string | null,
    type: SlotType,
    stage: string,
  ) => "correct" | "incorrect" | "unknown";
}

export const TextExportModal: React.FC<TextExportModalProps> = ({
  showModal,
  setShowModal,
  communityPicks,
  sortedCommunityPicks,
  PLAYOFFS_SLOTS,
  ACTUAL_RESULTS,
  checkPrediction,
}) => {
  const [selectedStages, setSelectedStages] = useState<StageKey[]>([
    "stage1",
    "stage2",
    "stage3",
    "playoffs",
  ]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [includeResults, setIncludeResults] = useState(true);
  const [previewText, setPreviewText] = useState<string | null>(null);

  const stageLabels: Record<string, string> = {
    stage1: "第一阶段",
    stage2: "第二阶段",
    stage3: "第三阶段",
    playoffs: "决胜阶段",
  };

  const getTeamName = (teamId?: string | null) => {
    if (!teamId) return "TBD";
    return TEAMS.find((t) => t.id === teamId)?.name || teamId;
  };

  const formatMatch = (m: BracketMatch) => {
    const name1 = getTeamName(m.team1Id);
    const name2 = getTeamName(m.team2Id);
    if (m.score1 === undefined || m.score2 === undefined) {
      return `${name1} vs ${name2} (TBD)`;
    }
    let mapStr = "";
    if (m.maps && m.maps.length > 0) {
      mapStr = ` (${m.maps.map((mp) => `${mp.score1}-${mp.score2}`).join(", ")})`;
    }
    const formatStr = m.format ? ` [${m.format.toUpperCase()}]` : "";
    return `${name1} ${m.score1} - ${m.score2} ${name2}${mapStr}${formatStr}`;
  };

  const getStageMatchRecords = (stage: StageKey) => {
    const stageMatches = MATCHES[stage];
    if (!stageMatches || Object.keys(stageMatches).length === 0)
      return "暂无比赛记录。\n";

    let text = "";

    if (stage === "playoffs") {
      const qs = stageMatches["qf"] || [];
      const ss = stageMatches["sf"] || [];
      const fs = stageMatches["final"] || [];

      if (qs.length > 0) {
        text +=
          "【四分之一决赛】\n" +
          qs.map((m) => formatMatch(m)).join("\n") +
          "\n";
      }
      if (ss.length > 0) {
        text +=
          "【半决赛】\n" + ss.map((m) => formatMatch(m)).join("\n") + "\n";
      }
      if (fs.length > 0) {
        text += "【决赛】\n" + fs.map((m) => formatMatch(m)).join("\n") + "\n";
      }
    } else {
      const rounds = [
        { key: "0:0", label: "第一轮 (0-0)" },
        { key: "1:0", label: "第二轮上层 (1-0)" },
        { key: "0:1", label: "第二轮下层 (0-1)" },
        { key: "2:0", label: "第三轮上层 (2-0)" },
        { key: "1:1", label: "第三轮中层 (1-1)" },
        { key: "0:2", label: "第三轮下层 (0-2)" },
        { key: "2:1", label: "第四轮上层 (2-1)" },
        { key: "1:2", label: "第四轮下层 (1-2)" },
        { key: "2:2", label: "第五轮 (2-2)" },
      ];

      for (const round of rounds) {
        const ms = stageMatches[round.key];
        if (ms && ms.length > 0) {
          text +=
            `【${round.label}】\n` +
            ms.map((m) => formatMatch(m)).join("\n") +
            "\n";
        }
      }
    }

    return text || "暂无比赛记录。\n";
  };

  const getStageText = (
    stage: StageKey,
    picks: PickSlot[],
    showCheckMarks: boolean,
  ) => {
    if (stage === "playoffs") {
      let qs = "",
        ss = "",
        fs = "",
        cs = "";
      PLAYOFFS_SLOTS.forEach((s) => {
        let pick = picks.find(
          (p) => p.id === s.id || p.id === `playoffs-${s.id}`,
        );

        if (!pick && s.type === "qf") {
          const qfActuals =
            ACTUAL_RESULTS[stage]?.filter((x: any) => x.type === "qf") || [];
          const sTypeIdx = PLAYOFFS_SLOTS.filter(
            (x) => x.type === "qf",
          ).findIndex((x) => x.id === s.id);
          if (qfActuals[sTypeIdx]?.teamId) {
            pick = { id: s.id, type: "qf", teamId: qfActuals[sTypeIdx].teamId };
          }
        }

        if (!pick) return;
        const name = getTeamName(pick.teamId);
        const mark =
          showCheckMarks && pick.teamId
            ? checkPrediction(pick.teamId, s.type, stage) === "correct"
              ? " [✓]"
              : checkPrediction(pick.teamId, s.type, stage) === "incorrect"
                ? " [✗]"
                : ""
            : "";

        if (s.type === "qf") qs += `${name}${mark}, `;
        if (s.type === "sf") ss += `${name}${mark}, `;
        if (s.type === "final") fs += `${name}${mark}, `;
        if (s.type === "champion") cs += `${name}${mark}`;
      });
      return `四分之一决赛: ${qs.slice(0, -2) || "无"}
半决赛: ${ss.slice(0, -2) || "无"}
决赛: ${fs.slice(0, -2) || "无"}
冠军: ${cs || "无"}
`;
    } else {
      const t30 = picks.filter((p) => p.type === "3-0");
      const tAdv = picks.filter((p) => p.type === "advance");
      const t03 = picks.filter((p) => p.type === "0-3");

      const mapPicks = (arr: PickSlot[]) =>
        arr
          .map((p) => {
            const mark =
              showCheckMarks && p.teamId
                ? checkPrediction(p.teamId, p.type, stage) === "correct"
                  ? " [✓]"
                  : checkPrediction(p.teamId, p.type, stage) === "incorrect"
                    ? " [✗]"
                    : ""
                : "";
            return getTeamName(p.teamId) + mark;
          })
          .join(", ") || "无";

      return `3-0 晋级: ${mapPicks(t30)}
3-1 3-2 晋级: ${mapPicks(tAdv)}
0-3 淘汰: ${mapPicks(t03)}
`;
    }
  };

  const handleGeneratePreview = () => {
    if (selectedStages.length === 0) {
      dialog.alert("请至少选择一个导出阶段！");
      return;
    }
    if (!includeResults && selectedIds.length === 0) {
      dialog.alert("请至少选择包含实际结果或者任意一份社区竞猜！");
      return;
    }

    let text = "【 IEM Cologne 2026 - 竞猜导出记录 】\n";
    text += "=========================================\n\n";

    for (const stage of selectedStages) {
      text += `<<< ${stageLabels[stage]} >>>\n\n`;

      if (includeResults) {
        const actuals = ACTUAL_RESULTS[stage] || [];
        text += `[ 实际比赛记录 ]\n`;
        text += getStageMatchRecords(stage) + "\n";

        text += `[ 实际晋级结果 ]\n`;
        if (actuals.length === 0) {
          text += "暂无数据或此阶段未结束。\n";
        } else {
          text += getStageText(stage, actuals, false);
        }
        text += "\n";
      }

      const selectedParticipants = sortedCommunityPicks.filter((p) =>
        selectedIds.includes(p.id),
      );
      for (const p of selectedParticipants) {
        const theirPicks = p.picks[stage] || [];
        text += `[ ${p.name} 的竞猜 ]\n`;
        text += getStageText(stage, theirPicks, true);
        text += "\n";
      }

      text += "-----------------------------------------\n\n";
    }

    setPreviewText(text);
  };

  const handleCopy = async () => {
    if (!previewText) return;
    try {
      await navigator.clipboard.writeText(previewText);
      dialog.alert("文本已复制到剪贴板！");
    } catch (err) {
      console.error(err);
      dialog.alert("复制失败！");
    }
  };

  const handleDownload = () => {
    if (!previewText) return;
    const element = document.createElement("a");
    const file = new Blob([previewText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `pickem-records-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <PopupUI.Modal
      isOpen={showModal}
      onClose={() => {
        setShowModal(false);
        setPreviewText(null);
      }}
      title={previewText ? "导出预览 (文本)" : "配置文本导出"}
    >
      {previewText ? (
        <div className="flex flex-col gap-4 max-w-full">
          <textarea
            className="w-full h-80 bg-zinc-50 dark:bg-zinc-950 text-emerald-400 font-mono text-xs p-3 rounded border border-black/10 dark:border-white/10 resize-none focus:outline-none custom-scrollbar"
            readOnly
            value={previewText}
          />
          <div className="flex justify-end gap-3 mt-2">
            <PopupUI.ActionButton
              label="返回修改"
              variant="secondary"
              onClick={() => setPreviewText(null)}
            />
            <PopupUI.ActionButton
              label="复制文本"
              icon={Copy}
              onClick={handleCopy}
            />
            <PopupUI.ActionButton
              label="下载 TXT"
              icon={Download}
              variant="success"
              onClick={handleDownload}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <PopupUI.SectionTitle>要导出的阶段 (可多选)</PopupUI.SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {["stage1", "stage2", "stage3", "playoffs"].map((st) => (
              <PopupUI.CheckboxRow
                key={st}
                label={stageLabels[st]}
                checked={selectedStages.includes(st as StageKey)}
                onChange={() =>
                  setSelectedStages((prev) =>
                    prev.includes(st as StageKey)
                      ? prev.filter((x) => x !== st)
                      : [...prev, st as StageKey],
                  )
                }
              />
            ))}
          </div>

          <PopupUI.SectionTitle>导出内容</PopupUI.SectionTitle>
          <PopupUI.SwitchRow
            label="包含实际比赛结果"
            checked={includeResults}
            onChange={setIncludeResults}
          />

          <PopupUI.SectionTitle>选择包含的社区竞猜</PopupUI.SectionTitle>
          <div className="flex flex-col gap-2">
            <PopupUI.CheckboxRow
              label="全选"
              countText={`(${selectedIds.length}/${communityPicks.length})`}
              checked={selectedIds.length === communityPicks.length && communityPicks.length > 0}
              onChange={() =>
                setSelectedIds(
                  selectedIds.length === communityPicks.length
                    ? []
                    : communityPicks.map((p) => p.id),
                )
              }
              className="bg-black/5 dark:bg-white/5 border-none"
            />
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[160px] custom-scrollbar">
              {sortedCommunityPicks.map((item) => (
                <PopupUI.CheckboxRow
                  key={item.id}
                  label={item.name}
                  checked={selectedIds.includes(item.id)}
                  onChange={() =>
                    setSelectedIds((prev) =>
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
              label="生成文本预览"
              icon={FileText}
              onClick={handleGeneratePreview}
            />
          </div>
        </div>
      )}
    </PopupUI.Modal>
  );
};
