// components/layout/dashboard-shell.tsx
"use client";

import { useState } from "react";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";
import { Session } from "next-auth";

interface ShellProps {
  children: React.ReactNode;
  session: Session;
  role: "organiser" | "participant";
}

export function DashboardShell({ children, session, role }: ShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bg-[#0A0A0B] min-h-screen">
      <Navbar 
        session={session} 
        onMenuClick={() => setIsSidebarOpen(true)} 
      />
      
      <div className="max-w-7xl mx-auto flex">
        <Sidebar 
          role={role} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
        
        {/* Adjusted padding to account for fixed sidebar on desktop */}
        <main className="flex-1 lg:pl-72 pt-24 pb-16 px-6 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}