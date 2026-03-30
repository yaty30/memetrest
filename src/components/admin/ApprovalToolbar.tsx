import {
  Box,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
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
  return (
    <Box
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "12px",
        p: { xs: 1.5, sm: 2 },
        bgcolor: "background.default",
      })}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ minWidth: { md: 200 } }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
            Queue
          </Typography>
          <Chip
            label={`${pendingCount} pending`}
            color="warning"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        </Stack>

        <TextField
          size="small"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search title, uploader, tags..."
          sx={{ flex: 1, minWidth: { md: 240 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          size="small"
          label="Type"
          value={typeFilter}
          onChange={(event) =>
            onTypeFilterChange(event.target.value as ApprovalTypeFilter)
          }
          sx={{ minWidth: { xs: "100%", sm: 140 } }}
        >
          <MenuItem value="all">All types</MenuItem>
          <MenuItem value="images">Images</MenuItem>
          <MenuItem value="gifs">GIFs</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Risk"
          value={riskFilter}
          onChange={(event) =>
            onRiskFilterChange(event.target.value as ApprovalRiskFilter)
          }
          sx={{ minWidth: { xs: "100%", sm: 170 } }}
        >
          <MenuItem value="all">All risk levels</MenuItem>
          <MenuItem value="flagged">User-flagged only</MenuItem>
          <MenuItem value="borderline_or_explicit">
            Borderline or explicit
          </MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Sort"
          value={sortBy}
          onChange={(event) =>
            onSortByChange(event.target.value as ApprovalSortOption)
          }
          sx={{ minWidth: { xs: "100%", sm: 150 } }}
        >
          <MenuItem value="newest">Newest first</MenuItem>
          <MenuItem value="oldest">Oldest first</MenuItem>
          <MenuItem value="largest">Largest file first</MenuItem>
        </TextField>
      </Stack>
    </Box>
  );
}
