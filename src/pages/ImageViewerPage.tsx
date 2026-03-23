import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ImageViewerView from "../views/ImageViewerView";
import { memeService } from "../services";
import "./ImageViewerPage.css";

export default function ImageViewerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<{
    imageUrl: string;
    title: string;
    overlay?: { name: string } | null;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    memeService.getMemeById(id).then((item) => {
      if (item) {
        setImageData({
          imageUrl: item.image,
          title: item.title,
          overlay: item.overlay,
        });
      } else {
        setNotFound(true);
      }
    });
  }, [id]);

  if (notFound) {
    return (
      <div className="image-viewer-page">
        <p>Image not found</p>
      </div>
    );
  }

  if (!imageData) {
    return (
      <div className="image-viewer-page">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="image-viewer-page">
      <ImageViewerView
        imageSrc={imageData.imageUrl}
        title={imageData.title}
        subtitle={imageData.overlay?.name ?? ""}
        onBack={() => navigate(-1)}
      />
    </div>
  );
}
