"use client";

import { AppNav } from "./AppNav";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
  children: React.ReactNode;
  userName: string;
  avatarUrl: string | null;
  streak: number;
  isAnonymous?: boolean;
}

export function AppShell({ children, userName, avatarUrl, streak, isAnonymous }: AppShellProps) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <AppNav userName={userName} avatarUrl={avatarUrl} streak={streak} isAnonymous={isAnonymous} />
      <main className="pt-14 pb-20 md:pb-0">{children}</main>
      <MobileNav isAnonymous={isAnonymous} />
    </div>
  );
}
