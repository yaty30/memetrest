import { Stack } from "@mui/material";
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
    <Stack spacing={1.5}>
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
    </Stack>
  );
}
