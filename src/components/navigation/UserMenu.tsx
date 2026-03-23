import { useState } from "react";
import {
  Stack,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  ButtonBase,
  Box,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutIcon from "@mui/icons-material/Logout";

const MENU_ITEMS = [
  { label: "Profile", icon: <PersonOutlineIcon fontSize="small" /> },
  { label: "Favorites", icon: <FavoriteBorderIcon fontSize="small" /> },
  { label: "Settings", icon: <SettingsOutlinedIcon fontSize="small" /> },
  { label: "Logout", icon: <LogoutIcon fontSize="small" />, divider: true },
] as const;

export default function UserMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchorEl(e.currentTarget)}
        disableRipple
        sx={{
          borderRadius: "999px",
          px: 1.2,
          py: 0.5,
          "&:hover": { backgroundColor: "rgba(124,58,237,0.04)" },
          transition: "all 0.2s ease",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                fontSize: "0.8rem",
                fontWeight: 700,
                bgcolor: "#EDE9FE",
                color: "#7C3AED",
              }}
            >
              TG
            </Avatar>
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#22C55E",
                border: "2px solid #fff",
              }}
            />
          </Box>

          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "0.8125rem",
              color: "#1A1625",
              display: { xs: "none", sm: "block" },
            }}
          >
            Tiffany
          </Typography>

          <KeyboardArrowDownIcon
            sx={{
              fontSize: 16,
              color: "#9CA3AF",
              transition: "transform 0.2s ease",
              transform: open ? "rotate(180deg)" : "none",
            }}
          />
        </Stack>
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              minWidth: 180,
              py: 0.5,
            },
          },
        }}
      >
        {MENU_ITEMS.map((item, idx) => (
          <MenuItem
            key={item.label}
            onClick={() => setAnchorEl(null)}
            sx={{
              py: 1.2,
              px: 2,
              fontSize: "0.875rem",
              ...(idx === MENU_ITEMS.length - 1 && {
                mt: 0.5,
                borderTop: "1px solid",
                borderColor: "divider",
                color: "error.main",
              }),
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 32,
                ...(idx === MENU_ITEMS.length - 1 && { color: "error.main" }),
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 500 }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
