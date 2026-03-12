import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BoardView } from "@/components/board/BoardView";

export default async function SingleBoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: board } = await supabase
    .from("boards")
    .select(
      `
      *,
      board_items (
        id,
        position,
        site:sites (*)
      )
    `
    )
    .eq("user_id", user!.id)
    .eq("slug", slug)
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

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      <BoardView board={board} sites={sites} />
    </div>
  );
}
