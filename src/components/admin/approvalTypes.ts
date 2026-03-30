export const APPROVAL_SORT_OPTIONS = [
  "newest",
  "oldest",
  "largest",
] as const;
export type ApprovalSortOption = (typeof APPROVAL_SORT_OPTIONS)[number];

export const APPROVAL_TYPE_FILTERS = ["all", "images", "gifs"] as const;
export type ApprovalTypeFilter = (typeof APPROVAL_TYPE_FILTERS)[number];

export const APPROVAL_RISK_FILTERS = [
  "all",
  "flagged",
  "borderline_or_explicit",
] as const;
export type ApprovalRiskFilter = (typeof APPROVAL_RISK_FILTERS)[number];

export type ApprovalAction = "approve" | "reject";
