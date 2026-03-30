import { Alert, Box, CircularProgress, Typography } from "@mui/material";

export function ApprovalLoadingState() {
  return (
    <Box
      sx={{
        py: 8,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <CircularProgress size={28} />
    </Box>
  );
}

export function ApprovalErrorState({ message }: { message: string }) {
  return <Alert severity="error">{message}</Alert>;
}

export function ApprovalEmptyState() {
  return (
    <Box
      sx={(theme) => ({
        border: `1px dashed ${theme.palette.divider}`,
        borderRadius: "12px",
        p: 3,
        textAlign: "center",
      })}
    >
      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Queue is clear</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: "0.8125rem" }}>
        There are no pending uploads to review right now.
      </Typography>
    </Box>
  );
}

