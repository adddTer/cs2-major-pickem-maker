import React, { useState } from 'react';
import { Team } from '../types';
import { cn } from '../lib/utils';

export const TeamLogo = ({ team, fallbackClasses = "" }: { team: Team, fallbackClasses?: string }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

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

  const imgSrc = useProxy ? `https://wsrv.nl/?url=${encodeURIComponent(team.logo)}` : team.logo;

  return (
    <img 
      src={imgSrc} 
      alt={team.name} 
      referrerPolicy="no-referrer" 
      className="max-w-full max-h-full object-contain filter p-[2px]" 
      onError={() => {
        if (!useProxy && team.logo.includes('hltv.org')) {
          setUseProxy(true);
        } else {
          setImgFailed(true);
        }
      }} 
    />
  );
};

