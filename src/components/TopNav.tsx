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
  const eventMenuRef = useRef<HTMLDivElement>(null);

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
    <div className="h-14 border-b border-black/5 dark:border-white/5 bg-zinc-100/40 dark:bg-zinc-900/40 backdrop-blur-md flex items-center px-2 sm:px-6 justify-between shrink-0 z-[300] relative">
      <div 
        ref={eventMenuRef}
        className="flex items-center gap-1.5 sm:gap-2 mr-4 min-w-max relative cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded transition-colors"
        onClick={() => setIsEventMenuOpen(!isEventMenuOpen)}
      >
        <img
          src={logoUrl}
          referrerPolicy="no-referrer"
          className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
          alt={currentEvent.name}
          onError={() => {
            if (!useProxy) setUseProxy(true);
          }}
        />
        <span className="text-[10px] sm:text-sm font-bold tracking-widest text-zinc-900 dark:text-zinc-100 hidden sm:block">
          {currentEvent.name}
        </span>
        <span className="text-[10px] sm:hidden font-bold tracking-widest text-zinc-900 dark:text-zinc-100">
          {currentEvent.shortName}
        </span>
        <ChevronDown className="w-3 h-3 text-zinc-500" />
        
        {isEventMenuOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-md shadow-lg py-1 z-50">
            {EVENTS.filter(e => !e.id.includes('test')).map(event => (
              <div 
                key={event.id}
                className={cn(
                  "px-3 py-2 text-[11px] sm:text-xs font-bold cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2",
                  currentEvent.id === event.id ? "text-blue-500" : "text-zinc-700 dark:text-zinc-300"
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
                  className="w-4 h-4 object-contain shrink-0" 
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

      <div className="overflow-x-auto custom-scrollbar min-w-0 flex-1 flex justify-start sm:justify-end">
        <div className="flex bg-zinc-200/40 dark:bg-black/40 p-0.5 sm:p-1 rounded-md border border-black/5 dark:border-white/5 shrink-0 w-max">
          <div
            onClick={() => setMainView("bracket")}
          className={cn(
            "px-3 sm:px-5 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 sm:gap-2",
            mainView === "bracket"
              ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:text-zinc-300",
          )}
        >
          <ListTree className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>对阵图</span>
        </div>
        <div
          onClick={() => setMainView("globalSim")}
          className={cn(
            "px-3 sm:px-5 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 sm:gap-2",
            mainView === "globalSim"
              ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:text-zinc-300",
          )}
        >
          <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>全局模拟</span>
        </div>
        <div
          onClick={() => setMainView("simulator")}
          className={cn(
            "px-3 sm:px-5 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 sm:gap-2",
            mainView === "simulator"
              ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:text-zinc-300",
          )}
        >
          <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>竞猜推演器</span>
        </div>
        <div
          onClick={() => setMainView("ranking")}
          className={cn(
            "px-3 sm:px-5 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 sm:gap-2",
            mainView === "ranking"
              ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:text-zinc-300",
          )}
        >
          <BarChart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>队伍排名</span>
        </div>
        <div
          onClick={() => setMainView("summary")}
          className={cn(
            "px-3 sm:px-5 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 sm:gap-2",
            mainView === "summary"
              ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:text-zinc-300",
          )}
        >
          <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>社区汇总</span>
        </div>
        <div
          onClick={() => setMainView("history")}
          className={cn(
            "px-3 sm:px-5 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 sm:gap-2",
            mainView === "history"
              ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:text-zinc-300",
          )}
        >
          <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Major</span>
        </div>
        <div
          onClick={() => handleRefresh(false)}
          className="px-2 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 sm:gap-2 text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:text-zinc-300 ml-1 border-l border-black/10 dark:border-white/10"
          title="刷新比赛数据"
        >
          <RefreshCw
            className={cn(
              "w-3 h-3 sm:w-3.5 sm:h-3.5",
              isRefreshing && "animate-spin",
            )}
          />
        </div>
        <div
          onClick={toggleTheme}
          className="px-2 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 sm:gap-2 text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:text-zinc-300 ml-1 border-l border-black/10 dark:border-white/10"
          title="切换主题"
        >
          {theme === "dark" ? (
            <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          ) : (
            <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          )}
        </div>
      </div>
      </div>
    </div>
  );
};
