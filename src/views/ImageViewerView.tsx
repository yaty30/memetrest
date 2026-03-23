import ImageHeaderOverlay from "../components/ImageHeaderOverlay";
import ImageActionBar from "../components/ImageActionBar";
import "./ImageViewerView.css";

interface ImageViewerViewProps {
  imageSrc: string;
  title: string;
  subtitle: string;
  onBack?: () => void;
}

export default function ImageViewerView({
  imageSrc,
  title,
  subtitle,
  onBack,
}: ImageViewerViewProps) {
  return (
    <div className="viewer-card">
      <div className="viewer-image-container">
        <img className="viewer-image" src={imageSrc} alt={title} />
        <ImageHeaderOverlay title={title} subtitle={subtitle} onBack={onBack} />
      </div>
      <ImageActionBar />
    </div>
  );
}
