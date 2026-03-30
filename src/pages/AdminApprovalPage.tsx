import { Navigate, useNavigate } from "react-router-dom";
import AppPageShell from "../components/AppPageShell";
import { useAuth } from "../providers/AuthProvider";
import { useAppSelector } from "../store/hooks";
import AdminApprovalView from "../views/admin/AdminApprovalView";

export default function AdminApprovalPage() {
  const navigate = useNavigate();
  const { firebaseUser, loading: authLoading } = useAuth();
  const { profile, status } = useAppSelector((state) => state.currentUserProfile);

  const profileLoading = status === "idle" || status === "loading";

  if (!authLoading && !firebaseUser) {
    return <Navigate to="/" replace />;
  }

  if (!authLoading && !profileLoading && profile?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <AppPageShell
      onBack={() => navigate(-1)}
      title="Pending Approvals"
      subtitle="Review and moderate incoming uploads"
    >
      <AdminApprovalView />
    </AppPageShell>
  );
}
