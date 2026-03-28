import { Typography, Stack } from "@mui/material";

interface ProfileEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function ProfileEmptyState({
  icon,
  title,
  subtitle,
}: ProfileEmptyStateProps) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{
        py: { xs: 8, sm: 10, md: 12 },
        color: "text.disabled",
        opacity: 0.85,
      }}
    >
      {icon}
      <Typography sx={{ fontWeight: 600, fontSize: "1rem" }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography
          sx={{
            fontSize: "0.8125rem",
            color: "text.disabled",
            maxWidth: 380,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Stack>
  );
}
