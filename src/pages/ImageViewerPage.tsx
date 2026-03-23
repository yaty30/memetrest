import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import ImageViewerView from "../views/ImageViewerView";
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
    getDoc(doc(db, "memes", id)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setImageData({
          imageUrl: data.imageUrl,
          title: data.title,
          overlay: data.overlay,
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
