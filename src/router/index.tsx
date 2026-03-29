import { Routes, Route, useLocation } from "react-router-dom";
import HomePage from "../pages/HomePage";
import ImageViewerPage from "../pages/ImageViewerPage";
import ProfilePage from "../pages/ProfilePage";

function RoutedProfilePage() {
  const location = useLocation();
  return <ProfilePage key={location.pathname} />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/meme/:id" element={<ImageViewerPage />} />
      <Route path="/profile" element={<RoutedProfilePage />} />
      <Route path="/u/:username" element={<RoutedProfilePage />} />
    </Routes>
  );
}
