import React, { useState, useRef } from "react";
import { PickSet } from "../types";
import {
  Plus,
  Download,
  Upload,
  CheckSquare,
  Square,
  Trash2,
} from "lucide-react";
import { Modal } from "../components/Modal";
import { savePickSet, deletePickSet } from "../lib/db";

const CheckboxList: React.FC<{
  items: { id: string; name: string; date: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}> = ({ items, selectedIds, onToggle, onToggleAll }) => {
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded cursor-pointer hover:bg-zinc-800 transition-colors border border-white/5"
        onClick={onToggleAll}
      >
        {allSelected ? (
          <CheckSquare className="w-5 h-5 text-blue-400" />
        ) : (
          <Square className="w-5 h-5 text-zinc-500" />
        )}
        <span className="font-bold text-sm text-zinc-200">
          全选 ({selectedIds.length}/{items.length})
        </span>
      </div>
      <div className="flex flex-col gap-1.5 mt-2">
        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors border ${isSelected ? "bg-blue-500/10 border-blue-500/30" : "bg-black/20 border-white/5 hover:bg-black/40"}`}
              onClick={() => onToggle(item.id)}
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-400" />
              ) : (
                <Square className="w-5 h-5 text-zinc-500" />
              )}
              <div className="flex flex-col">
                <span className="font-bold text-sm text-zinc-200">
                  {item.name}
                </span>
                <span className="text-[10px] text-zinc-500">{item.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const HomeView: React.FC<{
  newNickname: string;
  setNewNickname: (val: string) => void;
  communityPicks: PickSet[];
  handleCreateNew: () => void;
  handleEditExisting: (pickSet: PickSet) => void;
  refreshPicks?: () => void;
}> = ({
  newNickname,
  setNewNickname,
  communityPicks,
  handleCreateNew,
  handleEditExisting,
  refreshPicks,
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportSelectedIds, setExportSelectedIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedPicks, setImportedPicks] = useState<PickSet[]>([]);
  const [importSelectedIds, setImportSelectedIds] = useState<string[]>([]);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const handleOpenExport = () => {
    setExportSelectedIds(communityPicks.map((p) => p.id));
    setShowExportModal(true);
  };

  const handleExportSubmit = () => {
    if (exportSelectedIds.length === 0) {
      setAlertMessage("请至少选择一项导出！");
      return;
    }
    const dataToExport = communityPicks.filter((p) =>
      exportSelectedIds.includes(p.id),
    );
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pickem-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string) as PickSet[];
        if (Array.isArray(data)) {
          setImportedPicks(data);
          setImportSelectedIds(data.map((p) => p.id));
          setShowImportModal(true);
        } else {
          setAlertMessage("数据格式不正确");
        }
      } catch (err) {
        setAlertMessage("读取文件失败或格式不正确");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportSubmit = async () => {
    if (importSelectedIds.length === 0) {
      setAlertMessage("请至少选择一项导入！");
      return;
    }
    const dataToImport = importedPicks.filter((p) =>
      importSelectedIds.includes(p.id),
    );
    for (const pick of dataToImport) {
      await savePickSet(pick);
    }
    setShowImportModal(false);
    setAlertMessage(`成功导入 ${dataToImport.length} 条竞猜数据！`);
    if (refreshPicks) refreshPicks();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    await deletePickSet(deleteTargetId);
    setDeleteTargetId(null);
    if (refreshPicks) refreshPicks();
  };

  return (
    <div className="flex-1 w-full flex flex-col bg-zinc-900/60 border border-white/5 rounded-lg shadow-xl relative backdrop-blur-md overflow-hidden max-w-2xl mx-auto p-4 sm:p-6 lg:p-4 lg:bg-transparent lg:shadow-none lg:border-none">
      <div className="text-center space-y-2 mb-6 sm:mb-8 mt-2 sm:mt-4">
        <h1 className="text-xl sm:text-2xl font-black tracking-wide text-zinc-100">
          选择或创建预测 ID
        </h1>
        <p className="text-zinc-400 text-xs sm:text-sm">
          创建的竞猜将保存在本地。
        </p>
      </div>

      <div className="bg-zinc-950/50 p-4 sm:p-6 rounded-lg border border-white/5 shadow-inner mb-6 sm:mb-8 shrink-0">
        <h3 className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 sm:mb-4">
          创建新预测
        </h3>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            placeholder="输入预测 ID 或昵称"
            className="w-full bg-black/40 border border-white/10 rounded px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-zinc-100 outline-none focus:border-blue-500/50 transition-colors"
          />
          <button
            onClick={handleCreateNew}
            className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors rounded-md flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" /> 创建竞猜
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
          <h3 className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-widest">
            已有竞猜
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 mt-[1px]" /> 导入数据
            </button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button
              onClick={handleOpenExport}
              disabled={communityPicks.length === 0}
              className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold rounded flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 mt-[1px]" /> 导出数据
            </button>
          </div>
        </div>

        {communityPicks.length === 0 ? (
          <div className="p-4 sm:p-8 text-center border border-white/5 border-dashed rounded-lg text-zinc-500 text-xs sm:text-sm mx-1">
            还没有保存任何预测，请输入昵称创建，或者导入已有数据。
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:gap-3 px-1 min-w-0">
            {communityPicks.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-zinc-900/80 border border-white/5 hover:border-white/20 transition-colors min-w-0 w-full"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-zinc-100 text-sm sm:text-base truncate">
                      {p.name}
                    </h4>
                    <p className="text-[9px] sm:text-[10px] text-zinc-500 mt-0.5 truncate">
                      保存时间：{new Date(p.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 pl-2">
                  <button
                    onClick={() => handleEditExisting(p)}
                    className="shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] sm:text-xs font-bold rounded transition-colors whitespace-nowrap"
                  >
                    进入
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(p.id)}
                    className="shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] sm:text-xs font-bold rounded transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="导出竞猜数据"
      >
        <div className="flex flex-col min-h-0">
          <div className="overflow-y-auto pr-2 custom-scrollbar max-h-[50vh]">
            <CheckboxList
              items={communityPicks.map((p) => ({
                id: p.id,
                name: p.name,
                date: new Date(p.createdAt).toLocaleString(),
              }))}
              selectedIds={exportSelectedIds}
              onToggle={(id) =>
                setExportSelectedIds((prev) =>
                  prev.includes(id)
                    ? prev.filter((x) => x !== id)
                    : [...prev, id],
                )
              }
              onToggleAll={() =>
                setExportSelectedIds(
                  exportSelectedIds.length === communityPicks.length
                    ? []
                    : communityPicks.map((p) => p.id),
                )
              }
            />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-end shrink-0">
          <button
            onClick={handleExportSubmit}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors rounded-md shadow-lg shadow-blue-900/20"
          >
            确认导出 ({exportSelectedIds.length})
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="导入竞猜数据"
      >
        <div className="flex flex-col min-h-0">
          <div className="overflow-y-auto pr-2 custom-scrollbar max-h-[50vh]">
            <CheckboxList
              items={importedPicks.map((p) => ({
                id: p.id,
                name: p.name,
                date: new Date(p.createdAt).toLocaleString(),
              }))}
              selectedIds={importSelectedIds}
              onToggle={(id) =>
                setImportSelectedIds((prev) =>
                  prev.includes(id)
                    ? prev.filter((x) => x !== id)
                    : [...prev, id],
                )
              }
              onToggleAll={() =>
                setImportSelectedIds(
                  importSelectedIds.length === importedPicks.length
                    ? []
                    : importedPicks.map((p) => p.id),
                )
              }
            />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-end shrink-0">
          <button
            onClick={handleImportSubmit}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors rounded-md shadow-lg shadow-blue-900/20"
          >
            确认导入 ({importSelectedIds.length})
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        title="确认删除"
      >
        <div className="py-4">
          <p className="text-sm text-zinc-300">
            您确定要删除此竞猜吗？该操作无法恢复。
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-end gap-3 shrink-0">
          <button
            onClick={() => setDeleteTargetId(null)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirmDelete}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded transition-colors shadow-lg shadow-rose-900/20"
          >
            确认删除
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!alertMessage}
        onClose={() => setAlertMessage(null)}
        title="提示"
      >
        <div className="py-4">
          <p className="text-sm text-zinc-300">{alertMessage}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-end shrink-0">
          <button
            onClick={() => setAlertMessage(null)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors rounded-md"
          >
            知道了
          </button>
        </div>
      </Modal>
    </div>
  );
};
