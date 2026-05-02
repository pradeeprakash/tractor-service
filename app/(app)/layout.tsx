import { redirect } from "next/navigation";
import { BottomNav } from "@/components/shell/BottomNav";
import { DesktopSidebar } from "@/components/shell/DesktopSidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh">
      <DesktopSidebar />
      <main className="md:pl-64 pb-28 md:pb-0">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
