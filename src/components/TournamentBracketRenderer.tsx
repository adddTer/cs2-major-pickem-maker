import React, { ReactNode } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { BracketConfig, BracketNode, BracketEdge } from "../data/bracketConfigs";

export const TournamentBracketRenderer: React.FC<{
  config: BracketConfig;
  initialScale?: number;
  renderNode: (node: BracketNode) => ReactNode;
  svgDefs?: ReactNode;
}> = ({ config, initialScale = 1, renderNode, svgDefs }) => {
  const nodeDict = Object.fromEntries(config.nodes.map(n => [n.id, n]));

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
                <span>复位居中</span>
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
    </div>
  );
};
