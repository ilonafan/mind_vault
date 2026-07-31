"use client";

import type { TagDefinition } from "@/types/card";
import { getSupabase } from "@/lib/supabase";
import { Pencil, Plus, Tag as TagIcon, X, Check, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const TAG_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
  "#22C55E", "#10B981", "#14B8A6", "#06B6D4", "#3B82F6",
  "#6366F1", "#8B5CF6", "#A855F7", "#D946EF", "#EC4899",
  "#F43F5E", "#64748B", "#0EA5E9",
];

type TagManagerModalProps = {
  open: boolean;
  onClose: () => void;
  onTagsChanged: () => void;
};

export default function TagManagerModal({ open, onClose, onTagsChanged }: TagManagerModalProps) {
  const [tags, setTags] = useState<TagDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New tag creation
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[10]);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setNewName("");
      setNewColor(TAG_COLORS[10]);
      setEditingId(null);
      setDeletingId(null);
      setError(null);
      return;
    }
    fetchTags();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  async function fetchTags() {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await getSupabase()
      .from("tags")
      .select("*")
      .order("name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setTags(data ?? []);
    }
    setLoading(false);
  }

  async function handleAddTag() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("标签已存在");
      return;
    }

    setSaving(true);
    setError(null);
    const { error: insertError } = await getSupabase()
      .from("tags")
      .insert({ name: trimmed, color: newColor });

    if (insertError) {
      setError(insertError.message);
    } else {
      setNewName("");
      setNewColor(TAG_COLORS[10]);
      await fetchTags();
      onTagsChanged();
    }
    setSaving(false);
  }

  function startEdit(tag: TagDefinition) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
    setDeletingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) return;

    const tag = tags.find((t) => t.id === editingId);
    if (!tag) return;

    // Check if name conflicts with another tag
    const conflict = tags.some(
      (t) => t.id !== editingId && t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (conflict) {
      setError("标签名称已存在");
      return;
    }

    const oldName = tag.name;
    setSaving(true);
    setError(null);

    // Update the tag definition
    const { error: updateError } = await getSupabase()
      .from("tags")
      .update({ name: trimmed, color: editColor })
      .eq("id", editingId);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    // If the name or color changed, update all cards that reference this tag
    if (oldName !== trimmed || tag.color !== editColor) {
      // Fetch all cards that have this tag
      const { data: affectedCards, error: fetchError } = await getSupabase()
        .from("cards")
        .select("id, tags")
        .contains("tags", JSON.stringify([{ name: oldName }]));

      if (fetchError) {
        setError(fetchError.message);
        setSaving(false);
        return;
      }

      if (affectedCards && affectedCards.length > 0) {
        const updates = affectedCards.map((card) => {
          const currentTags = (card.tags as { name: string; color: string }[]) ?? [];
          const updatedTags = currentTags.map((t) =>
            t.name === oldName ? { name: trimmed, color: editColor } : t
          );
          return getSupabase()
            .from("cards")
            .update({ tags: updatedTags })
            .eq("id", card.id);
        });

        const results = await Promise.all(updates);
        const updateError2 = results.find((r) => r.error)?.error;
        if (updateError2) {
          setError(updateError2.message);
          setSaving(false);
          return;
        }
      }
    }

    setEditingId(null);
    setSaving(false);
    await fetchTags();
    onTagsChanged();
  }

  async function handleDeleteTag(tagId: string) {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;

    setDeleting(true);
    setError(null);

    // Remove the tag from all cards
    const { data: affectedCards, error: fetchError } = await getSupabase()
      .from("cards")
      .select("id, tags")
      .contains("tags", JSON.stringify([{ name: tag.name }]));

    if (fetchError) {
      setError(fetchError.message);
      setDeleting(false);
      return;
    }

    if (affectedCards && affectedCards.length > 0) {
      const updates = affectedCards.map((card) => {
        const currentTags = (card.tags as { name: string; color: string }[]) ?? [];
        const updatedTags = currentTags.filter((t) => t.name !== tag.name);
        return getSupabase()
          .from("cards")
          .update({ tags: updatedTags.length > 0 ? updatedTags : null })
          .eq("id", card.id);
      });

      const results = await Promise.all(updates);
      const updateError = results.find((r) => r.error)?.error;
      if (updateError) {
        setError(updateError.message);
        setDeleting(false);
        return;
      }
    }

    // Delete the tag definition
    const { error: deleteError } = await getSupabase()
      .from("tags")
      .delete()
      .eq("id", tagId);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setDeletingId(null);
      await fetchTags();
      onTagsChanged();
    }
    setDeleting(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tag-manager-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="关闭弹窗"
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/60 bg-white/95 p-6 shadow-2xl shadow-slate-900/10 animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="tag-manager-title" className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <TagIcon className="h-5 w-5" />
            标签管理
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Add new tag */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-700">添加新标签</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="标签名称"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
              />
              <div className="relative">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  aria-label="选择颜色"
                />
              </div>
              <button
                type="button"
                onClick={handleAddTag}
                disabled={saving || !newName.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                添加
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
        )}

        {/* Tag list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
          </div>
        ) : tags.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            暂无标签，请在上方添加
          </div>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 transition hover:border-slate-200"
              >
                {editingId === tag.id ? (
                  /* Edit mode */
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveEdit();
                        }
                        if (e.key === "Escape") {
                          cancelEdit();
                        }
                      }}
                      className="flex-1 rounded-lg border border-violet-200 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                      autoFocus
                    />
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                      aria-label="选择颜色"
                    />
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50"
                      aria-label="保存"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100"
                      aria-label="取消"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : deletingId === tag.id ? (
                  /* Delete confirmation */
                  <>
                    <div className="flex flex-1 items-center gap-2">
                      <span
                        className="inline-block h-5 w-5 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium text-slate-900">{tag.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">确定删除？</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag.id)}
                      disabled={deleting}
                      className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-rose-700 disabled:opacity-60"
                    >
                      {deleting ? "删除中..." : "确认"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(null)}
                      disabled={deleting}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  /* Display mode */
                  <>
                    <div className="flex flex-1 items-center gap-2">
                      <span
                        className="inline-block h-5 w-5 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium text-slate-900">{tag.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(tag)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label={`编辑 ${tag.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(tag.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                      aria-label={`删除 ${tag.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}