import { useState, useEffect } from "react";
import { Box, Skeleton, Stack, Typography } from "@mui/material";
import type { Meme } from "../types/meme";
import { memeService } from "../services";

interface RelatedMemesProps {
  meme: Meme;
  onSelect: (meme: Meme) => void;
}

export default function RelatedMemes({ meme, onSelect }: RelatedMemesProps) {
  const [related, setRelated] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);

  // Reset loading when meme changes (state-during-render pattern, avoids
  // synchronous setState inside useEffect).
  const [prevMeme, setPrevMeme] = useState(meme);
  if (prevMeme !== meme) {
    setPrevMeme(meme);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;

    memeService
      .getRelatedMemes(meme, 6)
      .then((items) => {
        if (!cancelled) setRelated(items);
      })
      .catch(() => {
        // silently fail
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [meme]);

  if (!loading && related.length === 0) return null;

  return (
    <Box sx={{ px: { xs: 1.75, md: 2 }, pb: 1.5, flexShrink: 0 }}>
      <Typography
        variant="overline"
        sx={{
          fontSize: { xs: "0.6875rem", md: "0.75rem" },
          fontWeight: 600,
          color: "text.secondary",
          letterSpacing: "0.04em",
          lineHeight: 1,
          display: "block",
          mb: 1,
        }}
      >
        Related Memes
      </Typography>

      <Stack
        direction="row"
        sx={{
          gap: 1,
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          pb: 0.5,
        }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                animation="wave"
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "10px",
                  flexShrink: 0,
                }}
              />
            ))
          : related.map((item) => (
              <Box
                key={item.id}
                onClick={() => onSelect(item)}
                sx={{
                  width: 80,
                  height: 80,
                  flexShrink: 0,
                  borderRadius: "10px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: "1px solid transparent",
                  "&:hover": {
                    transform: "scale(1.05)",
                    borderColor: "primary.main",
                  },
                }}
              >
                <Box
                  component="img"
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Box>
            ))}
      </Stack>
    </Box>
  );
}
