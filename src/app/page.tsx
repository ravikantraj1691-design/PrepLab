import { getSessionUser } from "@/lib/auth";
import { LoginScreen } from "@/components/login-screen";
import { AppShellClientOnly } from "@/components/app-shell-client";
import type { AppUser } from "@/components/app-shell";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) return <LoginScreen />;
  const appUser: AppUser = { id: user.id, email: user.email, role: user.role, expertEmail: user.expertEmail };
  return <AppShellClientOnly user={appUser} />;
}
