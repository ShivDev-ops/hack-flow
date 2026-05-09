"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Navbar } from "@/components/dashboard/navbar";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Sidebar should be HIDDEN ONLY on the root /dashboard page
  const isRootDashboard = pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 flex">
      {/* Desktop Sidebar - Fixed width, hidden on mobile */}
      {!isRootDashboard && (
        <aside className="w-64 border-r border-white/5 bg-zinc-950/50 hidden md:block sticky top-0 h-screen">
          <Suspense fallback={<div className="w-full h-full bg-zinc-950/50 animate-pulse" />}>
            <Sidebar />
          </Suspense>
        </aside>
      )}

      {/* Mobile Drawer Sidebar */}
      {!isRootDashboard && (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] transition-opacity duration-300 md:hidden ${
                    isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setIsSidebarOpen(false)}
            />
            
            {/* Drawer */}
            <aside className={`fixed left-0 top-0 bottom-0 z-[160] w-72 transition-transform duration-300 ease-in-out md:hidden ${
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}>
                <Suspense fallback={<div className="w-full h-full bg-zinc-950 animate-pulse" />}>
                    <Sidebar onClose={() => setIsSidebarOpen(false)} />
                </Suspense>
            </aside>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
