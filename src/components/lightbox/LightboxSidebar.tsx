import type { ReactNode } from "react";
import { Avatar, Box, Chip, Divider, Stack, Typography } from "@mui/material";
import { Heart, ArrowDownToLine, Share2 } from "lucide-react";
import type { Comment, Meme } from "./types";
import CommentList from "./CommentList";
import CommentInput from "./CommentInput";
import RelatedMemes from "../RelatedMemes";

interface LightboxSidebarProps {
  item: Meme;
  comments: Comment[];
  onAddComment: (text: string) => void;
  actionsSlot?: ReactNode;
  onTagClick?: (tag: string) => void;
  onRelatedSelect?: (meme: Meme) => void;
}

function formatTimestamp(date?: Date): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LightboxSidebar({
  item,
  comments,
  onAddComment,
  actionsSlot,
  onTagClick,
  onRelatedSelect,
}: LightboxSidebarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        bgcolor: "surface.card",
        overflow: { xs: "auto", md: "hidden" },
        flex: { xs: "1 1 auto", md: "0 0 340px" },
        minHeight: 0,
      }}
    >
      {/* Uploader info */}
      <Box
        sx={{
          pt: { xs: 1.5, md: 2 },
          px: { xs: 1.75, md: 2 },
          pr: { xs: 1.75, md: 6 },
          flexShrink: 0,
        }}
      >
        {item.overlay ? (
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Avatar
              src={item.overlay.avatar}
              alt={item.overlay.name}
              sx={{
                width: { xs: 32, md: 36 },
                height: { xs: 32, md: 36 },
              }}
            />
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  fontSize: { xs: "0.8125rem", md: "0.875rem" },
                }}
              >
                {item.overlay.name}
              </Typography>
              {item.createdAt && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: { xs: "0.6875rem", md: "0.75rem" },
                  }}
                >
                  {formatTimestamp(item.createdAt)}
                </Typography>
              )}
            </Box>
          </Stack>
        ) : (
          item.createdAt && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {formatTimestamp(item.createdAt)}
            </Typography>
          )
        )}
      </Box>

      {/* Description & tags */}
      <Box
        sx={{
          px: { xs: 1.75, md: 2 },
          pt: { xs: 1.25, md: 1.75 },
          flexShrink: 0,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            mb: { xs: 0.5, md: 0.75 },
            fontSize: { xs: "0.875rem", md: "0.9375rem" },
            fontWeight: 700,
            lineHeight: 1.3,
            color: "text.primary",
          }}
        >
          {item.title}
        </Typography>
        {item.description && (
          <Typography
            variant="body2"
            sx={{
              mb: { xs: 1, md: 1.25 },
              fontSize: "0.8125rem",
              lineHeight: { xs: 1.4, md: 1.5 },
              color: "text.secondary",
            }}
          >
            {item.description}
          </Typography>
        )}
        {item.tags && item.tags.length > 0 && (
          <Stack
            direction="row"
            flexWrap="wrap"
            sx={{
              gap: { xs: "5px", md: "6px" },
              mb: { xs: "10px", md: 0.5 },
            }}
          >
            {item.tags.map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                size="small"
                onClick={() => onTagClick?.(tag)}
                sx={{
                  height: "auto",
                  fontSize: { xs: "0.6875rem", md: "0.75rem" },
                  fontWeight: 500,
                  color: "primary.main",
                  bgcolor: "rgba(94,234,212,0.1)",
                  px: { xs: 0.5, md: 0.75 },
                  py: { xs: "2px", md: "3px" },
                  borderRadius: "20px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "& .MuiChip-label": {
                    px: 0.5,
                  },
                  "&:hover": {
                    bgcolor: "rgba(94,234,212,0.2)",
                  },
                }}
              />
            ))}
          </Stack>
        )}

        {/* Engagement stats */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            mb: { xs: 1, md: 1.25 },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Heart size={13} />
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontSize: "0.6875rem" }}
            >
              {item.likeCount.toLocaleString()}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Share2 size={13} />
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontSize: "0.6875rem" }}
            >
              {item.shareCount.toLocaleString()}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <ArrowDownToLine size={13} />
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontSize: "0.6875rem" }}
            >
              {item.downloadCount.toLocaleString()}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* Mobile actions slot */}
      {actionsSlot && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          sx={{
            px: { xs: 1, md: 1.5 },
            py: { xs: 0.75, md: 1 },
            gap: { xs: 0, md: 0.5 },
            borderTop: "1px solid",
            borderBottom: "1px solid",
            borderColor: "rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          {actionsSlot}
        </Stack>
      )}

      {/* Comments section header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: { xs: 1.75, md: 2 },
          pt: { xs: 1.25, md: 1.5 },
          pb: 0.5,
          flexShrink: 0,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            fontSize: { xs: "0.75rem", md: "0.8125rem" },
            fontWeight: 600,
            color: "text.secondary",
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}
        >
          Comments
        </Typography>
        {comments.length > 0 && (
          <Box
            component="span"
            sx={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              bgcolor: "rgba(255,255,255,0.08)",
              color: "text.secondary",
              px: "7px",
              py: "1px",
              borderRadius: "10px",
            }}
          >
            {comments.length}
          </Box>
        )}
      </Stack>

      <CommentList comments={comments} />
      <CommentInput onSubmit={onAddComment} />

      {/* Related memes */}
      {onRelatedSelect && (
        <>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
          <RelatedMemes meme={item} onSelect={onRelatedSelect} />
        </>
      )}
    </Box>
  );
}
