import { adminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PublicBoardGrid } from "@/components/board/PublicBoardGrid";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: board } = await adminClient
    .from("boards")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!board) return { title: "Board not found" };

  return {
    title: `${board.name} — Unearth`,
    description: board.description ?? `A curated collection on Unearth`,
  };
}

export default async function PublicBoardPage({ params }: Props) {
  const { slug } = await params;

  const { data: board } = await adminClient
    .from("boards")
    .select(
      `
      *,
      profile:profiles!boards_user_id_fkey (display_name, avatar_url),
      board_items (
        id,
        position,
        site:sites (*)
      )
    `
    )
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (!board) notFound();

  const sites =
    board.board_items
      ?.sort(
        (a: { position: number }, b: { position: number }) =>
          a.position - b.position
      )
      .map((item: { site: unknown }) => item.site)
      .filter(Boolean) ?? [];

  const curator = board.profile as { display_name: string; avatar_url: string | null } | null;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Minimal nav */}
      <nav className="h-14 flex items-center justify-between px-6">
        <Link
          href="/"
          className="text-lg tracking-[0.25em] uppercase"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-rajdhani), sans-serif",
            fontWeight: 700,
          }}
        >
          unearthed
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "var(--accent-primary)", color: "white" }}
        >
          Join Unearth
        </Link>
      </nav>

      <div className="px-4 py-8 max-w-6xl mx-auto">
        {/* Board header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {board.name}
          </h1>
          {board.description && (
            <p
              className="text-sm mb-3"
              style={{ color: "var(--text-secondary)" }}
            >
              {board.description}
            </p>
          )}
          {curator && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Curated by {curator.display_name}
            </p>
          )}
        </div>

        {/* Sites grid — opens in embedded viewer */}
        <PublicBoardGrid sites={sites} />
      </div>

      {/* Signup CTA banner */}
      <div
        className="fixed bottom-0 left-0 right-0 py-4 px-6 flex items-center justify-between"
        style={{
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Like what you see? Start your own collection.
        </p>
        <Link
          href="/signup"
          className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap"
          style={{ background: "var(--accent-primary)", color: "white" }}
        >
          Join Unearth
        </Link>
      </div>
    </div>
  );
}
