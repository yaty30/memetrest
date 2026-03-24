import { Box, Chip, Stack, Typography, Select, MenuItem } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { X } from "lucide-react";
import {
  MEME_CATEGORIES,
  SORT_OPTIONS,
  type MemeCategory,
  type SortOption,
} from "../types/meme";

interface FilterBarProps {
  activeCategory: MemeCategory | null;
  activeTags: string[];
  sortBy: SortOption;
  hasActiveFilters: boolean;
  onCategoryChange: (cat: MemeCategory | null) => void;
  onTagRemove: (tag: string) => void;
  onSortChange: (sort: SortOption) => void;
  onClearAll: () => void;
}

const CATEGORY_LABELS: Record<MemeCategory, string> = {
  reaction: "Reaction",
  classic: "Classic",
  animals: "Animals",
  surreal: "Surreal",
  opinion: "Opinion",
  wholesome: "Wholesome",
  dark: "Dark",
  gaming: "Gaming",
  anime: "Anime",
  tech: "Tech",
  uncategorized: "Other",
};

export default function FilterBar({
  activeCategory,
  activeTags,
  sortBy,
  hasActiveFilters,
  onCategoryChange,
  onTagRemove,
  onSortChange,
  onClearAll,
}: FilterBarProps) {
  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 2.5 },
        pb: 1,
        flexShrink: 0,
      }}
    >
      {/* Category chips + sort */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          gap: { xs: 0.5, sm: 0.75 },
          flexWrap: "nowrap",
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          pb: 0.5,
        }}
      >
        {/* All chip */}
        <Chip
          label="All"
          size="small"
          onClick={() => onCategoryChange(null)}
          sx={(theme) => ({
            height: 30,
            fontSize: "0.75rem",
            fontWeight: 600,
            borderRadius: "20px",
            px: 0.5,
            flexShrink: 0,
            cursor: "pointer",
            transition: "all 0.2s ease",
            ...(activeCategory === null
              ? {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                  color: "primary.main",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                }
              : {
                  bgcolor: "surface.input",
                  color: "text.secondary",
                  border: "1px solid transparent",
                  "&:hover": {
                    bgcolor: "surface.inputHover",
                    color: "text.primary",
                  },
                }),
          })}
        />

        {MEME_CATEGORIES.filter((c) => c !== "uncategorized").map((cat) => (
          <Chip
            key={cat}
            label={CATEGORY_LABELS[cat]}
            size="small"
            onClick={() =>
              onCategoryChange(activeCategory === cat ? null : cat)
            }
            sx={(theme) => ({
              height: 30,
              fontSize: "0.75rem",
              fontWeight: 600,
              borderRadius: "20px",
              px: 0.5,
              flexShrink: 0,
              cursor: "pointer",
              transition: "all 0.2s ease",
              ...(activeCategory === cat
                ? {
                    bgcolor: alpha(theme.palette.primary.main, 0.18),
                    color: "primary.main",
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  }
                : {
                    bgcolor: "surface.input",
                    color: "text.secondary",
                    border: "1px solid transparent",
                    "&:hover": {
                      bgcolor: "surface.inputHover",
                      color: "text.primary",
                    },
                  }),
            })}
          />
        ))}

        {/* Sort selector — pinned right */}
        <Box sx={{ ml: "auto", flexShrink: 0, pl: 1 }}>
          <Select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            size="small"
            variant="outlined"
            sx={(theme) => ({
              height: 30,
              fontSize: "0.75rem",
              fontWeight: 600,
              borderRadius: "20px",
              color: "text.secondary",
              bgcolor: "surface.input",
              "& .MuiOutlinedInput-notchedOutline": {
                border: "1px solid transparent",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: alpha(theme.palette.common.white, 0.1),
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: alpha(theme.palette.primary.main, 0.3),
                borderWidth: 1,
              },
              "& .MuiSelect-select": {
                py: 0,
                pr: "28px !important",
                pl: 1.5,
              },
              "& .MuiSelect-icon": {
                color: "text.secondary",
                fontSize: 18,
              },
            })}
            MenuProps={{
              slotProps: {
                paper: {
                  sx: (theme) => ({
                    borderRadius: "12px",
                    mt: 0.5,
                    boxShadow: theme.palette.customShadows.dropdown,
                  }),
                },
              },
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <MenuItem
                key={opt.value}
                value={opt.value}
                sx={{ fontSize: "0.8125rem", fontWeight: 500 }}
              >
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Stack>

      {/* Active tag chips + clear-all control */}
      {(activeTags.length > 0 || hasActiveFilters) && (
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            gap: 0.75,
            mt: 1,
            flexWrap: "wrap",
          }}
        >
          {activeTags.length > 0 && (
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontSize: "0.6875rem",
                fontWeight: 500,
                mr: 0.25,
              }}
            >
              Tags:
            </Typography>
          )}
          {activeTags.map((tag) => (
            <Chip
              key={tag}
              label={`#${tag}`}
              size="small"
              deleteIcon={
                <X size={12} style={{ color: "inherit", opacity: 0.7 }} />
              }
              onDelete={() => onTagRemove(tag)}
              sx={(theme) => ({
                height: 24,
                fontSize: "0.6875rem",
                fontWeight: 500,
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: "20px",
                "& .MuiChip-label": { px: 0.75 },
                "& .MuiChip-deleteIcon": {
                  color: "primary.main",
                  ml: -0.25,
                  mr: 0.5,
                  "&:hover": { opacity: 1 },
                },
              })}
            />
          ))}
          <Chip
            label="Clear all"
            size="small"
            onClick={onClearAll}
            sx={{
              height: 24,
              fontSize: "0.6875rem",
              fontWeight: 500,
              color: "text.secondary",
              bgcolor: "transparent",
              borderRadius: "20px",
              cursor: "pointer",
              "&:hover": { color: "text.primary" },
              "& .MuiChip-label": { px: 0.5 },
            }}
          />
        </Stack>
      )}
    </Box>
  );
}
