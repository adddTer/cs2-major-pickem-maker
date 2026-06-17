import React, { useState, useContext } from "react";
import { Team } from "../types";
import { cn } from "../lib/utils";
import { ExportContext } from "../lib/ExportContext";

export const TeamLogo = ({
  team,
  fallbackClasses = "",
  className
}: {
  team: Team;
  fallbackClasses?: string;
  className?: string;
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const isExport = useContext(ExportContext);

  if (!team.logo || imgFailed) {
    if (team.id === "tbd") {
      return (
        <div
          className={cn(
            "flex items-center justify-center w-full h-full text-center overflow-hidden rounded-[2px] bg-transparent text-zinc-500 dark:text-zinc-500 font-bold text-lg",
            fallbackClasses, className
          )}
        >
          ?
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center font-bold tracking-tighter w-full h-full text-center overflow-hidden rounded-[2px]",
          fallbackClasses, className
        )}
        style={{ backgroundColor: team.color, color: team.textColor }}
      >
        <span className="leading-tight px-0.5 break-all max-w-full text-inherit">
          {team.shortName}
        </span>
      </div>
    );
  }

  // Force proxy for export to bypass CORS restrictions in html-to-image
  const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(team.logo)}`;
  const forceProxy = useProxy || !!isExport;
  const imgSrc = forceProxy ? proxyUrl : team.logo;

  return (
    <img
      src={imgSrc}
      alt={team.name}
      {...(forceProxy ? { crossOrigin: "anonymous" } : {})}
      referrerPolicy="no-referrer"
      className={cn("max-w-full max-h-full object-contain filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] dark:drop-shadow-none transition-all", !forceProxy && "p-[2px]", className)}
      onError={() => {
        if (!useProxy) {
          setUseProxy(true);
        } else {
          setImgFailed(true);
        }
      }}
    />
  );
};
