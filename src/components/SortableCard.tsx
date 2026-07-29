"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card, Tag } from "@/types/card";
import { ExternalLink, Pencil, Trash2, GripVertical } from "lucide-react";

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function normalizeTags(tags: Card["tags"]): Tag[] {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags
      .map((t) => {
        if (typeof t === "string") {
          return { name: t, color: "#6366F1" };
        }
        return t as Tag;
      })
      .filter((t) => t && t.name);
  }
  return [];
}

type SortableCardProps = {
  card: Card;
  index: number;
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
};

export default function SortableCard({
  card,
  index,
  onEdit,
  onDelete,
}: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const tags = normalizeTags(card.tags);

  return (
    <article
      ref={setNodeRef}
      style={{
        ...style,
        animationDelay: `${Math.min(index, 12) * 60}ms`,
      }}
      className="group relative flex flex-col rounded-2xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition hover:border-violet-200/80 hover:shadow-md hover:shadow-violet-500/10 animate-fade-in-up touch-none"
      {...attributes}
    >
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(card)}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-violet-50 hover:text-violet-600"
          aria-label={`编辑 ${card.title}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(card)}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          aria-label={`删除 ${card.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div
        className="absolute left-3 top-3 cursor-grab text-slate-300 opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
        {...listeners}
        aria-label="拖拽调整位置"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <h3 className="pl-8 pr-16 text-base font-semibold leading-snug text-slate-900 transition-colors group-hover:text-violet-700">
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
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 transition hover:text-violet-800"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{card.url}</span>
        </a>
      )}

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span
              key={`${tag.name}-${i}`}
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${tag.color}15`,
                color: tag.color,
                border: `1px solid ${tag.color}40`,
              }}
            >
              {tag.name}
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
}