"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Task, Commit } from "@/types/common";

interface NeuralLinkOverlayProps {
  tasks: Task[];
  activeTeamId: string;
  isWiring: string | null; // Task ID currently being wired
  hoveredTaskId: string | null;
  mousePos: { x: number, y: number };
}

export function NeuralLinkOverlay({ tasks, activeTeamId, isWiring, hoveredTaskId, mousePos }: NeuralLinkOverlayProps) {
  const [links, setLinks] = useState<{ x1: number, y1: number, x2: number, y2: number, id: string, active: boolean, highlighted: boolean }[]>([]);

  const updateLinks = useCallback(() => {
    const newLinks: any[] = [];

    tasks.forEach(task => {
      // 1. Existing Links (from DB)
      if (task.commit_sha) {
        const taskEl = document.getElementById(`task-port-${task.id}`);
        const commitEl = document.getElementById(`commit-${task.commit_sha}`);

        if (taskEl && commitEl) {
          const tRect = taskEl.getBoundingClientRect();
          const cRect = commitEl.getBoundingClientRect();

          newLinks.push({
            id: `link-${task.id}`,
            x1: tRect.left + tRect.width / 2,
            y1: tRect.top + tRect.height / 2,
            x2: cRect.right,
            y2: cRect.top + cRect.height / 2,
            active: false,
            highlighted: hoveredTaskId === task.id
          });
        }
      }

      // 2. Active Dragging Link
      if (isWiring === task.id) {
        const taskEl = document.getElementById(`task-port-${task.id}`);
        if (taskEl) {
          const tRect = taskEl.getBoundingClientRect();
          newLinks.push({
            id: `wiring-${task.id}`,
            x1: tRect.left + tRect.width / 2,
            y1: tRect.top + tRect.height / 2,
            x2: mousePos.x,
            y2: mousePos.y,
            active: true,
            highlighted: true
          });
        }
      }
    });

    setLinks(newLinks);
  }, [tasks, isWiring, hoveredTaskId, mousePos]);

  useEffect(() => {
    const interval = setInterval(updateLinks, 16); // 60fps update for smooth movement
    window.addEventListener('resize', updateLinks);
    window.addEventListener('scroll', updateLinks, true);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateLinks);
      window.removeEventListener('scroll', updateLinks, true);
    };
  }, [updateLinks]);

  return (
    <svg className="fixed inset-0 pointer-events-none z-[100] w-full h-full">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {links.map(link => (
        <g key={link.id}>
          {/* Background Glow Line */}
          <motion.path
            d={`M ${link.x1} ${link.y1} C ${link.x1 + 100} ${link.y1}, ${link.x2 - 100} ${link.y2}, ${link.x2} ${link.y2}`}
            stroke={link.active || link.highlighted ? "#4edea3" : "white"}
            strokeWidth={link.active || link.highlighted ? 3 : 1}
            strokeOpacity={link.active || link.highlighted ? 0.3 : 0.05}
            fill="none"
          />
          {/* Main Path */}
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            d={`M ${link.x1} ${link.y1} C ${link.x1 + 100} ${link.y1}, ${link.x2 - 100} ${link.y2}, ${link.x2} ${link.y2}`}
            stroke={link.active || link.highlighted ? "#4edea3" : "white"}
            strokeWidth={link.active || link.highlighted ? 2 : 0.5}
            strokeOpacity={link.active || link.highlighted ? 0.9 : 0.2}
            fill="none"
            filter="url(#glow)"
          />
          {/* Moving Pulse Dot for Active Links */}
          {link.active && (
            <motion.circle
              r="2"
              fill="#4edea3"
              animate={{
                offsetDistance: ["0%", "100%"]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{ offsetPath: `path("M ${link.x1} ${link.y1} C ${link.x1 + 100} ${link.y1}, ${link.x2 - 100} ${link.y2}, ${link.x2} ${link.y2}")` }}
            />
          )}
        </g>
      ))}
    </svg>
  );
}
