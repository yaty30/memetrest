import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Chip,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type {
  ApprovalRiskFilter,
  ApprovalSortOption,
  ApprovalTypeFilter,
} from "./approvalTypes";

interface ApprovalToolbarProps {
  pendingCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  typeFilter: ApprovalTypeFilter;
  onTypeFilterChange: (value: ApprovalTypeFilter) => void;
  riskFilter: ApprovalRiskFilter;
  onRiskFilterChange: (value: ApprovalRiskFilter) => void;
  sortBy: ApprovalSortOption;
  onSortByChange: (value: ApprovalSortOption) => void;
}

export default function ApprovalToolbar({
  pendingCount,
  searchValue,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  riskFilter,
  onRiskFilterChange,
  sortBy,
  onSortByChange,
}: ApprovalToolbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeFilterCount =
    (typeFilter !== "all" ? 1 : 0) +
    (riskFilter !== "all" ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0);

  return (
    <>
      <Stack spacing={1.25}>
        {/* Queue count chip */}
        <Box>
          <Chip
            label={`${pendingCount} pending`}
            color="warning"
            size="small"
            sx={{ fontWeight: 600, height: 24, fontSize: "0.75rem" }}
          />
        </Box>

        {/* Search + filter button */}
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            fullWidth
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search title, uploader, tags…"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{ fontSize: 18, color: "text.secondary" }}
                    />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: "0.875rem",
              },
            }}
          />
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={(theme) => ({
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "10px",
              width: 40,
              height: 40,
              flexShrink: 0,
            })}
            aria-label="Open filters"
          >
            <Badge
              badgeContent={activeFilterCount}
              color="warning"
              variant="dot"
              invisible={activeFilterCount === 0}
            >
              <TuneRoundedIcon sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>
        </Stack>
      </Stack>

      {/* Filter drawer */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            p: 2.5,
            maxHeight: "70vh",
          },
        }}
      >
        <Stack spacing={2.5}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>
              Filters & Sort
            </Typography>
            <IconButton size="small" onClick={() => setDrawerOpen(false)}>
              <CloseRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Stack>

          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={typeFilter}
              label="Type"
              onChange={(e) =>
                onTypeFilterChange(e.target.value as ApprovalTypeFilter)
              }
              sx={{ borderRadius: "10px" }}
            >
              <MenuItem value="all">All types</MenuItem>
              <MenuItem value="images">Images only</MenuItem>
              <MenuItem value="gifs">GIFs only</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Risk level</InputLabel>
            <Select
              value={riskFilter}
              label="Risk level"
              onChange={(e) =>
                onRiskFilterChange(e.target.value as ApprovalRiskFilter)
              }
              sx={{ borderRadius: "10px" }}
            >
              <MenuItem value="all">All risk levels</MenuItem>
              <MenuItem value="flagged">User-flagged only</MenuItem>
              <MenuItem value="borderline_or_explicit">
                Borderline or explicit
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              label="Sort by"
              onChange={(e) =>
                onSortByChange(e.target.value as ApprovalSortOption)
              }
              sx={{ borderRadius: "10px" }}
            >
              <MenuItem value="newest">Newest first</MenuItem>
              <MenuItem value="oldest">Oldest first</MenuItem>
              <MenuItem value="largest">Largest file first</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            fullWidth
            onClick={() => setDrawerOpen(false)}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Apply
          </Button>
        </Stack>
      </Drawer>
    </>
  );
}
