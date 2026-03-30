import { useState } from "react";
import {
  Stack,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  ButtonBase,
  Button,
  Box,
  Alert,
  Snackbar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthProvider";
import { useAppSelector } from "../../store/hooks";
import { signOut } from "../../services/authService";
import SignInDialog from "../SignInDialog";
import { useCanUpload } from "../../hooks/useCanUpload";
import { validateMemeFile } from "../../services/uploadValidation";
import { uploadAssetThroughBackend } from "../../services/uploadPipelineService";

const MENU_ITEMS = [
  { label: "Upload", icon: <CloudUploadOutlinedIcon fontSize="small" /> },
  {
    label: "My Uploads",
    icon: <Inventory2OutlinedIcon fontSize="small" />,
  },
  { label: "Profile", icon: <PersonOutlineIcon fontSize="small" /> },
  { label: "Favorites", icon: <FavoriteBorderIcon fontSize="small" /> },
  { label: "Settings", icon: <SettingsOutlinedIcon fontSize="small" /> },
  { label: "Logout", icon: <LogoutIcon fontSize="small" />, divider: true },
] as const;

function deriveTitleFromFileName(name: string): string {
  const noExt = name.replace(/\.[^.]+$/, "").trim();
  return noExt || "Untitled Upload";
}

export default function UserMenu() {
  const { firebaseUser, loading } = useAuth();
  const uploadPermission = useCanUpload();
  const userProfile = useAppSelector(
    (state) => state.currentUserProfile.profile,
  );
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const open = Boolean(anchorEl);
  const fileInputId = "user-menu-upload-input";

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!uploadPermission.allowed) {
      setUploadError(uploadPermission.reason ?? "You cannot upload right now.");
      return;
    }

    const validation = validateMemeFile(file);
    if (!validation.valid) {
      setUploadError(validation.error ?? "Invalid file selected.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const result = await uploadAssetThroughBackend(file, {
        title: deriveTitleFromFileName(file.name),
        tags: [],
      });

      setUploadSuccess(
        `Upload accepted (${result.status}/${result.visibility}). Upload is private until separately published.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again.";
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleMenuAction = async (label: string) => {
    setAnchorEl(null);
    if (label === "Upload") {
      if (!uploadPermission.allowed) {
        setUploadError(
          uploadPermission.reason ?? "You cannot upload right now.",
        );
        return;
      }

      const input = document.getElementById(
        fileInputId,
      ) as HTMLInputElement | null;
      input?.click();
      return;
    }

    if (label === "Logout") {
      await signOut();
    } else if (label === "My Uploads") {
      navigate("/my-uploads");
    } else if (label === "Profile") {
      navigate("/profile");
    }
  };

  // Show sign-in button when not authenticated
  if (!loading && !firebaseUser) {
    return (
      <>
        <Button
          variant="outlined"
          startIcon={<LoginIcon />}
          onClick={() => setSignInOpen(true)}
          size="small"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "999px",
            px: 2,
            fontSize: "0.8125rem",
          }}
        >
          Sign In
        </Button>
        <SignInDialog open={signInOpen} onClose={() => setSignInOpen(false)} />
      </>
    );
  }

  // Loading or authenticated — show avatar menu
  const displayName =
    userProfile?.displayName || firebaseUser?.displayName || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const photoURL = userProfile?.avatar?.url || firebaseUser?.photoURL || null;

  return (
    <>
      <input
        id={fileInputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />

      <ButtonBase
        onClick={(e) => setAnchorEl(e.currentTarget)}
        disableRipple
        sx={{
          borderRadius: "999px",
          px: 1.2,
          py: 0.5,
          "&:hover": { backgroundColor: "surface.input" },
          transition: "all 0.2s ease",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={photoURL ?? undefined}
              sx={(theme) => ({
                width: 34,
                height: 34,
                fontSize: "0.8rem",
                fontWeight: 700,
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: "primary.main",
              })}
            >
              {initials || "?"}
            </Avatar>
            <Box
              sx={(theme) => ({
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "status.online",
                border: `2px solid ${theme.palette.surface.card}`,
              })}
            />
          </Box>

          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "0.8125rem",
              color: "text.primary",
              display: { xs: "none", sm: "block" },
            }}
          >
            {displayName.split(" ")[0] || "User"}
          </Typography>

          <KeyboardArrowDownIcon
            sx={{
              fontSize: 16,
              color: "text.secondary",
              transition: "transform 0.2s ease",
              transform: open ? "rotate(180deg)" : "none",
            }}
          />
        </Stack>
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: (theme) => ({
              mt: 1.5,
              borderRadius: "12px",
              boxShadow: theme.palette.customShadows.dropdown,
              minWidth: 180,
              py: 0.5,
            }),
          },
        }}
      >
        {MENU_ITEMS.map((item) => (
          <MenuItem
            key={item.label}
            onClick={() => handleMenuAction(item.label)}
            disabled={
              uploading ||
              (item.label === "Upload" && !uploadPermission.allowed)
            }
            sx={{
              py: 1.2,
              px: 2,
              fontSize: "0.875rem",
              ...(item.label === "Logout" && {
                mt: 0.5,
                borderTop: "1px solid",
                borderColor: "divider",
                color: "error.main",
              }),
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 32,
                ...(item.label === "Logout" && { color: "error.main" }),
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              secondary={
                item.label === "Upload" && !uploadPermission.allowed
                  ? uploadPermission.reason
                  : undefined
              }
              primaryTypographyProps={{
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
              secondaryTypographyProps={{
                fontSize: "0.75rem",
                lineHeight: 1.2,
              }}
            />
          </MenuItem>
        ))}
      </Menu>

      <Snackbar
        open={Boolean(uploadSuccess)}
        autoHideDuration={4000}
        onClose={() => setUploadSuccess(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setUploadSuccess(null)}>
          {uploadSuccess}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(uploadError)}
        autoHideDuration={5000}
        onClose={() => setUploadError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      </Snackbar>
    </>
  );
}
