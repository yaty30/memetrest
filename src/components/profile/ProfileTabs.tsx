import { useRef, useState } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (_: React.SyntheticEvent, newTab: number) => {
    setTab(newTab);
    // Reset header collapse when switching tabs so user sees expanded header
    onContentScroll?.(0);
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

      {/* Content panel */}
      <Box
        ref={scrollRef}
        onScroll={(event) => onContentScroll?.(event.currentTarget.scrollTop)}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          px: { xs: 2, sm: 3, md: 5 },
          py: { xs: 3, sm: 4 },
          pb: "max(24px, env(safe-area-inset-bottom))",
        }}
      >
        {tab === 0 && (
          <ProfileUploadsTab
            ownerUid={profile.uid}
            isOwnProfile={isOwnProfile}
            scrollRoot={scrollRef.current}
          />
        )}
        {tab === 1 && (
          <ProfileEmptyState
            icon={<BookmarkBorderIcon sx={{ fontSize: 44 }} />}
            title="No saved memes"
            subtitle={
              isOwnProfile
                ? "Memes you save will appear here"
                : "This user hasn't saved any memes yet"
            }
          />
        )}
        {tab === 2 && (
          <ProfileEmptyState
            icon={<CollectionsOutlinedIcon sx={{ fontSize: 44 }} />}
            title="No collections yet"
            subtitle={
              isOwnProfile
                ? "Create collections to organize your favorite memes"
                : "This user hasn't created any collections yet"
            }
          />
        )}
        {tab === 3 && (
          <ProfileAboutTab profile={profile} isOwnProfile={isOwnProfile} />
        )}
      </Box>
    </Box>
  );
}
