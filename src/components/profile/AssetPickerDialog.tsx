import { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type {
  UserProfile,
  ProfileAsset,
  ProfileAssetRef,
  ProfileAssetKind,
} from "../../types/user";
import { updateProfile } from "../../services/profileService";
import { usePresetAssets } from "../../hooks/usePresetAssets";
import AssetPicker from "./AssetPicker";

interface AssetPickerDialogProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  kind: ProfileAssetKind;
  onSaved: () => void;
}

function toAssetRef(asset: ProfileAsset): ProfileAssetRef {
  return {
    assetId: asset.id,
    url: asset.url,
    kind: asset.kind,
    ownership: asset.ownership,
  };
}

const TITLES: Record<ProfileAssetKind, string> = {
  avatar: "Choose Avatar",
  banner: "Choose Banner",
};

export default function AssetPickerDialog({
  open,
  onClose,
  profile,
  kind,
  onSaved,
}: AssetPickerDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const currentRef = kind === "avatar" ? profile.avatar : profile.banner;
  const [selected, setSelected] = useState<ProfileAssetRef>(currentRef);
  const { assets, loading: assetsLoading } = usePresetAssets(kind);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanged = selected.assetId !== currentRef.assetId;

  const handleSelect = useCallback((asset: ProfileAsset) => {
    setSelected(toAssetRef(asset));
  }, []);

  const handleSave = useCallback(async () => {
    if (!hasChanged || saving) return;
    setSaving(true);
    setError(null);

    try {
      await updateProfile(profile.uid, { [kind]: selected });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [hasChanged, saving, profile.uid, kind, selected, onSaved, onClose]);

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
        },
      }}
    >
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
          {TITLES[kind]}
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

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <AssetPicker
          assets={assets}
          loading={assetsLoading}
          selectedId={selected.assetId}
          onSelect={handleSelect}
          kind={kind}
        />
      </DialogContent>

      <Divider />

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
          disabled={!hasChanged || saving}
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
