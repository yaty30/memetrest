import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import type { UserUploadAssetListItem } from "../services/uploadPipelineService";
import "./UploadAssetCard.css";

interface UploadAssetCardProps {
  item: UserUploadAssetListItem;
  submitting: boolean;
  onSubmitForReview: (assetId: string) => void;
}

function toLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function workflowHint(status: string, visibility: string): string | null {
  if (status === "published" && visibility === "public")
    return "Published publicly.";
  if (status === "pending_review")
    return "Submitted for review. Still private.";
  if (status === "rejected") return "Rejected. Not public.";
  if (status === "uploaded" && visibility === "private") return null; // default state, no hint needed
  return null;
}

export default function UploadAssetCard({
  item,
  submitting,
  onSubmitForReview,
}: UploadAssetCardProps) {
  const preview = item.thumbnailUrl ?? item.previewUrl ?? item.originalUrl;
  const isReviewable = item.status === "uploaded";
  const hint = workflowHint(item.status, item.visibility);
  const hasDimensions = item.dimensions.width > 0 && item.dimensions.height > 0;

  return (
    <article className="upload-card">
      {/* ─── Preview ─── */}
      <div className="upload-card__preview">
        {preview ? (
          <img
            className="upload-card__preview-img"
            src={preview}
            alt={item.title || "Upload preview"}
            loading="lazy"
          />
        ) : (
          <div className="upload-card__preview-placeholder">
            <UploadFileOutlinedIcon sx={{ fontSize: 48 }} />
          </div>
        )}

        {/* ─── Status & visibility badges ─── */}
        <div className="upload-card__badges">
          <span
            className={`upload-card__badge upload-card__badge--${item.status}`}
          >
            {toLabel(item.status)}
          </span>
          <span
            className={`upload-card__badge upload-card__badge--${item.visibility}`}
          >
            {toLabel(item.visibility)}
          </span>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="upload-card__body">
        <h3 className="upload-card__title">
          {item.title || `Untitled upload (${item.id.slice(0, 8)})`}
        </h3>

        <div className="upload-card__meta">
          <span>{item.mimeType}</span>
          {hasDimensions && (
            <>
              <span className="upload-card__meta-sep" />
              <span>
                {item.dimensions.width}×{item.dimensions.height}
              </span>
            </>
          )}
          <span className="upload-card__meta-sep" />
          <span>{formatDate(item.createdAt)}</span>
        </div>

        {hint && <p className="upload-card__hint">{hint}</p>}
      </div>

      {/* ─── Actions ─── */}
      {isReviewable && (
        <div className="upload-card__actions">
          <button
            className="upload-card__submit-btn"
            type="button"
            disabled={submitting}
            onClick={() => onSubmitForReview(item.id)}
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </button>
        </div>
      )}
    </article>
  );
}
