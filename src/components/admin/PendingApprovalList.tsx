import { Box } from "@mui/material";
import type { PendingApprovalItem } from "../../hooks/usePendingApprovalQueue";
import type { ApprovalAction } from "./approvalTypes";
import PendingApprovalCard from "./PendingApprovalCard";

interface PendingApprovalListProps {
  items: PendingApprovalItem[];
  busyById: Record<string, ApprovalAction | null>;
  onApprove: (item: PendingApprovalItem) => void;
  onReject: (item: PendingApprovalItem) => void;
  onViewDetails: (item: PendingApprovalItem) => void;
}

export default function PendingApprovalList({
  items,
  busyById,
  onApprove,
  onReject,
  onViewDetails,
}: PendingApprovalListProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
        },
        gap: 2,
      }}
    >
      {items.map((item) => (
        <PendingApprovalCard
          key={item.id}
          item={item}
          busyAction={busyById[item.id] ?? null}
          onApprove={onApprove}
          onReject={onReject}
          onViewDetails={onViewDetails}
        />
      ))}
    </Box>
  );
}
