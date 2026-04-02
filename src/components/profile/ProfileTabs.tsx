import { useCallback, useRef, useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import CollectionsOutlinedIcon from "@mui/icons-material/CollectionsOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ProfileEmptyState from "./ProfileEmptyState";
import ProfileAboutTab from "./ProfileAboutTab";
import ProfileUploadsTab from "./ProfileUploadsTab";
import type { UserProfile } from "../../types/user";

const TABS = [
  { label: "Uploads", icon: <CloudUploadOutlinedIcon /> },
  { label: "Saved", icon: <BookmarkBorderIcon /> },
  { label: "Collections", icon: <CollectionsOutlinedIcon /> },
  { label: "About", icon: <InfoOutlinedIcon /> },
] as const;

const SWIPE_THRESHOLD = 50;

interface ProfileTabsProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onContentScroll?: (scrollTop: number) => void;
}

export default function ProfileTabs({
  profile,
  isOwnProfile,
  onContentScroll,
}: ProfileTabsProps) {
  const [tab, setTab] = useState(0);
  const uploadsScrollRef = useRef<HTMLDivElement>(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const goToTab = useCallback(
    (newTab: number) => {
      setTab(newTab);
      onContentScroll?.(0);
    },
    [onContentScroll],
  );

  const handleTabChange = (_: React.SyntheticEvent, newTab: number) => {
    goToTab(newTab);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0 && tab < TABS.length - 1) goToTab(tab + 1);
        else if (dx > 0 && tab > 0) goToTab(tab - 1);
      }
    },
    [tab, goToTab],
  );

  const panelSx = {
    width: `${100 / TABS.length}%`,
    flexShrink: 0,
    height: "100%",
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    px: { xs: 2, sm: 3, md: 5 },
    py: { xs: 3, sm: 4 },
    pb: "max(24px, env(safe-area-inset-bottom))",
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: { xs: 200, sm: 240 },
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Tab bar — slightly tinted top border for surface separation */}
      <Tabs
        value={tab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons={false}
        sx={{
          px: { xs: 1.5, sm: 3, md: 5 },
          borderTop: "1px solid",
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "rgba(255,255,255,0.012)",
          // Hide scrollbar visually but keep native scroll on mobile
          "& .MuiTabs-scroller": {
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          },
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8rem",
            minHeight: 46,
            minWidth: { xs: "auto", sm: 90 },
            px: { xs: 1.5, sm: 2 },
            color: "text.secondary",
            "&.Mui-selected": { color: "primary.main" },
          },
          "& .MuiTabs-indicator": {
            height: 2.5,
            borderRadius: "2.5px 2.5px 0 0",
          },
          flexShrink: 0,
        }}
      >
        {TABS.map((t) => (
          <Tab
            key={t.label}
            label={t.label}
            icon={t.icon}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {/* Swipeable content area */}
      <Box
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}
      >
        <Box
          sx={{
            display: "flex",
            width: `${TABS.length * 100}%`,
            height: "100%",
            transform: `translateX(-${tab * (100 / TABS.length)}%)`,
            transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          {/* Panel 0 — Uploads */}
          <Box
            ref={uploadsScrollRef}
            onScroll={(e) =>
              tab === 0 && onContentScroll?.(e.currentTarget.scrollTop)
            }
            sx={panelSx}
          >
            <ProfileUploadsTab
              ownerUid={profile.uid}
              isOwnProfile={isOwnProfile}
              scrollRootRef={uploadsScrollRef}
            />
          </Box>

          {/* Panel 1 — Saved */}
          <Box
            onScroll={(e) =>
              tab === 1 && onContentScroll?.(e.currentTarget.scrollTop)
            }
            sx={panelSx}
          >
            <ProfileEmptyState
              icon={<BookmarkBorderIcon sx={{ fontSize: 44 }} />}
              title="No saved memes"
              subtitle={
                isOwnProfile
                  ? "Memes you save will appear here"
                  : "This user hasn't saved any memes yet"
              }
            />
          </Box>

          {/* Panel 2 — Collections */}
          <Box
            onScroll={(e) =>
              tab === 2 && onContentScroll?.(e.currentTarget.scrollTop)
            }
            sx={panelSx}
          >
            <ProfileEmptyState
              icon={<CollectionsOutlinedIcon sx={{ fontSize: 44 }} />}
              title="No collections yet"
              subtitle={
                isOwnProfile
                  ? "Create collections to organize your favorite memes"
                  : "This user hasn't created any collections yet"
              }
            />
          </Box>

          {/* Panel 3 — About */}
          <Box
            onScroll={(e) =>
              tab === 3 && onContentScroll?.(e.currentTarget.scrollTop)
            }
            sx={panelSx}
          >
            <ProfileAboutTab profile={profile} isOwnProfile={isOwnProfile} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
