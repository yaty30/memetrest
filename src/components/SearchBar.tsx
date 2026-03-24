import { InputBase } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";

interface SearchBarProps {
  value?: string;
  onChange?: (query: string) => void;
}

export default function SearchBar({ value = "", onChange }: SearchBarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: { xs: 1.5, sm: 2.5 },
        py: 2.5,
      }}
    >
      <Box
        sx={(theme) => ({
          flex: 1,
          display: "flex",
          alignItems: "center",
          backgroundColor: "surface.input",
          borderRadius: "14px",
          px: 2.5,
          py: 1.2,
          border: "1px solid",
          borderColor: "divider",
          transition:
            "border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease",
          "&:hover": {
            borderColor: alpha(theme.palette.common.white, 0.15),
            backgroundColor: "surface.inputHover",
          },
          "&:focus-within": {
            borderColor: alpha(theme.palette.primary.main, 0.4),
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
            backgroundColor: "surface.inputFocus",
          },
        })}
      >
        <SearchIcon sx={{ color: "secondary.main", mr: 1.5, fontSize: 20 }} />
        <InputBase
          placeholder="Search by title, tags, category..."
          fullWidth
          aria-label="Search images"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          sx={{
            fontSize: "0.8125rem",
            fontWeight: 450,
            color: "text.primary",
            "& ::placeholder": {
              color: "secondary.main",
              opacity: 1,
            },
          }}
        />
      </Box>

      {/* <SettingsButton /> */}
    </Box>
  );
}
