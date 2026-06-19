import React, { ReactNode, useRef, useState, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, RotateCcw, Download, Loader2, Copy, DownloadCloud, MousePointerClick } from "lucide-react";
import { BracketConfig, BracketNode, BracketEdge } from "../data/bracketConfigs";
import { dialog } from "./DialogManager";
import { ExportContext } from "../lib/ExportContext";
import { cn } from "../lib/utils";
import { Modal } from "./Modal";

export const TournamentBracketRenderer: React.FC<{
  config: BracketConfig;
  initialScale?: number;
  renderNode: (node: BracketNode) => ReactNode;
  svgDefs?: ReactNode;
}> = ({ config, initialScale = 1, renderNode, svgDefs }) => {
  const nodeDict = Object.fromEntries(config.nodes.map(n => [n.id, n]));
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [hiddenExportRender, setHiddenExportRender] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (hiddenExportRender) {
      const runExport = async () => {
        // Wait longer to allow proxy images to load completely
        await new Promise(r => setTimeout(r, 1500));
        if (!exportRef.current) {
          setIsExporting(false);
          setHiddenExportRender(false);
          return;
        }
        
        try {
          const htmlToImage = await import('html-to-image');
          const blob = await htmlToImage.toBlob(exportRef.current, {
            backgroundColor: document.documentElement.classList.contains("dark") ? "#070b09" : "#f8fafc",
            pixelRatio: 2,
            includeQueryParams: true,
            cacheBust: true,
            style: {
              transform: 'none',
              transformOrigin: 'top left',
            }
          });
          if (blob) {
            setExportBlob(blob);
            setPreviewBlobUrl(URL.createObjectURL(blob));
          } else {
             throw new Error("Blob generated is null");
          }
        } catch(err: any) {
          console.error(err);
          dialog.alert("导出预览时出错: " + (err.message || String(err)));
        } finally {
          setIsExporting(false);
          setHiddenExportRender(false);
        }
      };
      runExport();
    }
  }, [hiddenExportRender]);

  const handleDownload = () => {
    if (!previewBlobUrl) return;
    const link = document.createElement("a");
    link.download = `bracket-export-${Date.now()}.png`;
    link.href = previewBlobUrl;
    link.click();
  };

  const handleCopy = async () => {
    if (!exportBlob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': exportBlob })
      ]);
      dialog.alert("已复制到剪贴板！");
    } catch (err) {
      console.error(err);
      dialog.alert("复制失败，您的浏览器可能不支持此功能，请尝试下载图片。");
    }
  };

  const handleExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    setHiddenExportRender(true);
  };

  return (
    <div className="w-full flex-1 relative overflow-hidden">
      <TransformWrapper
        initialScale={initialScale}
        minScale={0.1}
        maxScale={2}
        centerOnInit={true}
        limitToBounds={false}
        wheel={{ step: 0.001 }}
        panning={{ velocityDisabled: false }}
      >
        {({ zoomIn, zoomOut, resetTransform, centerView }) => (
          <>
            <div className="absolute bottom-16 lg:bottom-[100px] left-4 lg:left-6 z-[100] flex items-center gap-1.5 px-2 py-1 lg:px-3 lg:py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-lg border border-zinc-200/55 dark:border-zinc-800/55 flex-shrink-0 pointer-events-auto">
              <button
                onClick={() => zoomIn(0.15)}
                title="放大"
                className="w-6 h-6 lg:w-8 lg:h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
              >
                <ZoomIn className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </button>
              <div className="w-[1px] h-3 lg:h-4 bg-zinc-200/60 dark:bg-zinc-800" />
              <button
                onClick={() => zoomOut(0.15)}
                title="缩小"
                className="w-6 h-6 lg:w-8 lg:h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
              >
                <ZoomOut className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </button>
              <div className="w-[1px] h-3 lg:h-4 bg-zinc-200/60 dark:bg-zinc-800" />
              <button
                onClick={() => {
                  resetTransform();
                  setTimeout(() => {
                    centerView(initialScale || 1);
                  }, 50);
                }}
                title="复位并居中"
                className="px-2 lg:px-3.5 h-6 lg:h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all text-[10px] lg:text-xs font-semibold active:scale-95 shadow-sm"
              >
                <RotateCcw className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                <span className="hidden sm:inline">复位居中</span>
              </button>
              <div className="w-[1px] h-3 lg:h-4 bg-zinc-200/60 dark:bg-zinc-800" />
              <button
                onClick={handleExport}
                disabled={isExporting}
                title="导出对阵图"
                className="px-2 lg:px-3.5 h-6 lg:h-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-700 text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all text-[10px] lg:text-xs font-semibold active:scale-95 shadow-sm"
              >
                {isExporting ? <Loader2 className="w-3 h-3 lg:w-3.5 lg:h-3.5 animate-spin" /> : <Download className="w-3 h-3 lg:w-3.5 lg:h-3.5" />}
                <span className="hidden sm:inline">{isExporting ? "导出中..." : "导出对阵图"}</span>
              </button>
            </div>
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%", cursor: "grab" }}
            >
              <div
                className="relative pointer-events-none px-4 flex-shrink-0"
                style={{ width: config.width, height: config.height }}
              >
                {/* SVG Connections */}
                <svg
                  className="absolute inset-0 w-full h-full z-0 pointer-events-none"
                  style={{ left: 0, top: 0 }}
                >
                  {svgDefs}
                  {config.nodes
                    .filter((node) => node.hasDropStub)
                    .map((node) => (
                      <path
                        key={`stub-${node.id}`}
                        d={`M ${node.x - 24} ${node.y + 20} L ${node.x} ${node.y + 20}`}
                        stroke="currentColor"
                        className="text-black/25 dark:text-white/25"
                        strokeWidth="1.5"
                        fill="none"
                        strokeDasharray="3 3"
                        strokeLinecap="round"
                      />
                    ))}
                  {config.edges.map((edge, i) => {
                    const p1 = nodeDict[edge.from];
                    const p2 = nodeDict[edge.to];
                    if (!p1 || !p2) return null;

                    if (edge.type === "swiss") {
                      // Swiss uses cubic bezier curve and offset variables. We fix default offsets if not specified
                      const o1 = 65;
                      const o2 = 65;
                      const sx = p1.x + o1;
                      const sy = p1.y;
                      const ex = p2.x - o2;
                      const ey = p2.y;

                      const dist = Math.abs(ex - sx);
                      const cx1 = sx + dist * 0.5;
                      const cx2 = ex - dist * 0.5;

                      return (
                        <path
                          key={i}
                          d={`M ${sx} ${sy} C ${cx1} ${sy}, ${cx2} ${ey}, ${ex} ${ey}`}
                          stroke={`url(#${edge.win ? "win" : "loss"}-grad)`}
                          strokeWidth="1.5"
                          fill="none"
                          strokeDasharray="5 3"
                          className="opacity-45"
                        />
                      );
                    } else if (edge.type === "playoffs") {
                      // Playoffs uses piecewise orthogonal curves
                      const W = 180;
                      const H = 40;
                      const sx = p1.x + W;
                      const sy = p1.y + H / 2;
                      const ex = p2.x;
                      const ey = p2.y + H / 2;
                      const midX = sx + (ex - sx) / 2;

                      const R = 16;
                      const dirY = Math.sign(ey - sy);
                      const r = Math.min(R, Math.abs(ey - sy) / 2);

                      let d = "";
                      if (edge.win === false) {
                        const dist = Math.abs(ex - sx);
                        const cx1 = sx + dist * 0.5;
                        const cx2 = ex - dist * 0.5;
                        d = `M ${sx} ${sy} C ${cx1} ${sy}, ${cx2} ${ey}, ${ex} ${ey}`;
                      } else {
                        if (Math.abs(ey - sy) < 1) {
                          d = `M ${sx} ${sy} L ${ex} ${ey}`;
                        } else {
                          d = `M ${sx} ${sy} L ${midX - r} ${sy} Q ${midX} ${sy} ${midX} ${sy + r * dirY} L ${midX} ${ey - r * dirY} Q ${midX} ${ey} ${midX + r} ${ey} L ${ex} ${ey}`;
                        }
                      }

                      let strokeProps = {
                        stroke: "currentColor",
                        className: "text-black/15 dark:text-white/15",
                        strokeDasharray: "none"
                      };
                      if (edge.win === false) {
                        strokeProps = {
                          stroke: "#EF4444", // Red 500
                          className: "opacity-40 hover:opacity-100 transition-opacity",
                          strokeDasharray: "4 4"
                        };
                      }

                      return (
                        <path
                          key={i}
                          d={d}
                          {...strokeProps}
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      );
                    }
                    return null;
                  })}
                </svg>

                {/* Nodes rendering based on config */}
                {config.nodes.map((node) => {
                  return (
                    <div
                      key={node.id}
                      style={{ left: node.x, top: node.y }}
                      className={
                        node.type === "swissGroup" || node.type === "swissResult"
                          ? "absolute transform -translate-x-1/2 -translate-y-1/2 z-10 w-max"
                          : "absolute pointer-events-auto shadow-sm"
                      }
                    >
                      {renderNode(node)}
                    </div>
                  );
                })}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Hidden export layer */}
      {hiddenExportRender && (
        <ExportContext.Provider value={Date.now()}>
          <div className="absolute left-[-9999px] top-[-9999px]">
            <div
              ref={exportRef}
              className="relative pointer-events-none px-4 flex-shrink-0 bg-transparent flex items-center justify-center p-8"
              style={{ width: config.width + 64, height: config.height + 64 }}
            >
              <div
                className="relative"
                style={{ width: config.width, height: config.height }}
              >
                {/* SVG Connections for Export */}
                <svg
                  className="absolute inset-0 w-full h-full z-0 pointer-events-none"
                  style={{ left: 0, top: 0 }}
                >
                  {svgDefs}
                  {config.nodes
                    .filter((node) => node.hasDropStub)
                    .map((node) => (
                      <path
                        key={`stub-${node.id}`}
                        d={`M ${node.x - 24} ${node.y + 20} L ${node.x} ${node.y + 20}`}
                        stroke="currentColor"
                        className="text-black/25 dark:text-white/25"
                        strokeWidth="1.5"
                        fill="none"
                        strokeDasharray="3 3"
                        strokeLinecap="round"
                      />
                    ))}
                  {config.edges.map((edge, i) => {
                    const p1 = nodeDict[edge.from];
                    const p2 = nodeDict[edge.to];
                    if (!p1 || !p2) return null;

                    if (edge.type === "swiss") {
                      const o1 = 65;
                      const o2 = 65;
                      const sx = p1.x + o1;
                      const sy = p1.y;
                      const ex = p2.x - o2;
                      const ey = p2.y;
                      const dist = Math.abs(ex - sx);
                      const cx1 = sx + dist * 0.5;
                      const cx2 = ex - dist * 0.5;

                      return (
                        <path
                          key={i}
                          d={`M ${sx} ${sy} C ${cx1} ${sy}, ${cx2} ${ey}, ${ex} ${ey}`}
                          stroke={`url(#${edge.win ? "win" : "loss"}-grad)`}
                          strokeWidth="1.5"
                          fill="none"
                          strokeDasharray="5 3"
                          className="opacity-45"
                        />
                      );
                    } else if (edge.type === "playoffs") {
                      const W = 180;
                      const H = 40;
                      const sx = p1.x + W;
                      const sy = p1.y + H / 2;
                      const ex = p2.x;
                      const ey = p2.y + H / 2;
                      const midX = sx + (ex - sx) / 2;
                      const R = 16;
                      const dirY = Math.sign(ey - sy);
                      const r = Math.min(R, Math.abs(ey - sy) / 2);

                      let d = "";
                      if (edge.win === false) {
                        const dist = Math.abs(ex - sx);
                        const cx1 = sx + dist * 0.5;
                        const cx2 = ex - dist * 0.5;
                        d = `M ${sx} ${sy} C ${cx1} ${sy}, ${cx2} ${ey}, ${ex} ${ey}`;
                      } else {
                        if (Math.abs(ey - sy) < 1) {
                          d = `M ${sx} ${sy} L ${ex} ${ey}`;
                        } else {
                          d = `M ${sx} ${sy} L ${midX - r} ${sy} Q ${midX} ${sy} ${midX} ${sy + r * dirY} L ${midX} ${ey - r * dirY} Q ${midX} ${ey} ${midX + r} ${ey} L ${ex} ${ey}`;
                        }
                      }

                      let strokeProps = {
                        stroke: "currentColor",
                        className: "text-black/15 dark:text-white/15",
                        strokeDasharray: "none"
                      };
                      if (edge.win === false) {
                        strokeProps = {
                          stroke: "#EF4444",
                          className: "opacity-40 hover:opacity-100 transition-opacity",
                          strokeDasharray: "4 4"
                        };
                      }

                      return (
                        <path
                          key={i}
                          d={d}
                          {...strokeProps}
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      );
                    }
                    return null;
                  })}
                </svg>

                {/* Nodes rendering based on config for Export */}
                {config.nodes.map((node) => {
                  return (
                    <div
                      key={node.id}
                      style={{ left: node.x, top: node.y }}
                      className={
                        cn(
                          node.type === "swissGroup" || node.type === "swissResult"
                            ? "absolute transform -translate-x-1/2 -translate-y-1/2 z-10 w-max"
                            : "absolute shadow-sm",
                          "pointer-events-none"
                        )
                      }
                    >
                      {renderNode(node)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ExportContext.Provider>
      )}

      <Modal
        isOpen={!!previewBlobUrl}
        onClose={() => setPreviewBlobUrl(null)}
        title="保存或分享"
        maxWidthClass="max-w-md md:max-w-3xl lg:max-w-[1000px]"
      >
        <div className="flex flex-col gap-4">
          <div className="bg-zinc-200/50 dark:bg-black/40 rounded-xl flex items-center justify-center p-2 min-h-[50vh] overflow-hidden select-none relative">
            <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-auto overflow-auto custom-scrollbar flex items-center justify-center">
              {previewBlobUrl && (
                <img
                  src={previewBlobUrl}
                  alt="Preview"
                  className="max-w-full drop-shadow-2xl"
                  draggable={false}
                />
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-medium transition-all active:scale-[0.98]"
            >
              <DownloadCloud className="w-5 h-5" />
              下载图片
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 h-12 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl font-medium transition-all active:scale-[0.98]"
            >
              <Copy className="w-5 h-5" />
              复制到剪贴板
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
