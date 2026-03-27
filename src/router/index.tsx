import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import ImageViewerPage from "../pages/ImageViewerPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/meme/:id" element={<ImageViewerPage />} />
    </Routes>
  );
}
