import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-screen pb-24 md:pb-0 overflow-hidden">
        {children}
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
