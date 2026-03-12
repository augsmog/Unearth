"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutGrid, User } from "lucide-react";

interface MobileNavProps {
  isAnonymous?: boolean;
}

const navItems = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/boards", label: "Boards", icon: LayoutGrid },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav({ isAnonymous }: MobileNavProps) {
  const pathname = usePathname();

  // Anonymous users see Discover + Sign Up
  const visibleItems = isAnonymous
    ? navItems.filter((item) => item.href === "/discover")
    : navItems;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2 px-4"
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      {visibleItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 py-1 px-3"
          >
            <Icon size={20} style={{ color: active ? "var(--accent-primary)" : "var(--text-muted)" }} />
            <span
              className="text-[10px] font-medium"
              style={{ color: active ? "var(--accent-primary)" : "var(--text-muted)" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
      {isAnonymous && (
        <Link
          href="/signup"
          className="flex flex-col items-center gap-0.5 py-1 px-3"
        >
          <User size={20} style={{ color: "var(--accent-primary)" }} />
          <span
            className="text-[10px] font-medium"
            style={{ color: "var(--accent-primary)" }}
          >
            Sign Up
          </span>
        </Link>
      )}
    </nav>
  );
}
