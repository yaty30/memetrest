import { Navigate, useNavigate } from "react-router-dom";
import AppPageShell from "../components/AppPageShell";
import UploadAssetView from "../views/UploadAssetView";
import { useAuth } from "../providers/AuthProvider";

export default function UploadPage() {
  const navigate = useNavigate();
  const { firebaseUser, loading } = useAuth();

  if (!loading && !firebaseUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppPageShell
      onBack={() => navigate(-1)}
      title="Upload"
      subtitle="Upload a new asset"
    >
      <UploadAssetView />
    </AppPageShell>
  );
}
