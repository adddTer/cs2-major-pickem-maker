import React, { useState } from 'react';
import { Team } from '../types';
import { cn } from '../lib/utils';

export const TeamLogo = ({ team, fallbackClasses = "" }: { team: Team, fallbackClasses?: string }) => {
  const [imgFailed, setImgFailed] = useState(false);
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
  return <img src={team.logo} alt={team.name} referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain filter p-[2px]" onError={() => setImgFailed(true)} />;
};
