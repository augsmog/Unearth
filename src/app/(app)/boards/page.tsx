import { createServerSupabase } from "@/lib/supabase/server";
import { BoardGrid } from "@/components/board/BoardGrid";

export default async function BoardsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: boards } = await supabase
    .from("boards")
    .select(
      `
      *,
      board_items (
        id,
        site:sites (
          id,
          thumbnail_url,
          title
        )
      )
    `
    )
    .eq("user_id", user!.id)
    .order("position");

  const boardsWithCounts =
    boards?.map((board) => ({
      ...board,
      itemCount: board.board_items?.length ?? 0,
      thumbnails: (board.board_items ?? [])
        .slice(0, 4)
        .map((item: { site: { thumbnail_url: string } }) => item.site?.thumbnail_url)
        .filter(Boolean),
    })) ?? [];

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      <h1
        className="text-2xl md:text-3xl font-bold mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        My Boards
      </h1>
      <BoardGrid boards={boardsWithCounts} />
    </div>
  );
}
