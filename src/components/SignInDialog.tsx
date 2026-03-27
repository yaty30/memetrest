import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Button,
  TextField,
  Typography,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GoogleIcon from "@mui/icons-material/Google";
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
} from "../services/authService";

interface SignInDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SignInDialog({ open, onClose }: SignInDialogProps) {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    setMode("signin");
    onClose();
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        await registerWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", pb: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
          {mode === "signin" ? "Sign In" : "Create Account"}
        </Typography>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Google sign-in */}
          <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogle}
            disabled={loading}
            fullWidth
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "12px",
              py: 1.2,
            }}
          >
            Continue with Google
          </Button>

          <Divider>
            <Typography variant="caption" color="text.secondary">
              or
            </Typography>
          </Divider>

          {/* Email/Password form */}
          <form onSubmit={handleEmailSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                size="small"
                autoComplete="email"
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                size="small"
                inputProps={{ minLength: 6 }}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                fullWidth
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "12px",
                  py: 1.2,
                }}
              >
                {loading ? (
                  <CircularProgress size={22} />
                ) : mode === "signin" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </Stack>
          </form>

          {/* Toggle mode */}
          <Typography variant="body2" align="center" color="text.secondary">
            {mode === "signin"
              ? "Don't have an account? "
              : "Already have an account? "}
            <Typography
              component="span"
              variant="body2"
              color="primary"
              sx={{ cursor: "pointer", fontWeight: 600 }}
              onClick={() => {
                setMode(mode === "signin" ? "register" : "signin");
                setError(null);
              }}
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </Typography>
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
