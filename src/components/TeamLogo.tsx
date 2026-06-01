import React, { useState, useContext } from 'react';
import { Team } from '../types';
import { cn } from '../lib/utils';
import { ExportContext } from '../lib/ExportContext';

export const TeamLogo = ({ team, fallbackClasses = "" }: { team: Team, fallbackClasses?: string }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const isExport = useContext(ExportContext);

  if (!team.logo || imgFailed) {
    return (
      <div 
        className={cn("flex flex-col items-center justify-center font-bold tracking-tighter w-full h-full text-center overflow-hidden rounded-[2px]", fallbackClasses)}
        style={{ backgroundColor: team.color, color: team.textColor }}
      >
        <span className="leading-tight px-0.5 break-all max-w-full text-inherit">{team.shortName}</span>
      </div>
    );
  }

  // Force proxy for export to bypass CORS restrictions in html2canvas
  const imgSrc = (useProxy || isExport) ? `https://wsrv.nl/?url=${encodeURIComponent(team.logo)}` : team.logo;

  return (
    <img 
      src={imgSrc} 
      alt={team.name} 
      crossOrigin="anonymous"
      referrerPolicy="no-referrer" 
      className="max-w-full max-h-full object-contain filter p-[2px]" 
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

