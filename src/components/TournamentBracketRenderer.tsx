import React, { ReactNode, useRef, useState, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, RotateCcw, Download, Loader2, Copy, DownloadCloud, MousePointerClick } from "lucide-react";
import { BracketConfig, BracketNode, BracketEdge } from "../data/bracketConfigs";
import { dialog } from "./DialogManager";
import { ExportContext } from "../lib/ExportContext";
import { ExportSettingsContext } from "../lib/ExportSettingsContext";
import { cn } from "../lib/utils";
import { Modal } from "./Modal";

export const TournamentBracketRenderer: React.FC<{
  config: BracketConfig;
  initialScale?: number;
  renderNode: (node: BracketNode, isExportNode?: boolean) => ReactNode;
  svgDefs?: ReactNode;
  title?: string;
  logoUrl?: string;
}> = ({ config, initialScale = 1, renderNode, svgDefs, title, logoUrl }) => {
  const nodeDict = Object.fromEntries(config.nodes.map(n => [n.id, n]));
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [hiddenExportRender, setHiddenExportRender] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportTheme, setExportTheme] = useState<"light" | "dark">("dark");
  const [exportShowIcon, setExportShowIcon] = useState(true);
  const [exportShowName, setExportShowName] = useState(true);
  const [exportBackground, setExportBackground] = useState<"solid" | "gradient" | "aurora" | "grid">("aurora");
  const [exportAccent, setExportAccent] = useState<"blue" | "emerald" | "purple" | "rose" | "orange">("blue");
  const [exportUseShortName, setExportUseShortName] = useState(false);

  const runExport = async (
    themeArg = exportTheme,
    iconArg = exportShowIcon,
    nameArg = exportShowName,
    bgArg = exportBackground,
    accentArg = exportAccent,
    shortNameArg = exportUseShortName
  ) => {
    setIsExporting(true);
    setHiddenExportRender(true);
    
    // We need to sync state here if we passed an argument so the JSX renders correctly
    setExportTheme(themeArg);
    setExportShowIcon(iconArg);
    setExportShowName(nameArg);
    setExportBackground(bgArg);
    setExportAccent(accentArg);
    setExportUseShortName(shortNameArg);

    // Wait longer to allow proxy images to load completely
    await new Promise(r => setTimeout(r, 1500));
    if (!exportRef.current) {
      setIsExporting(false);
      setHiddenExportRender(false);
      return;
    }
    
    try {
      const isDarkForExport = themeArg === "dark";
      
      // wait a bit for styles
      await new Promise(r => setTimeout(r, 150));

      const htmlToImage = await import('html-to-image');
      const target = exportRef.current;

      const blob = await htmlToImage.toBlob(target, {
        backgroundColor: isDarkForExport ? "#070b09" : "#f8fafc",
        pixelRatio: 3,
        includeQueryParams: true,
        cacheBust: true,
      });
      
      if (blob) {
        setExportBlob(blob);
        setPreviewBlobUrl(URL.createObjectURL(blob));
      } else {
         dialog.alert("导出预览时出错: Blob generated is null");
      }
      
    } catch(err: any) {
      console.error(err);
      dialog.alert("导出预览时出错: " + (err.message || String(err)));
    } finally {
      setIsExporting(false);
      setHiddenExportRender(false);
    }
  };



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
    setIsModalOpen(true);
    // Don't auto-generate, let the user configure first
  };

  const colors = {
    blue: { light: "rgba(59, 130, 246, 0.25)", dark: "rgba(29, 78, 216, 0.35)", baseDark: "#070b09", baseLight: "#f8fafc", glow: "rgba(59, 130, 246, 0.4)", hex: "#3b82f6" },
    emerald: { light: "rgba(16, 185, 129, 0.25)", dark: "rgba(4, 120, 87, 0.35)", baseDark: "#070b09", baseLight: "#f8fafc", glow: "rgba(16, 185, 129, 0.4)", hex: "#10b981" },
    purple: { light: "rgba(168, 85, 247, 0.25)", dark: "rgba(126, 34, 206, 0.35)", baseDark: "#070b09", baseLight: "#f8fafc", glow: "rgba(168, 85, 247, 0.4)", hex: "#a855f7" },
    rose: { light: "rgba(244, 63, 94, 0.25)", dark: "rgba(190, 18, 60, 0.35)", baseDark: "#070b09", baseLight: "#f8fafc", glow: "rgba(244, 63, 94, 0.4)", hex: "#f43f5e" },
    orange: { light: "rgba(249, 115, 22, 0.25)", dark: "rgba(194, 65, 12, 0.35)", baseDark: "#070b09", baseLight: "#f8fafc", glow: "rgba(249, 115, 22, 0.4)", hex: "#f97316" },
  };

  const getBgStyle = () => {
    const isDark = exportTheme === "dark";
    const c = colors[exportAccent];
    const accent = isDark ? c.dark : c.light;
    const base = isDark ? c.baseDark : c.baseLight;
    
    if (exportBackground === "solid") return { background: base };
    if (exportBackground === "gradient") return { background: `linear-gradient(to bottom, ${accent} 0%, ${base} 100%)` };
    if (exportBackground === "aurora") return { background: base };
    if (exportBackground === "grid") {
      const gridColor = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
      return {
        backgroundColor: base,
        backgroundImage: `radial-gradient(at 50% 0%, ${accent} 0%, transparent 70%), linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 40px 40px, 40px 40px",
      };
    }
    return { background: base };
  };

  return (
    <div className="w-full flex-1 min-h-0 relative overflow-hidden">
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
            <div className="absolute bottom-24 lg:bottom-[100px] left-4 lg:left-6 z-[200] flex items-center gap-1.5 px-2 py-1 lg:px-3 lg:py-1.5 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-lg border border-zinc-200/55 dark:border-zinc-800/55 flex-shrink-0 pointer-events-auto">
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
                className="px-2 lg:px-3.5 h-6 lg:h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all text-[0.625rem] lg:text-xs font-semibold active:scale-95 shadow-sm"
              >
                <RotateCcw className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                <span className="hidden sm:inline">复位居中</span>
              </button>
              <div className="w-[1px] h-3 lg:h-4 bg-zinc-200/60 dark:bg-zinc-800" />
              <button
                onClick={handleExport}
                disabled={isExporting}
                title="导出对阵图"
                className="px-2 lg:px-3.5 h-6 lg:h-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-700 text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all text-[0.625rem] lg:text-xs font-semibold active:scale-95 shadow-sm"
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
                <div className="relative shrink-0" style={{ width: config.width, height: config.height }}>
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
                      const W = 190;
                      const H = 48;
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
                          strokeWidth="2"
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
                          : "absolute pointer-events-auto"
                      }
                    >
                      {renderNode(node, false)}
                    </div>
                  );
                })}
                </div>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Hidden export layer */}
      {hiddenExportRender && (
        <ExportContext.Provider value={Date.now()}>
        <ExportSettingsContext.Provider value={{ useShortName: exportUseShortName }}>
          <div className="fixed left-0 top-0 -z-50 opacity-0 pointer-events-none overflow-visible">
            <div
              ref={exportRef}
              className={cn(
                "export-mode relative pointer-events-none flex-shrink-0 flex flex-col items-center justify-center box-border overflow-hidden",
                exportTheme === "dark" ? "dark text-white" : "text-black"
              )}
              style={{ width: config.width + 160, padding: "60px 60px 100px 60px", ...getBgStyle() }}
            >
              {exportBackground === "aurora" && (
                <div 
                  className="absolute inset-0 pointer-events-none" 
                  style={{ background: `radial-gradient(ellipse at top, ${exportTheme === "dark" ? colors[exportAccent].dark : colors[exportAccent].light}, transparent 70%)` }}
                />
              )}

              {(exportShowIcon && logoUrl) || (exportShowName && title) ? (
                <div className="flex flex-col items-center gap-4 z-50 mb-12 shrink-0 relative w-full">
                  {exportShowIcon && logoUrl && (
                    <div className="relative">
                      <div className="absolute inset-0 blur-[40px] rounded-full scale-150 pointer-events-none" style={{ backgroundColor: colors[exportAccent].glow }} />
                      <img src={`https://wsrv.nl/?url=${encodeURIComponent(logoUrl)}`} crossOrigin="anonymous" referrerPolicy="no-referrer" className="relative h-24 w-auto object-contain drop-shadow-xl" alt="Logo" />
                    </div>
                  )}
                  {exportShowName && title && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-4xl font-black tracking-tighter uppercase whitespace-nowrap font-sans text-transparent bg-clip-text drop-shadow-sm" style={{ backgroundImage: `linear-gradient(to bottom, ${exportTheme === "dark" ? "white, rgba(255,255,255,0.6)" : "black, rgba(0,0,0,0.6)"})`}}>
                        {title}
                      </div>
                      <div className="h-1 w-24 opacity-50 rounded-full" style={{ backgroundImage: `linear-gradient(to right, transparent, ${colors[exportAccent].hex || exportTheme === "dark" ? "white" : "black"}, transparent)` }} />
                    </div>
                  )}
                </div>
              ) : null}
              <div
                className="relative shrink-0"
                style={{ width: config.width, height: config.height }}
              >
                {/* SVG Connections for Export */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
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
                            : "absolute",
                          "pointer-events-none"
                        )
                      }
                    >
                      {renderNode(node, true)}
                    </div>
                  );
                })}
              </div>
            </div>
        </div>
        </ExportSettingsContext.Provider>
        </ExportContext.Provider>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
            {isExporting && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest px-1">
              外观设置
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setExportTheme("light")}
                className={`flex-1 py-2 text-sm font-bold rounded border transition-colors ${exportTheme === "light" ? "bg-blue-600/20 text-blue-400 border-blue-500/30" : "bg-black/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-800"}`}
              >
                浅色
              </button>
              <button
                onClick={() => setExportTheme("dark")}
                className={`flex-1 py-2 text-sm font-bold rounded border transition-colors ${exportTheme === "dark" ? "bg-blue-600/20 text-blue-400 border-blue-500/30" : "bg-black/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-800"}`}
              >
                深色
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest px-1">
              背景风格
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: "aurora", label: "极光" },
                { id: "grid", label: "网格" },
                { id: "gradient", label: "渐变" },
                { id: "solid", label: "纯色" }
              ].map(bg => (
                <button
                  key={bg.id}
                  onClick={() => setExportBackground(bg.id as any)}
                  className={`flex-1 min-w-[70px] py-2 text-sm font-bold rounded border transition-colors ${exportBackground === bg.id ? "bg-blue-600/20 text-blue-400 border-blue-500/30" : "bg-black/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-800"}`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest px-1">
              强调色
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: "blue", label: "蓝色", color: "bg-blue-500" },
                { id: "emerald", label: "翠绿", color: "bg-emerald-500" },
                { id: "purple", label: "紫色", color: "bg-purple-500" },
                { id: "rose", label: "玫瑰", color: "bg-rose-500" },
                { id: "orange", label: "橙色", color: "bg-orange-500" },
              ].map(accent => (
                <button
                  key={accent.id}
                  onClick={() => setExportAccent(accent.id as any)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1.5 min-w-[60px] py-2 text-xs font-bold rounded border transition-colors ${exportAccent === accent.id ? "bg-blue-600/20 text-blue-400 border-blue-500/30" : "bg-black/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-800"}`}
                >
                  <div className={`w-3 h-3 rounded-full ${accent.color}`} />
                  {accent.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest px-1">
              内容显示
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setExportShowIcon(!exportShowIcon)}
                className={`flex-1 py-2 text-sm font-bold rounded border transition-colors flex items-center justify-center gap-2 ${exportShowIcon ? "bg-blue-600/20 text-blue-400 border-blue-500/30" : "bg-black/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-800"}`}
              >
                赛事图标
              </button>
              <button
                onClick={() => setExportShowName(!exportShowName)}
                className={`flex-1 py-2 text-sm font-bold rounded border transition-colors flex items-center justify-center gap-2 ${exportShowName ? "bg-blue-600/20 text-blue-400 border-blue-500/30" : "bg-black/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-800"}`}
              >
                赛事名称
              </button>
              <button
                onClick={() => setExportUseShortName(!exportUseShortName)}
                className={`flex-1 py-2 text-sm font-bold rounded border transition-colors flex items-center justify-center gap-2 ${exportUseShortName ? "bg-blue-600/20 text-blue-400 border-blue-500/30" : "bg-black/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-800"}`}
              >
                {exportUseShortName ? "队伍简称" : "队伍全名"}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2">
            <button
              onClick={() => runExport()}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 h-12 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl font-medium transition-all active:scale-[0.98]"
            >
              {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <DownloadCloud className="w-5 h-5 hidden" />}
              生成预览图
            </button>
            <button
              onClick={handleDownload}
              disabled={!previewBlobUrl}
              className="flex-1 flex items-center justify-center gap-2 h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl font-medium transition-all active:scale-[0.98]"
            >
              <DownloadCloud className="w-5 h-5" />
              下载图片
            </button>
            <button
              onClick={handleCopy}
              disabled={!previewBlobUrl}
              className="flex-1 flex items-center justify-center gap-2 h-12 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:pointer-events-none text-zinc-900 dark:text-zinc-100 rounded-xl font-medium transition-all active:scale-[0.98]"
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
