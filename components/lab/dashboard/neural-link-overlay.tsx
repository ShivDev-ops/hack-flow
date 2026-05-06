"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, Commit } from "@/types/common";

interface NeuralLinkOverlayProps {
  tasks: Task[];
  activeTeamId: string;
  isWiring: string | null; // Commit SHA currently being wired
  hoveredTaskId: string | null;
  hoveredCommitSha: string | null;
  mousePos: { x: number, y: number };
}

export function NeuralLinkOverlay({ tasks, activeTeamId, isWiring, hoveredTaskId, hoveredCommitSha, mousePos }: NeuralLinkOverlayProps) {
  const [links, setLinks] = useState<{ x1: number, y1: number, x2: number, y2: number, id: string, active: boolean, highlighted: boolean }[]>([]);

  const updateLinks = useCallback(() => {
    const newLinks: any[] = [];

    tasks.forEach(task => {
      // 1. Existing Links (from DB)
      if (task.commit_sha) {
        const commitEl = document.getElementById(`commit-port-${task.commit_sha}`);
        const taskEl = document.getElementById(`task-port-${task.id}`);

        if (taskEl && commitEl) {
          const cRect = commitEl.getBoundingClientRect();
          const tRect = taskEl.getBoundingClientRect();

          const isVisible = hoveredTaskId === task.id || hoveredCommitSha === task.commit_sha;

          if (isVisible) {
            newLinks.push({
              id: `link-${task.id}`,
              x1: cRect.left + cRect.width / 2,
              y1: cRect.top + cRect.height / 2,
              x2: tRect.left + tRect.width / 2,
              y2: tRect.top + tRect.height / 2,
              active: false,
              highlighted: true
            });
          }
        }
      }
    });

    // 2. Active Dragging Link
    if (isWiring) {
      const commitEl = document.getElementById(`commit-port-${isWiring}`);
      if (commitEl) {
        const cRect = commitEl.getBoundingClientRect();
        newLinks.push({
          id: `wiring-${isWiring}`,
          x1: cRect.left + cRect.width / 2,
          y1: cRect.top + cRect.height / 2,
          x2: mousePos.x,
          y2: mousePos.y,
          active: true,
          highlighted: true
        });
      }
    }

    setLinks(newLinks);
  }, [tasks, isWiring, hoveredTaskId, hoveredCommitSha, mousePos]);

  useEffect(() => {
    const interval = setInterval(updateLinks, 16);
    window.addEventListener('resize', updateLinks);
    window.addEventListener('scroll', updateLinks, true);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateLinks);
      window.removeEventListener('scroll', updateLinks, true);
    };
  }, [updateLinks]);

  const getPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const adx = Math.abs(dx);
    const offset = Math.min(adx / 2, 250);
    
    // Smooth S-curve with horizontal exit/entry
    return `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`;
  };

  return (
    <svg className="fixed inset-0 pointer-events-none z-[100] w-full h-full">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.3 0 0 0 0 0.87 0 0 0 0 0.64 0 0 0 1 0" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4edea3" stopOpacity="0" />
          <stop offset="20%" stopColor="#4edea3" stopOpacity="1" />
          <stop offset="80%" stopColor="#4edea3" stopOpacity="1" />
          <stop offset="100%" stopColor="#4edea3" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      <AnimatePresence>
        {links.map(link => (
          <motion.g 
            key={link.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Outer Glow Path */}
            <motion.path
              d={getPath(link.x1, link.y1, link.x2, link.y2)}
              stroke="#4edea3"
              strokeWidth={link.active ? 6 : 3}
              strokeOpacity={0.1}
              fill="none"
              filter="url(#glow)"
            />
            
            {/* Core Silk Path */}
            <motion.path
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "circOut" }}
              d={getPath(link.x1, link.y1, link.x2, link.y2)}
              stroke="#4edea3"
              strokeWidth={1}
              strokeOpacity={0.6}
              fill="none"
            />

            {/* Neural Pulse Beam */}
            <motion.path
              d={getPath(link.x1, link.y1, link.x2, link.y2)}
              stroke="url(#linkGradient)"
              strokeWidth={2}
              fill="none"
              initial={{ strokeDasharray: "80, 200", strokeDashoffset: 280 }}
              animate={{ strokeDashoffset: -280 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            {/* Lead Particle */}
            {link.active && (
              <motion.circle
                r="2.5"
                fill="#4edea3"
                filter="url(#glow)"
                animate={{
                  offsetDistance: ["0%", "100%"]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ offsetPath: `path("${getPath(link.x1, link.y1, link.x2, link.y2)}")` }}
              />
            )}
          </motion.g>
        ))}
      </AnimatePresence>
    </svg>
  );
}
