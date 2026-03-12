"use client";

import { motion } from "motion/react";
import { Plus, Lock, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface BoardWithMeta {
  id: string;
  name: string;
  slug: string;
  is_public: boolean;
  itemCount: number;
  thumbnails: string[];
}

interface BoardGridProps {
  boards: BoardWithMeta[];
}

export function BoardGrid({ boards }: BoardGridProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    const slug = newBoardName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("boards").insert({
      user_id: user.id,
      name: newBoardName,
      slug,
      position: boards.length,
    });

    setNewBoardName("");
    setShowCreateModal(false);
    router.refresh();
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {boards.map((board, index) => (
          <motion.div
            key={board.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={`/boards/${board.slug}`}>
              <div
                className="rounded-xl overflow-hidden transition-transform hover:scale-[1.02]"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {/* Thumbnail mosaic */}
                <div className="aspect-square grid grid-cols-2 gap-0.5 p-0.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="relative overflow-hidden"
                      style={{ background: "var(--bg-surface)" }}
                    >
                      {board.thumbnails[i] ? (
                        <Image
                          src={board.thumbnails[i]}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 25vw, 15vw"
                        />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {board.name}
                    </h3>
                    {board.is_public ? (
                      <Globe size={14} style={{ color: "var(--text-muted)" }} />
                    ) : (
                      <Lock size={14} style={{ color: "var(--text-muted)" }} />
                    )}
                  </div>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {board.itemCount} {board.itemCount === 1 ? "site" : "sites"}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {/* Create New Board card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: boards.length * 0.05 }}
          onClick={() => setShowCreateModal(true)}
          className="rounded-xl aspect-[4/5] flex flex-col items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
          style={{
            background: "var(--bg-elevated)",
            border: "2px dashed var(--border-subtle)",
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "var(--bg-surface)" }}
          >
            <Plus size={24} style={{ color: "var(--text-muted)" }} />
          </div>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            New Board
          </span>
        </motion.button>
      </div>

      {/* Create board modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6"
            style={{ background: "var(--bg-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Create Board
            </h2>
            <input
              type="text"
              placeholder="Board name"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
              autoFocus
              className="w-full h-12 px-4 rounded-xl text-sm outline-none mb-4"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 h-10 rounded-xl text-sm"
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBoard}
                className="flex-1 h-10 rounded-xl text-sm font-semibold"
                style={{
                  background: "var(--accent-primary)",
                  color: "white",
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
