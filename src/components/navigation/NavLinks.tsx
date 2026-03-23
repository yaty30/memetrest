import { useState } from "react";
import { Stack, Button, Menu, MenuItem, Typography } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

interface NavItem {
  label: string;
  hasDropdown?: boolean;
  active?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "About us" },
  { label: "Use cases", hasDropdown: true, active: true },
  { label: "Resources", hasDropdown: true },
  { label: "Pricing" },
  { label: "Contacts" },
];

const INACTIVE_COLOR = "#4B4459";
const ACTIVE_BG = "rgba(124, 58, 237, 0.08)";
const ACTIVE_COLOR = "#7C3AED";
const HOVER_BG = "rgba(124, 58, 237, 0.04)";

interface NavLinksProps {
  direction?: "row" | "column";
  onItemClick?: () => void;
}

export default function NavLinks({
  direction = "row",
  onItemClick,
}: NavLinksProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleDropdownOpen = (
    event: React.MouseEvent<HTMLElement>,
    label: string,
  ) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu(label);
  };

  const handleDropdownClose = () => {
    setAnchorEl(null);
    setOpenMenu(null);
  };

  return (
    <Stack direction={direction} alignItems="center" spacing={0.5}>
      {NAV_ITEMS.map((item) => (
        <div key={item.label}>
          <Button
            disableRipple
            onClick={(e) => {
              if (item.hasDropdown) {
                handleDropdownOpen(e, item.label);
              }
              onItemClick?.();
            }}
            endIcon={
              item.hasDropdown ? (
                <KeyboardArrowDownIcon
                  sx={{
                    fontSize: "18px !important",
                    transition: "transform 0.2s",
                    transform:
                      openMenu === item.label ? "rotate(180deg)" : "none",
                  }}
                />
              ) : undefined
            }
            sx={{
              px: 2,
              py: 0.7,
              borderRadius: "999px",
              fontWeight: item.active ? 600 : 500,
              fontSize: "0.8125rem",
              textTransform: "none",
              whiteSpace: "nowrap",
              color: item.active ? ACTIVE_COLOR : INACTIVE_COLOR,
              backgroundColor: item.active ? ACTIVE_BG : "transparent",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: item.active ? ACTIVE_BG : HOVER_BG,
                color: item.active ? ACTIVE_COLOR : "#1A1625",
              },
              minWidth: "auto",
            }}
          >
            {item.label}
          </Button>

          {item.hasDropdown && (
            <Menu
              anchorEl={anchorEl}
              open={openMenu === item.label}
              onClose={handleDropdownClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
              transformOrigin={{ vertical: "top", horizontal: "center" }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    minWidth: 160,
                  },
                },
              }}
            >
              {["Option 1", "Option 2", "Option 3"].map((opt) => (
                <MenuItem
                  key={opt}
                  onClick={handleDropdownClose}
                  sx={{ fontSize: "0.875rem", fontWeight: 500, py: 1 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {opt}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          )}
        </div>
      ))}
    </Stack>
  );
}
