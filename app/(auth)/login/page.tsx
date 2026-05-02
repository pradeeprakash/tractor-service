import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";
import { Tractor } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(params.redirect ?? "/");

  const { t } = await getServerT();

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 py-10 bg-bg">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-ink flex items-center justify-center mb-3">
            <Tractor className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-semibold">{t("nav.brand")}</h1>
          <p className="text-sm text-ink-muted">{t("auth.tagline")}</p>
        </div>
        <LoginForm redirectTo={params.redirect ?? "/"} />
      </div>
    </main>
  );
}
