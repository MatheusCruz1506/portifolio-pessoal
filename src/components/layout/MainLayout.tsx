import { Outlet } from "react-router-dom";
import SideBar from "./SideBar";
import useSupabaseStore from "../../store/useSupabaseStore";
import { useEffect } from "react";
import TopBar from "./TopBar";

export default function MainLayout() {
  const { fetchUnits, user } = useSupabaseStore();

  useEffect(() => {
    void fetchUnits();
  }, [fetchUnits, user?.id, user?.user_metadata?.province]);

  return (
    <div className="flex h-screen w-full min-w-0 flex-col bg-background transition-colors duration-300">
      <TopBar />
      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <SideBar />
        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto md:ml-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
