"use client";

import AddCardModal, { type CardFormData } from "@/components/AddCardModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { getSupabase } from "@/lib/supabase";
import type { Card } from "@/types/card";
import { ExternalLink, Lightbulb, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function normalizeTags(tags: Card["tags"]): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);
  return [];
}

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);

  const fetchCards = useCallback(async () => {
    setError(null);
    const { data, error: fetchError } = await getSupabase()
      .from("cards")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setCards(data ?? []);
  }, []);

  useEffect(() => {
    fetchCards().finally(() => setLoading(false));
  }, [fetchCards]);

  function openCreateModal() {
    setEditingCard(null);
    setModalOpen(true);
  }

  function openEditModal(card: Card) {
    setEditingCard(card);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCard(null);
  }

  async function handleSave(data: CardFormData, cardId?: string) {
    const payload = {
      title: data.title,
      content: data.content || null,
      url: data.url || null,
    };

    if (cardId) {
      const { data: updated, error: updateError } = await getSupabase()
        .from("cards")
        .update(payload)
        .eq("id", cardId)
        .select();

      if (updateError) throw new Error(updateError.message);
      if (!updated?.length) {
        throw new Error(
          "更新未生效：Supabase 拒绝了此操作。请在 SQL Editor 中执行 supabase/rls-policies.sql 添加 UPDATE 策略。"
        );
      }
    } else {
      const { data: inserted, error: insertError } = await getSupabase()
        .from("cards")
        .insert(payload)
        .select();

      if (insertError) throw new Error(insertError.message);
      if (!inserted?.length) {
        throw new Error(
          "新增未生效：Supabase 拒绝了此操作。请在 SQL Editor 中执行 supabase/rls-policies.sql 添加 INSERT 策略。"
        );
      }
    }
    await fetchCards();
  }

  async function handleDelete(cardId: string) {
    const { data: deleted, error: deleteError } = await getSupabase()
      .from("cards")
      .delete()
      .eq("id", cardId)
      .select();

    if (deleteError) throw new Error(deleteError.message);
    if (!deleted?.length) {
      throw new Error(
        "删除未生效：Supabase 拒绝了此操作。请在 SQL Editor 中执行 supabase/rls-policies.sql 添加 DELETE 策略。"
      );
    }
    await fetchCards();
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/40">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl animate-fade-in">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                MindVault 灵感库
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">收集与管理你的灵感碎片</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-600/25 transition hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-600/30 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>新增卡片</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
            <p className="mt-4 text-sm text-slate-500">加载灵感卡片中...</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center animate-fade-in">
            <p className="font-medium text-rose-700">加载失败</p>
            <p className="mt-1 text-sm text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchCards().finally(() => setLoading(false));
              }}
              className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
            >
              重试
            </button>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
              <Sparkles className="h-8 w-8 text-violet-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">还没有灵感卡片</h2>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              点击右上角「新增卡片」，开始记录你的第一个灵感吧
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />
              新增卡片
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => {
              const tags = normalizeTags(card.tags);
              return (
                <article
                  key={card.id}
                  className="group relative flex flex-col rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition hover:border-violet-200/80 hover:shadow-md hover:shadow-violet-500/10 animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(index, 12) * 60}ms` }}
                >
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEditModal(card)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600"
                      aria-label={`编辑 ${card.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCard(card)}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`删除 ${card.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h3 className="pr-16 text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-violet-700">
                    {card.title}
                  </h3>

                  {card.content && (
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-4">
                      {card.content}
                    </p>
                  )}

                  {card.url && (
                    <a
                      href={card.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 transition hover:text-violet-800"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{card.url}</span>
                    </a>
                  )}

                  {tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 ring-1 ring-violet-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <time
                    dateTime={card.created_at}
                    className="mt-4 block text-xs text-slate-400"
                  >
                    {formatDate(card.created_at)}
                  </time>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <AddCardModal
        open={modalOpen}
        card={editingCard}
        onClose={closeModal}
        onSave={handleSave}
      />

      <DeleteConfirmModal
        open={Boolean(deletingCard)}
        title={deletingCard?.title ?? ""}
        cardId={deletingCard?.id}
        onClose={() => setDeletingCard(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
