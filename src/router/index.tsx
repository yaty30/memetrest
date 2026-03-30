import { Routes, Route, useLocation } from "react-router-dom";
import HomePage from "../pages/HomePage";
import ImageViewerPage from "../pages/ImageViewerPage";
import MyUploadsPage from "../pages/MyUploadsPage";
import ProfilePage from "../pages/ProfilePage";
import UploadPage from "../pages/UploadPage";

function RoutedProfilePage() {
  const location = useLocation();
  return <ProfilePage key={location.pathname} />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/meme/:id" element={<ImageViewerPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/my-uploads" element={<MyUploadsPage />} />
      <Route path="/profile" element={<RoutedProfilePage />} />
      <Route path="/u/:username" element={<RoutedProfilePage />} />
    </Routes>
  );
}
