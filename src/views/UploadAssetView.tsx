import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useNavigate } from "react-router-dom";
import type { UploadAssetVisibility } from "../types/upload";
import { validateMemeFile } from "../services/uploadValidation";
import { uploadAssetThroughBackend } from "../services/uploadPipelineService";
import { useCanUpload } from "../hooks/useCanUpload";

function deriveTitleFromFileName(name: string): string {
  const noExt = name.replace(/\.[^.]+$/, "").trim();
  return noExt || "Untitled Upload";
}

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);
}

function mergeTags(current: string[], value: string): string[] {
  const incoming = splitTags(value);
  if (incoming.length === 0) return current;
  const deduped = new Set(current);
  for (const tag of incoming) deduped.add(tag);
  return Array.from(deduped);
}

export default function UploadAssetView() {
  const navigate = useNavigate();
  const uploadPermission = useCanUpload();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [source, setSource] = useState("");
  const [visibility, setVisibility] =
    useState<UploadAssetVisibility>("private");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const canSubmit = useMemo(
    () =>
      !submitting &&
      uploadPermission.allowed &&
      Boolean(file) &&
      name.trim().length > 0,
    [file, name, submitting, uploadPermission.allowed],
  );

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const commitTagInput = () => {
    const next = mergeTags(tags, tagInput);
    if (next.length === tags.length) {
      setTagInput("");
      return;
    }

    setTags(next);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((current) => current.filter((tag) => tag !== tagToRemove));
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = "";

    setError(null);
    setSuccess(null);

    if (!selected) return;
    const validation = validateMemeFile(selected);
    if (!validation.valid) {
      setFile(null);
      setError(validation.error ?? "Invalid image selected.");
      return;
    }

    setFile(selected);
    setName((current) =>
      current.trim().length > 0
        ? current
        : deriveTitleFromFileName(selected.name),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !file) return;
    const tagsForSubmit = mergeTags(tags, tagInput);
    setTags(tagsForSubmit);
    setTagInput("");

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await uploadAssetThroughBackend(file, {
        title: name.trim(),
        source: source.trim() || null,
        tags: tagsForSubmit,
        visibility,
      });

      setSuccess(`Upload accepted (${result.status}/${result.visibility}).`);
      setFile(null);
      setName("");
      setTagInput("");
      setTags([]);
      setSource("");
      setVisibility("private");
      navigate("/my-uploads");
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Upload failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          pr: 0.25,
          pb: "max(20px, env(safe-area-inset-bottom))",
        }}
      >
        <Box
          sx={(theme) => ({
            borderRadius: "14px",
            border: `1px solid ${theme.palette.divider}`,
            p: { xs: 2, sm: 2.5 },
          })}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(0, 1.3fr) minmax(0, 1fr)",
              },
              gap: 2,
            }}
          >
            <Box
              onClick={handleChooseFile}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleChooseFile();
                }
              }}
              sx={(theme) => ({
                width: "100%",
                aspectRatio: "4 / 3",
                borderRadius: "12px",
                border: `1px dashed ${theme.palette.divider}`,
                bgcolor: "surface.input",
                overflow: "hidden",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "surface.inputHover",
                },
              })}
            >
              {previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt={name.trim() || "Upload preview"}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    bgcolor: "rgba(0,0,0,0.25)",
                  }}
                />
              ) : (
                <Stack spacing={0.5} sx={{ textAlign: "center", px: 2 }}>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    Click to upload image
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.75rem", color: "text.secondary" }}
                  >
                    JPEG, PNG, WebP, GIF
                  </Typography>
                </Stack>
              )}
            </Box>

            <Stack spacing={2.25}>
              <Box>
                <Typography
                  component="label"
                  sx={{
                    display: "block",
                    mb: 0.75,
                    fontSize: "0.75rem",
                    color: "text.secondary",
                  }}
                >
                  Visibility
                </Typography>
                <Tabs
                  value={visibility}
                  onChange={(_event, next: UploadAssetVisibility) =>
                    setVisibility(next)
                  }
                  variant="fullWidth"
                  sx={(theme) => ({
                    minHeight: 36,
                    borderRadius: "10px",
                    bgcolor: "surface.input",
                    border: `1px solid ${theme.palette.divider}`,
                    "& .MuiTab-root": {
                      minHeight: 34,
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      textTransform: "none",
                    },
                    "& .MuiTabs-indicator": {
                      height: "100%",
                      borderRadius: "8px",
                      backgroundColor: theme.palette.action.hover,
                      zIndex: 0,
                    },
                    "& .MuiTabs-flexContainer": {
                      position: "relative",
                      zIndex: 1,
                    },
                  })}
                >
                  <Tab value="private" label="Private" />
                  <Tab value="public" label="Public" />
                </Tabs>
              </Box>
              <TextField
                label="Name"
                value={name}
                required
                onChange={(event) => setName(event.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                label="Source"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                size="small"
                fullWidth
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" },
                  gap: 1.25,
                  alignItems: "center",
                }}
              >
                <TextField
                  label="Tags"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onBlur={commitTagInput}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      commitTagInput();
                    }
                  }}
                  size="small"
                  fullWidth
                  placeholder="funny, reaction, classic"
                />
                <Tooltip
                  title="Add a tag and press Enter, or paste multiple tags separated by commas."
                  arrow
                  placement="top"
                >
                  <IconButton
                    size="small"
                    aria-label="Tag input help"
                    sx={{
                      justifySelf: { xs: "start", sm: "end" },
                      color: "text.secondary",
                    }}
                  >
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              {tags.length > 0 && (
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onDelete={() => handleRemoveTag(tag)}
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={!canSubmit}
            sx={{ mt: 2 }}
          >
            {submitting
              ? "Submitting..."
              : visibility === "public"
                ? "Upload and submit for review"
                : "Upload privately"}
          </Button>
        </Box>

        {!uploadPermission.allowed && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {uploadPermission.reason ?? "You cannot upload right now."}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </Box>
    </Box>
  );
}
