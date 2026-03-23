import { InputBase } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Box } from "@mui/material";
import SettingsButton from "./SettingsButton";

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
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          backgroundColor: "#F8F6FA",
          borderRadius: "14px",
          px: 2.5,
          py: 1.2,
          border: "1px solid #EDE9F4",
          transition:
            "border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease",
          "&:hover": {
            borderColor: "#D8D0E8",
            backgroundColor: "#F5F2F8",
          },
          "&:focus-within": {
            borderColor: "rgba(124,58,237,0.35)",
            boxShadow: "0 0 0 3px rgba(124,58,237,0.06)",
            backgroundColor: "#FDFCFE",
          },
        }}
      >
        <SearchIcon sx={{ color: "#A89BB8", mr: 1.5, fontSize: 20 }} />
        <InputBase
          placeholder="Search by title, tags, category..."
          fullWidth
          aria-label="Search images"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          sx={{
            fontSize: "0.8125rem",
            fontWeight: 450,
            color: "#1A1625",
            "& ::placeholder": {
              color: "#A89BB8",
              opacity: 1,
            },
          }}
        />
      </Box>

      <SettingsButton />
    </Box>
  );
}
