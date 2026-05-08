import { LeftSidebar } from "@/components/left-sidebar";
import { RightSidebar } from "@/components/right-sidebar";
import { TopNavbar } from "@/components/top-navbar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SidebarProvider } from "@/lib/sidebar-store";
import { GlobalCallHandler } from "@/components/global-call-handler";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
        <LeftSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto p-2 md:p-4 pb-28 md:pb-4">{children}</main>
        </div>
        <RightSidebar />
        <MobileBottomNav />
        <GlobalCallHandler />
      </div>
    </SidebarProvider>
  );
}
