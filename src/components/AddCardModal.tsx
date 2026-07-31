"use client";

import type { Card, Tag, TagDefinition } from "@/types/card";
import { getSupabase } from "@/lib/supabase";
import { X, Tag as TagIcon, Plus, Check } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export type CardFormData = {
  title: string;
  content: string;
  url: string;
  tags: Tag[];
};

const TAG_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
  "#22C55E", "#10B981", "#14B8A6", "#06B6D4", "#3B82F6",
  "#6366F1", "#8B5CF6", "#A855F7", "#D946EF", "#EC4899",
  "#F43F5E", "#64748B", "#0EA5E9",
];

type AddCardModalProps = {
  open: boolean;
  card?: Card | null;
  onClose: () => void;
  onSave: (data: CardFormData, cardId?: string) => Promise<void>;
};

export default function AddCardModal({ open, card, onClose, onSave }: AddCardModalProps) {
  const isEditing = Boolean(card);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [availableTags, setAvailableTags] = useState<TagDefinition[]>([]);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState(TAG_COLORS[10]);
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setContent("");
      setUrl("");
      setTags([]);
      setAvailableTags([]);
      setTagName("");
      setTagColor(TAG_COLORS[10]);
      setShowNewTagForm(false);
      setError(null);
      setSaving(false);
      return;
    }
    if (card) {
      setTitle(card.title);
      setContent(card.content ?? "");
      setUrl(card.url ?? "");
      setTags(card.tags ?? []);
    } else {
      setTitle("");
      setContent("");
      setUrl("");
      setTags([]);
    }
    setTagName("");
    setTagColor(TAG_COLORS[10]);
    setShowNewTagForm(false);
    setError(null);
    fetchTags();
  }, [open, card]);

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
    const { data, error: fetchError } = await getSupabase()
      .from("tags")
      .select("*")
      .order("name", { ascending: true });

    if (!fetchError) {
      setAvailableTags(data ?? []);
    }
  }

  function isTagSelected(tagDef: TagDefinition): boolean {
    return tags.some((t) => t.name === tagDef.name);
  }

  function toggleTag(tagDef: TagDefinition) {
    if (isTagSelected(tagDef)) {
      setTags((prev) => prev.filter((t) => t.name !== tagDef.name));
    } else {
      setTags((prev) => [...prev, { name: tagDef.name, color: tagDef.color }]);
    }
  }

  function removeTag(index: number) {
    setTags((prev) => prev.filter((_, i) => i !== index));
  }

  async function addNewTag() {
    const trimmed = tagName.trim();
    if (!trimmed) return;
    if (availableTags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("标签已存在");
      return;
    }

    // Insert into Supabase tags table
    const { data: inserted, error: insertError } = await getSupabase()
      .from("tags")
      .insert({ name: trimmed, color: tagColor })
      .select();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (inserted && inserted.length > 0) {
      setAvailableTags((prev) => [...prev, inserted[0]]);
      setTags((prev) => [...prev, { name: inserted[0].name, color: inserted[0].color }]);
    }

    setTagName("");
    setTagColor(TAG_COLORS[10]);
    setShowNewTagForm(false);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("标题不能为空");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(
        {
          title: title.trim(),
          content: content.trim(),
          url: url.trim(),
          tags,
        },
        card?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-label="关闭弹窗"
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/60 bg-white/95 p-6 shadow-2xl shadow-slate-900/10 animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="card-modal-title" className="text-xl font-semibold text-slate-900">
            {isEditing ? "编辑灵感卡片" : "新增灵感卡片"}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="card-title" className="mb-1.5 block text-sm font-medium text-slate-700">
              标题 <span className="text-rose-500">*</span>
            </label>
            <input
              id="card-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给灵感起个名字"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="card-content" className="mb-1.5 block text-sm font-medium text-slate-700">
              内容
            </label>
            <textarea
              id="card-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="记录你的想法、笔记或灵感..."
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
            />
          </div>

          <div>
            <label htmlFor="card-url" className="mb-1.5 block text-sm font-medium text-slate-700">
              链接
            </label>
            <input
              id="card-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => {
                if (url && !/^https?:\/\//i.test(url.trim())) {
                  setUrl(`https://${url.trim()}`);
                }
              }}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
            />
          </div>

          {/* Tags Section */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">标签</label>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              {/* Selected tags */}
              {tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {tags.map((tag, index) => (
                    <span
                      key={`${tag.name}-${index}`}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${tag.color}15`,
                        color: tag.color,
                        border: `1px solid ${tag.color}40`,
                      }}
                    >
                      {tag.name}
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => removeTag(index)}
                        className="ml-0.5 rounded-full hover:opacity-70"
                        aria-label={`移除标签 ${tag.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Available tags from DB */}
              {availableTags.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 text-xs font-medium text-slate-400">从已有标签中选择</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((tagDef) => {
                      const selected = isTagSelected(tagDef);
                      return (
                        <button
                          key={tagDef.id}
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => toggleTag(tagDef)}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition"
                          style={{
                            backgroundColor: selected ? `${tagDef.color}20` : `${tagDef.color}10`,
                            color: selected ? tagDef.color : `${tagDef.color}80`,
                            border: `1px solid ${selected ? tagDef.color : `${tagDef.color}30`}`,
                          }}
                        >
                          {selected && <Check className="h-3 w-3" />}
                          {tagDef.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add new tag */}
              {showNewTagForm ? (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium text-slate-400">创建新标签</p>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <TagIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addNewTag();
                          }
                          if (e.key === "Escape") {
                            setShowNewTagForm(false);
                          }
                        }}
                        placeholder="新标签名称"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                        autoFocus
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="color"
                        value={tagColor}
                        onChange={(e) => setTagColor(e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
                        aria-label="选择颜色"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addNewTag}
                      disabled={!tagName.trim()}
                      className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      添加
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewTagForm(false);
                        setTagName("");
                        setTagColor(TAG_COLORS[10]);
                      }}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100"
                      aria-label="取消"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TAG_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setTagColor(c)}
                        className="h-6 w-6 rounded-full ring-offset-1 transition"
                        style={{
                          backgroundColor: c,
                          boxShadow: tagColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
                        }}
                        aria-label={`选择颜色 ${c}`}
                      />
                    ))}
                    <input
                      type="color"
                      value={tagColor}
                      onChange={(e) => setTagColor(e.target.value)}
                      className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                      onPointerDown={(e) => e.stopPropagation()}
                      aria-label="自定义颜色"
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    setShowNewTagForm(true);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 transition hover:text-violet-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  创建新标签
                </button>
              )}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "保存中..." : isEditing ? "更新" : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}