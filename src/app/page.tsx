"use client";

import AddCardModal, { type CardFormData } from "@/components/AddCardModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import SortableCard from "@/components/SortableCard";
import TagManagerModal from "@/components/TagManagerModal";
import { getSupabase } from "@/lib/supabase";
import type { Card, TagDefinition } from "@/types/card";
import {
  Lightbulb, Plus, Sparkles, Tag as TagIcon, Settings2, X,
  ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useState } from "react";

type SortMode = "default" | "created_at" | "updated_at";
type SortDirection = "asc" | "desc";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "default", label: "默认排序" },
  { value: "created_at", label: "创建时间" },
  { value: "updated_at", label: "更新时间" },
];

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);

  // Tag management
  const [allTags, setAllTags] = useState<TagDefinition[]>([]);
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);

  // Sort state
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchCards = useCallback(async () => {
    setError(null);
    const { data, error: fetchError } = await getSupabase()
      .from("cards")
      .select("*")
      .order("position", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setCards(data ?? []);
  }, []);

  const fetchTags = useCallback(async () => {
    const { data, error: fetchError } = await getSupabase()
      .from("tags")
      .select("*")
      .order("name", { ascending: true });

    if (!fetchError) {
      setAllTags(data ?? []);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchCards().finally(() => setLoading(false)),
      fetchTags(),
    ]);
  }, [fetchCards, fetchTags]);

  // AND filter: card must have ALL selected tags
  const filteredCards = useMemo(() => {
    if (selectedFilterTags.length === 0) return cards;
    return cards.filter((card) => {
      if (!card.tags || card.tags.length === 0) return false;
      const cardTagNames = card.tags.map((t) => t.name);
      return selectedFilterTags.every((filterTag) => cardTagNames.includes(filterTag));
    });
  }, [cards, selectedFilterTags]);

  // Sort filtered cards
  const sortedCards = useMemo(() => {
    const sorted = [...filteredCards];
    if (sortMode === "default") {
      return sorted.sort((a, b) => a.position - b.position);
    }
    const field = sortMode;
    sorted.sort((a, b) => {
      const dateA = new Date(a[field]).getTime();
      const dateB = new Date(b[field]).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });
    return sorted;
  }, [filteredCards, sortMode, sortDirection]);

  const isTimeSort = sortMode !== "default";

  function toggleFilterTag(tagName: string) {
    setSelectedFilterTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  }

  function clearFilter() {
    setSelectedFilterTags([]);
  }

  function toggleDirection() {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }

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
    const now = new Date().toISOString();
    const payload = {
      title: data.title,
      content: data.content || null,
      url: data.url || null,
      tags: data.tags.length > 0 ? data.tags : null,
    };

    if (cardId) {
      const { data: updated, error: updateError } = await getSupabase()
        .from("cards")
        .update({ ...payload, updated_at: now })
        .eq("id", cardId)
        .select();

      if (updateError) throw new Error(updateError.message);
      if (!updated?.length) {
        throw new Error(
          "更新未生效：Supabase 拒绝了此操作。请在 SQL Editor 中执行 supabase/rls-policies.sql 添加 UPDATE 策略。"
        );
      }
    } else {
      const position = cards.length;
      const { data: inserted, error: insertError } = await getSupabase()
        .from("cards")
        .insert({ ...payload, position, updated_at: now })
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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentItems = cards;
    const oldIndex = currentItems.findIndex((item) => item.id === active.id);
    const newIndex = currentItems.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the array
    const newItems = [...currentItems];
    const [moved] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, moved);

    // Update position values to match the new order
    // This is critical: sortedCards sorts by position in default mode,
    // so we must keep position in sync with the array order
    const reorderedCards = newItems.map((card, index) => ({
      ...card,
      position: index,
    }));

    setCards(reorderedCards);

    try {
      const updates = reorderedCards.map((card) =>
        getSupabase()
          .from("cards")
          .update({ position: card.position })
          .eq("id", card.id)
      );
      await Promise.all(updates);
    } catch (err) {
      console.error("Failed to save positions:", err);
      fetchCards();
    }
  }

  function renderCardGrid() {
    const grid = (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sortedCards.map((card, index) => (
          <SortableCard
            key={card.id}
            card={card}
            index={index}
            sortMode={sortMode}
            onEdit={openEditModal}
            onDelete={setDeletingCard}
          />
        ))}
      </div>
    );

    if (isTimeSort) {
      return grid;
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedCards.map((card) => card.id)}
          strategy={rectSortingStrategy}
        >
          {grid}
        </SortableContext>
      </DndContext>
    );
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
                Mind Vault
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">收集与管理你的灵感碎片</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTagManagerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
              aria-label="管理标签"
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">管理标签</span>
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-600/25 transition hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-600/30 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>新增卡片</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="border-b border-white/40 bg-white/40 backdrop-blur-xl animate-fade-in">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
            <TagIcon className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => {
                const isActive = selectedFilterTags.includes(tag.name);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleFilterTag(tag.name)}
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium transition"
                    style={{
                      backgroundColor: isActive ? `${tag.color}20` : `${tag.color}10`,
                      color: isActive ? tag.color : `${tag.color}70`,
                      border: `1px solid ${isActive ? tag.color : `${tag.color}20`}`,
                    }}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
            {selectedFilterTags.length > 0 && (
              <button
                type="button"
                onClick={clearFilter}
                className="ml-auto flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
                清除筛选
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sort bar */}
      {!loading && !error && cards.length > 0 && (
        <div className="border-b border-white/40 bg-white/30 backdrop-blur-xl animate-fade-in">
          <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2 sm:px-6 lg:px-8">
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <div className="flex flex-wrap items-center gap-0.5">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortMode(opt.value)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    sortMode === opt.value
                      ? "bg-violet-100 text-violet-700"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {isTimeSort && (
              <button
                type="button"
                onClick={toggleDirection}
                className="ml-2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label={sortDirection === "asc" ? "切换为降序" : "切换为升序"}
              >
                {sortDirection === "asc" ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      )}

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
        ) : sortedCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
              <Sparkles className="h-8 w-8 text-violet-500" />
            </div>
            {selectedFilterTags.length > 0 ? (
              <>
                <h2 className="text-xl font-semibold text-slate-800">没有匹配的卡片</h2>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  当前筛选条件没有匹配的卡片，试试调整筛选标签
                </p>
                <button
                  type="button"
                  onClick={clearFilter}
                  className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
                >
                  清除筛选
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        ) : (
          renderCardGrid()
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

      <TagManagerModal
        open={tagManagerOpen}
        onClose={() => setTagManagerOpen(false)}
        onTagsChanged={fetchTags}
      />
    </div>
  );
}