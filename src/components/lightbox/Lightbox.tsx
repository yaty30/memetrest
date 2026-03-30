import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Download, Share2, Heart, MessageCircle, X } from "lucide-react";
import type { LightboxProps, Comment, Meme } from "./types";
import LightboxImagePane from "./LightboxImagePane";
import LightboxSidebar from "./LightboxSidebar";
import ActionItem from "../ActionItem";
import { memeService } from "../../services";
import SignInDialog from "../SignInDialog";
import { useMemeLike } from "../../hooks/useMemeLike";

/** Seed comments so the UI isn't empty on first open. */
function makeSeedComments(): Comment[] {
  return [
    {
      id: "seed-1",
      author: {
        name: "Alex Rivera",
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex",
      },
      text: "This is absolute gold 😂",
      createdAt: new Date(Date.now() - 3_600_000 * 2),
    },
    {
      id: "seed-2",
      author: {
        name: "Jordan Lee",
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan",
      },
      text: "Sending this to everyone I know",
      createdAt: new Date(Date.now() - 3_600_000 * 5),
    },
  ];
}

export default function Lightbox({
  item,
  open,
  onClose,
  onTagClick,
}: LightboxProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [currentItem, setCurrentItem] = useState<Meme | null>(null);
  const displayItem = currentItem ?? item;

  const [comments, setComments] = useState<Comment[]>(makeSeedComments);
  const [signInOpen, setSignInOpen] = useState(false);
  const {
    viewerHasLiked,
    likeCount,
    handleLike,
  } = useMemeLike({
    memeId: displayItem?.id ?? null,
    initialLikeCount: displayItem?.likeCount ?? 0,
    initialViewerHasLiked: displayItem?.viewerHasLiked,
    onAuthRequired: () => setSignInOpen(true),
  });

  const handleAddComment = useCallback((text: string) => {
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: {
        name: "You",
        avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=You",
      },
      text,
      createdAt: new Date(),
    };
    setComments((prev) => [...prev, newComment]);
  }, []);

  const handleDownload = useCallback(() => {
    if (!displayItem) return;
    const ext = displayItem.animated ? "gif" : "jpg";
    const link = document.createElement("a");
    link.href = displayItem.image;
    link.download = `${displayItem.title.replace(/\s+/g, "-").toLowerCase()}.${ext}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    memeService
      .incrementCounter(displayItem.id, "downloadCount")
      .catch(() => {});
  }, [displayItem]);

  const handleShare = useCallback(async () => {
    if (!displayItem) return;
    const shareData = { title: displayItem.title, url: displayItem.image };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(displayItem.image);
      }
      memeService
        .incrementCounter(displayItem.id, "shareCount")
        .catch(() => {});
    } catch {
      // User cancelled share or clipboard failed — no-op
    }
  }, [displayItem]);

  const handleRelatedSelect = useCallback((meme: Meme) => {
    setCurrentItem(meme);
  }, []);

  const actionBar = useMemo(
    () => (
      <>
        <ActionItem icon={Download} label="Download" onClick={handleDownload} />
        <ActionItem icon={Share2} label="Share" onClick={handleShare} />
        <ActionItem
          icon={Heart}
          label={viewerHasLiked ? "Liked" : "Like"}
          onClick={handleLike}
        />
        <ActionItem icon={MessageCircle} label="Comment" />
      </>
    ),
    [handleDownload, handleShare, handleLike, viewerHasLiked],
  );

  if (!displayItem) return null;
  const displayLikeCount = likeCount;

  return (
    <Dialog
      open={open}
      onClose={() => {
        setCurrentItem(null);
        onClose();
      }}
      maxWidth={false}
      fullScreen={isMobile}
      transitionDuration={150}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "overlay.backdrop",
            backdropFilter: "blur(12px)",
          },
        },
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : "20px",
            overflow: "hidden",
            background: "transparent",
            boxShadow: isMobile
              ? "none"
              : (t) => t.palette.customShadows.viewer,
            m: isMobile ? 0 : 3,
            width: isMobile ? "100%" : "min(1100px, 92vw)",
            height: isMobile ? "100%" : "min(720px, 88vh)",
          },
        },
      }}
      aria-label={`Viewing ${displayItem.title}`}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: { xs: "auto", md: "hidden" },
          WebkitOverflowScrolling: "touch",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <IconButton
          onClick={() => {
            setCurrentItem(null);
            onClose();
          }}
          aria-label="Close lightbox"
          sx={{
            position: "absolute",
            top: {
              xs: "calc(6px + env(safe-area-inset-top, 0px))",
              md: "10px",
            },
            right: { xs: "8px", md: "10px" },
            zIndex: 10,
            width: { xs: 40, md: 36 },
            height: { xs: 40, md: 36 },
            bgcolor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            color: "text.primary",
            "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
            "&:active": { transform: "scale(0.93)" },
          }}
        >
          <X size={18} strokeWidth={2} />
        </IconButton>

        <LightboxImagePane
          imageSrc={displayItem.image}
          title={displayItem.title}
          actions={isMobile ? undefined : actionBar}
        />
        <LightboxSidebar
          item={{ ...displayItem, viewerHasLiked, likeCount: displayLikeCount }}
          comments={comments}
          onAddComment={handleAddComment}
          actionsSlot={isMobile ? actionBar : undefined}
          onTagClick={(tag) => {
            setCurrentItem(null);
            onClose();
            onTagClick?.(tag);
          }}
          onRelatedSelect={handleRelatedSelect}
        />
      </Box>
      <SignInDialog open={signInOpen} onClose={() => setSignInOpen(false)} />
    </Dialog>
  );
}
