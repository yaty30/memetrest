import { Avatar, Box, Divider, Stack, Typography } from "@mui/material";
import type { Comment } from "./types";

interface CommentListProps {
  comments: Comment[];
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          minHeight: { xs: 56, md: 80 },
          px: 2,
          color: "text.secondary",
          fontSize: { xs: "0.75rem", md: "0.8125rem" },
        }}
      >
        No comments yet — be the first!
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: { xs: "2px", md: "4px" },
        px: { xs: 1.75, md: 2 },
        py: 1,
        overflowY: "auto",
        flex: 1,
        minHeight: 0,
        scrollbarWidth: "thin",
        scrollbarColor: (t) => `${t.palette.scrollbar.thumb} transparent`,
      }}
    >
      {comments.map((comment) => (
        <Box key={comment.id}>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 0.5 }} />
          <Stack
            direction="row"
            spacing={{ xs: 1, md: 1.25 }}
            sx={{
              py: { xs: 0.75, md: 1 },
              px: 0.5,
              borderRadius: "10px",
              transition: "background 0.15s ease",
              "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
            }}
          >
            <Avatar
              src={comment.author.avatar}
              alt={comment.author.name}
              sx={{
                width: { xs: 26, md: 30 },
                height: { xs: 26, md: 30 },
                mt: "2px",
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                alignItems="baseline"
                spacing={1}
                sx={{ mb: "2px" }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                    fontSize: { xs: "0.75rem", md: "0.8125rem" },
                    whiteSpace: "nowrap",
                  }}
                >
                  {comment.author.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: { xs: "0.625rem", md: "0.6875rem" },
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatRelativeTime(comment.createdAt)}
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.75rem", md: "0.8125rem" },
                  lineHeight: { xs: 1.4, md: 1.45 },
                  wordBreak: "break-word",
                }}
              >
                {comment.text}
              </Typography>
            </Box>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
