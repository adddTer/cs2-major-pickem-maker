import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { TEAMS, INITIAL_SLOTS } from "../data/teams";
import { PickSlot, Team, SlotType, PickSet } from "../types";
import { cn } from "../lib/utils";
import {
  Trophy,
  RefreshCw,
  Clock,
  Users,
  Edit3,
  CheckCircle2,
  Home,
  Plus,
  XCircle,
} from "lucide-react";
import { TeamLogo } from "../components/TeamLogo";

export const useFitScale = (
  intrinsicWidth: number,
  intrinsicHeight: number,
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const scaleX = width / intrinsicWidth;
        const scaleY = height / intrinsicHeight;
        let nextScale = Math.min(scaleX, scaleY) * 0.98;
        setScale(nextScale);
      }
    };

    const observer = new ResizeObserver(() => calculateScale());
    if (containerRef.current) {
      observer.observe(containerRef.current);
      calculateScale();
    }

    return () => observer.disconnect();
  }, [intrinsicWidth, intrinsicHeight]);

  return { containerRef, scale };
};
