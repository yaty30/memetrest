import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import ImageViewerView from "../views/ImageViewerView";
import { memeService } from "../services";
import type { Meme } from "../types/meme";
import "./ImageViewerPage.css";

export default function ImageViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meme, setMeme] = useState<Meme | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    memeService.getMemeById(id).then((item) => {
      if (item) {
        setMeme(item);
      } else {
        setNotFound(true);
      }
    });
  }, [id]);

  if (notFound) {
    return (
      <Box
        className="image-viewer-page"
        sx={{ justifyContent: "center", alignItems: "center" }}
      >
        <Typography color="text.secondary">Image not found</Typography>
      </Box>
    );
  }

  if (!meme) {
    return (
      <Box
        className="image-viewer-page"
        sx={{ justifyContent: "center", alignItems: "center" }}
      >
        <CircularProgress size={32} sx={{ color: "text.secondary" }} />
      </Box>
    );
  }

  return (
    <div className="image-viewer-page">
      <ImageViewerView
        meme={meme}
        onBack={() => navigate(-1)}
        onTagClick={(tag) => navigate(`/?search=${encodeURIComponent(tag)}`)}
      />
    </div>
  );
}
