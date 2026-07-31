/**
 * 27 种预设标签颜色，按色相排序（红 → 橙 → 黄 → 绿 → 青 → 蓝 → 紫 → 粉 → 灰）
 * 在 TagManagerModal 和 AddCardModal 之间共享，确保颜色选择器一致
 */
export const TAG_COLORS = [
  "#DC2626", // red-600
  "#EF4444", // red-500
  "#F43F5E", // rose-500
  "#F97316", // orange-500
  "#FB923C", // orange-400
  "#F59E0B", // amber-500
  "#EAB308", // yellow-500
  "#FACC15", // yellow-400
  "#84CC16", // lime-500
  "#22C55E", // green-500
  "#4ADE80", // green-400
  "#10B981", // emerald-500
  "#14B8A6", // teal-500
  "#2DD4BF", // teal-400
  "#06B6D4", // cyan-500
  "#0EA5E9", // sky-500
  "#38BDF8", // sky-400
  "#3B82F6", // blue-500
  "#6366F1", // indigo-500
  "#818CF8", // indigo-400
  "#8B5CF6", // violet-500
  "#A855F7", // purple-500
  "#C084FC", // purple-400
  "#D946EF", // fuchsia-500
  "#EC4899", // pink-500
  "#F472B6", // pink-400
  "#64748B", // slate-500
];

/** 默认选中颜色（indigo-500）的索引 */
export const DEFAULT_COLOR_INDEX = 18;