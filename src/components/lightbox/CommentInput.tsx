import { useState, type KeyboardEvent } from "react";
import { IconButton, Stack, TextField } from "@mui/material";
import { Send } from "lucide-react";

interface CommentInputProps {
  onSubmit: (text: string) => void;
}

export default function CommentInput({ onSubmit }: CommentInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        gap: { xs: "6px", md: 1 },
        px: { xs: 1.75, md: 2 },
        py: { xs: 1, md: 1.5 },
        pb: {
          xs: "calc(8px + env(safe-area-inset-bottom, 0px))",
          md: 1.5,
        },
        borderTop: "1px solid",
        borderColor: "rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}
    >
      <TextField
        label="Add Comment"
        variant="outlined"
        size="small"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        slotProps={{ input: { "aria-label": "Add a comment" } }}
        multiline
        sx={{
          flex: 1,
          "& .MuiOutlinedInput-root": {
            fontSize: { xs: "0.8125rem", md: "0.875rem" },
            borderRadius: { xs: "8px", md: "10px" },
            height: 40,
          },
        }}
      />
      <IconButton
        onClick={handleSubmit}
        disabled={!value.trim()}
        aria-label="Send comment"
        sx={{
          width: { xs: 34, md: 36 },
          height: { xs: 34, md: 36 },
          bgcolor: "primary.main",
          color: "primary.contrastText",
          flexShrink: 0,
          "&:hover": { bgcolor: "primary.main", opacity: 0.85 },
          "&:active": { transform: "scale(0.92)" },
          "&.Mui-disabled": {
            bgcolor: "primary.main",
            color: "primary.contrastText",
            opacity: 0.35,
          },
        }}
      >
        <Send size={18} strokeWidth={2} />
      </IconButton>
    </Stack>
  );
}
