import { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { UserProfile } from "../../types/user";
import {
  DISPLAY_NAME_MAX_LENGTH,
  BIO_MAX_LENGTH,
  BIO_MAX_LINE_BREAKS,
} from "../../types/user";
import { updateProfile } from "../../services/profileService";
import { useAppDispatch } from "../../store/hooks";
import { patchCurrentUserProfile } from "../../store/currentUserProfileSlice";

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaved?: () => void;
}

export default function EditProfileDialog({
  open,
  onClose,
  profile,
  onSaved,
}: EditProfileDialogProps) {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // ── Form state ──
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);

  // ── Save state ──
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Validation ──
  const nameError =
    displayName.trim().length === 0
      ? "Display name is required"
      : displayName.trim().length > DISPLAY_NAME_MAX_LENGTH
        ? `Max ${DISPLAY_NAME_MAX_LENGTH} characters`
        : null;

  const bioLineBreaks = (bio.match(/\n/g) || []).length;
  const bioError =
    bio.length > BIO_MAX_LENGTH
      ? `Max ${BIO_MAX_LENGTH} characters`
      : bioLineBreaks > BIO_MAX_LINE_BREAKS
        ? `Max ${BIO_MAX_LINE_BREAKS} line breaks`
        : null;

  const canSave = !nameError && !bioError && !saving;

  // ── Handlers ──
  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);

    try {
      const nextDisplayName = displayName.trim();
      const nextBio = bio.trim();

      await updateProfile(profile.uid, {
        displayName: nextDisplayName,
        bio: nextBio,
      });

      dispatch(
        patchCurrentUserProfile({
          uid: profile.uid,
          patch: {
            displayName: nextDisplayName,
            bio: nextBio,
            profileUpdatedAt: new Date(),
          },
        }),
      );

      onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }, [profile.uid, displayName, bio, dispatch, onSaved, onClose, canSave]);

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "background.paper",
          backgroundImage: "none",
          maxHeight: fullScreen ? "100%" : "90vh",
        },
      }}
    >
      {/* ── Title bar ── */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          pr: 1.5,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
          Edit Profile
        </Typography>
        <IconButton
          onClick={onClose}
          disabled={saving}
          size="small"
          aria-label="Close"
          sx={{ color: "text.secondary" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2, overflowY: "auto" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* ── Display Name ── */}
        <TextField
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={!!nameError}
          helperText={
            nameError ??
            `${displayName.trim().length}/${DISPLAY_NAME_MAX_LENGTH}`
          }
          fullWidth
          size="small"
          disabled={saving}
          slotProps={{ htmlInput: { maxLength: DISPLAY_NAME_MAX_LENGTH + 10 } }}
          sx={{ mb: 2.5 }}
        />

        {/* ── Bio ── */}
        <TextField
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          error={!!bioError}
          helperText={bioError ?? `${bio.length}/${BIO_MAX_LENGTH}`}
          fullWidth
          multiline
          minRows={2}
          maxRows={5}
          size="small"
          disabled={saving}
          slotProps={{ htmlInput: { maxLength: BIO_MAX_LENGTH + 10 } }}
          sx={{ mb: 2.5 }}
        />
      </DialogContent>

      <Divider />

      {/* ── Actions ── */}
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 1.5 }}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "text.secondary",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!canSave}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "999px",
            px: 3,
            minWidth: 80,
          }}
        >
          {saving ? <CircularProgress size={20} color="inherit" /> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
