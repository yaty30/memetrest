import BackButton from "./BackButton";
import "./ImageHeaderOverlay.css";

interface ImageHeaderOverlayProps {
  title: string;
  subtitle: string;
  onBack?: () => void;
}

export default function ImageHeaderOverlay({
  title,
  subtitle,
  onBack,
}: ImageHeaderOverlayProps) {
  return (
    <div className="image-header-overlay">
      <BackButton onClick={onBack} />
      <div className="image-header-text">
        <span className="image-header-title">{title}</span>
        <span className="image-header-subtitle">{subtitle}</span>
      </div>
    </div>
  );
}
