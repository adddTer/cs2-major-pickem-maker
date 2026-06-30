import React, { useEffect, useState, useRef } from "react";
import {
  ListTree,
  Users,
  RefreshCw,
  Trophy,
  BarChart,
  Activity,
  Sun,
  Moon,
  ChevronDown
} from "lucide-react";
import { cn } from "../lib/utils";
import { EVENTS } from "../App";

interface TopNavProps {
  mainView: "bracket" | "summary" | "history" | "ranking" | "globalSim" | "simulator";
  setMainView: (
    mode: "bracket" | "summary" | "history" | "ranking" | "globalSim" | "simulator",
  ) => void;
  handleRefresh: () => void;
  isRefreshing: boolean;
  currentEventId: string;
  setCurrentEventId: (id: string) => void;
}

const navItems = [
  { id: "bracket", label: "赛程图", icon: ListTree },
  { id: "globalSim", label: "全局模拟", icon: Activity },
  { id: "simulator", label: "单局预测", icon: BarChart },
  { id: "ranking", label: "战队排名", icon: BarChart },
  { id: "summary", label: "社区预测", icon: Users },
  { id: "history", label: "历史赛事", icon: Trophy },
] as const;

export const TopNav: React.FC<TopNavProps> = ({
  mainView,
  setMainView,
  handleRefresh,
  isRefreshing,
  currentEventId,
  setCurrentEventId,
}) => {
  const [useProxy, setUseProxy] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isEventMenuOpen, setIsEventMenuOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const eventMenuRef = useRef<HTMLDivElement>(null);
  const navMenuRef = useRef<HTMLDivElement>(null);

  const filteredNavItems = navItems.filter(item => 
    (item.id !== "globalSim" && item.id !== "simulator") || currentEventId === "iem_cologne_2026"
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventMenuRef.current && !eventMenuRef.current.contains(event.target as Node)) {
        setIsEventMenuOpen(false);
      }
      if (navMenuRef.current && !navMenuRef.current.contains(event.target as Node)) {
        setIsNavMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  const currentEvent = EVENTS.find(e => e.id === currentEventId) || EVENTS[0];

  const logoUrl = useProxy
    ? `https://wsrv.nl/?url=${encodeURIComponent(currentEvent.logoUrl)}`
    : currentEvent.logoUrl;

  return (
    <div className="h-16 border-b border-white/5 bg-white/50 dark:bg-zinc-950/60 backdrop-blur-xl flex items-center px-4 sm:px-8 justify-between shrink-0 z-[300] relative">
      <div 
        ref={eventMenuRef}
        className="flex items-center gap-2 sm:gap-3 mr-2 sm:mr-4 min-w-0 relative cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 py-1.5 px-1 sm:px-2 rounded-lg transition-all duration-300"
        onClick={() => setIsEventMenuOpen(!isEventMenuOpen)}
      >
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center p-1 shadow-inner border border-white/10">
          <img
            src={logoUrl}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain shrink-0 drop-shadow-md"
            alt={currentEvent.name}
            onError={() => {
              if (!useProxy) setUseProxy(true);
            }}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[0.625rem] uppercase text-zinc-500 font-bold tracking-widest leading-none mb-1">
            赛事
          </span>
          <span className="text-[0.8125rem] sm:text-[15px] font-display font-semibold tracking-wide text-zinc-900 dark:text-zinc-100 leading-none truncate max-w-[100px] sm:max-w-[200px]">
            {currentEvent.name}
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-300 ml-1 sm:ml-2 shrink-0", isEventMenuOpen && "rotate-180")} />
        
        {isEventMenuOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
            {EVENTS.filter(e => !e.id.includes('test')).map(event => (
              <div 
                key={event.id}
                className={cn(
                  "px-4 py-3 text-[0.8125rem] font-display font-medium cursor-pointer transition-all flex items-center gap-3",
                  currentEvent.id === event.id 
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500" 
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-l-2 border-transparent"
                )}
                onClick={() => {
                  setCurrentEventId(event.id);
                  setUseProxy(false);
                  setIsEventMenuOpen(false);
                }}
              >
                <img 
                  src={useProxy ? `https://wsrv.nl/?url=${encodeURIComponent(event.logoUrl)}` : event.logoUrl} 
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 object-contain shrink-0" 
                  alt={event.name} 
                  onError={() => {
                    if (!useProxy) setUseProxy(true);
                  }}
                />
                {event.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex justify-end items-center min-w-0">
        {/* Mobile Dropdown Nav */}
        <div ref={navMenuRef} className="relative lg:hidden block mr-auto">
          <div 
            className="flex items-center gap-1.5 bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-700 p-2 px-2.5 rounded-xl border border-black/5 dark:border-white/5 cursor-pointer shadow-sm transition-all shrink-0 whitespace-nowrap"
            onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
          >
            {(() => {
              const currentItem = navItems.find(item => item.id === mainView) || navItems[0];
              const Icon = currentItem.icon;
              return (
                <>
                  <Icon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="text-[0.8125rem] font-medium text-zinc-800 dark:text-zinc-200">{currentItem.label}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform duration-300 shrink-0", isNavMenuOpen && "rotate-180")} />
                </>
              );
            })()}
          </div>

          {isNavMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-2xl py-2 z-50 overflow-hidden flex flex-col">
              {filteredNavItems.map(item => {
                const Icon = item.icon;
                const isActive = mainView === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setMainView(item.id as any);
                      setIsNavMenuOpen(false);
                    }}
                    className={cn(
                      "px-4 py-3 text-[0.875rem] font-medium cursor-pointer transition-all flex items-center gap-3",
                      isActive
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-2 border-blue-500"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-l-2 border-transparent"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Horizontal Nav */}
        <div className="hidden lg:flex items-center bg-zinc-200/50 dark:bg-black/30 p-1 rounded-xl border border-black/5 dark:border-white/5 shrink-0 w-max shadow-inner">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = mainView === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setMainView(item.id as any)}
                className={cn(
                  "px-4 py-2 text-xs font-medium rounded-lg cursor-pointer transition-all duration-300 flex items-center gap-2",
                  isActive
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-md ring-1 ring-black/5 dark:ring-white/10"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 ml-2 sm:ml-4 shrink-0">
          <div
            onClick={() => handleRefresh(false)}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 shadow-sm border border-black/5 dark:border-white/5 shrink-0"
            title="刷新数据"
          >
            <RefreshCw
              className={cn(
                "w-3.5 h-3.5 sm:w-4 sm:h-4",
                isRefreshing && "animate-spin text-blue-500",
              )}
            />
          </div>
          <div
            onClick={toggleTheme}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 shadow-sm border border-black/5 dark:border-white/5 shrink-0"
            title="切换主题"
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
