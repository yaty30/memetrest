import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import ImageViewerPage from "../pages/ImageViewerPage";
import ProfilePage from "../pages/ProfilePage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/meme/:id" element={<ImageViewerPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/u/:username" element={<ProfilePage />} />
    </Routes>
  );
}
