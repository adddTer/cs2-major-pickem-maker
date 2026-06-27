import React, { useState, useRef } from "react";
import { PickSet } from "../types";
import {
  Plus,
  Download,
  Upload,
  CheckSquare,
  Square,
  Trash2,
  AlertCircle,
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
        className="flex items-center gap-3 p-3 bg-black/50 dark:bg-white/50 dark:bg-zinc-800/50 rounded cursor-pointer hover:bg-white dark:bg-zinc-800 transition-colors border border-black/5 dark:border-white/5"
        onClick={onToggleAll}
      >
        {allSelected ? (
          <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        ) : (
          <Square className="w-5 h-5 text-zinc-500 dark:text-zinc-500" />
        )}
        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-200">
          全选 ({selectedIds.length}/{items.length})
        </span>
      </div>
      <div className="flex flex-col gap-1.5 mt-2">
        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors border ${isSelected ? "bg-blue-500/10 border-blue-500/30" : "bg-zinc-200/20 dark:bg-black/20 border-black/5 dark:border-white/5 hover:bg-zinc-200/40 dark:bg-black/40"}`}
              onClick={() => onToggle(item.id)}
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Square className="w-5 h-5 text-zinc-500 dark:text-zinc-500" />
              )}
              <div className="flex flex-col">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-200">
                  {item.name}
                </span>
                <span className="text-[0.625rem] text-zinc-500 dark:text-zinc-500">
                  {item.date}
                </span>
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
    <div className="flex-1 w-full flex flex-col relative overflow-hidden min-h-0 bg-transparent">
      {/* Header */}
      <div className="text-center space-y-2 mb-6 mt-2 px-4 shrink-0">
        <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 drop-shadow-sm">
          预测中心
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium">
          您的竞猜数据将安全地保存在本地设备中
        </p>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 pb-6 space-y-6">
        {/* Create New Section */}
        <div className="bg-white/60 dark:bg-zinc-900/60 p-5 rounded-3xl border border-black/5 dark:border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 font-display flex items-center gap-2 relative z-10">
            <div className="w-7 h-7 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Plus className="w-3.5 h-3.5" />
            </div>
            创建新预测
          </h3>
          <div className="flex flex-col gap-3 relative z-10">
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="输入预测 ID 或昵称"
              className="w-full bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-zinc-400 shadow-sm"
            />
            <button
              onClick={handleCreateNew}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 whitespace-nowrap"
            >
              开始预测
            </button>
          </div>
        </div>

        {/* Existing Picks Section */}
        <div className="flex flex-col min-h-0 bg-white/40 dark:bg-black/20 rounded-3xl border border-black/5 dark:border-white/5 p-5 backdrop-blur-sm relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-display flex items-center gap-2">
              已有记录
              <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-mono">
                {communityPicks.length}
              </span>
            </h3>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 bg-white/50 dark:bg-zinc-800/50 hover:bg-white/80 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-300 text-[0.6875rem] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm border border-black/5 dark:border-white/5"
                title="导入数据"
              >
                <Upload className="w-3.5 h-3.5" /> 导入
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".json"
              />
              <button
                onClick={handleOpenExport}
                disabled={communityPicks.length === 0}
                className="px-2.5 py-1.5 bg-white/50 dark:bg-zinc-800/50 hover:bg-white/80 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-300 text-[0.6875rem] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm border border-black/5 dark:border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                title="导出全部数据"
              >
                <Download className="w-3.5 h-3.5" /> 导出
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {communityPicks.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center border-2 border-black/5 dark:border-white/5 border-dashed rounded-2xl p-6 min-h-[160px]">
                <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                  暂无预测记录
                </p>
              </div>
            ) : (
              communityPicks.map((p) => (
                <div
                  key={p.id}
                  className="group flex flex-col p-4 rounded-2xl bg-white/80 dark:bg-zinc-800/80 border border-black/5 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden backdrop-blur-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative z-10 flex flex-col mb-3">
                    <h4
                      className="font-display font-bold text-zinc-900 dark:text-zinc-100 text-base truncate"
                      title={p.name}
                    >
                      {p.name}
                    </h4>
                    <p className="text-[0.625rem] text-zinc-500 dark:text-zinc-400 font-mono uppercase tracking-wider mt-0.5">
                      {new Date(p.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 relative z-10">
                    <button
                      onClick={() => handleEditExisting(p)}
                      className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl transition-all text-center"
                    >
                      进入预测
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(p.id)}
                      className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
        <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex justify-end shrink-0">
          <button
            onClick={handleExportSubmit}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-black dark:text-white font-bold text-sm transition-colors rounded-md shadow-lg shadow-blue-900/20"
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
        <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex justify-end shrink-0">
          <button
            onClick={handleImportSubmit}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-black dark:text-white font-bold text-sm transition-colors rounded-md shadow-lg shadow-blue-900/20"
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
          <p className="text-sm text-zinc-800 dark:text-zinc-300">
            您确定要删除此竞猜吗？该操作无法恢复。
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex justify-end gap-3 shrink-0">
          <button
            onClick={() => setDeleteTargetId(null)}
            className="px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 text-black dark:text-white text-sm font-bold rounded transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirmDelete}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-black dark:text-white text-sm font-bold rounded transition-colors shadow-lg shadow-rose-900/20"
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
          <p className="text-sm text-zinc-800 dark:text-zinc-300">
            {alertMessage}
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex justify-end shrink-0">
          <button
            onClick={() => setAlertMessage(null)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-black dark:text-white font-bold text-sm transition-colors rounded-md"
          >
            知道了
          </button>
        </div>
      </Modal>
    </div>
  );
};
