import { Sidebar } from "@/components/dashboard/sidebar";
import { Navbar } from "@/components/dashboard/navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 flex">
      {/* Sidebar - Fixed width, border-right for that tech-separation */}
      <aside className="w-64 border-r border-white/5 bg-zinc-950/50 hidden md:block sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}