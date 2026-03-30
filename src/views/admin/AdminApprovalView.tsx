import { useMemo, useState } from "react";
import { Alert, Box, Snackbar, Stack } from "@mui/material";
import {
  usePendingApprovalQueue,
  type PendingApprovalItem,
} from "../../hooks/usePendingApprovalQueue";
import {
  approveUploadAsset,
  rejectUploadAsset,
} from "../../services/uploadPipelineService";
import ApprovalDetailsModal from "../../components/admin/ApprovalDetailsModal";
import PendingApprovalList from "../../components/admin/PendingApprovalList";
import ApprovalToolbar from "../../components/admin/ApprovalToolbar";
import {
  ApprovalEmptyState,
  ApprovalErrorState,
  ApprovalLoadingState,
} from "../../components/admin/ApprovalStates";
import type {
  ApprovalAction,
  ApprovalRiskFilter,
  ApprovalSortOption,
  ApprovalTypeFilter,
} from "../../components/admin/approvalTypes";

function isGifItem(item: PendingApprovalItem): boolean {
  return (
    item.asset.isAnimated ||
    item.asset.kind === "gif" ||
    item.asset.mimeType.toLowerCase() === "image/gif"
  );
}

export default function AdminApprovalView() {
  const { items, loading, error } = usePendingApprovalQueue();
  const [searchValue, setSearchValue] = useState("");
  const [typeFilter, setTypeFilter] = useState<ApprovalTypeFilter>("all");
  const [riskFilter, setRiskFilter] = useState<ApprovalRiskFilter>("all");
  const [sortBy, setSortBy] = useState<ApprovalSortOption>("newest");
  const [busyById, setBusyById] = useState<
    Record<string, ApprovalAction | null>
  >({});
  const [removedIds, setRemovedIds] = useState<Record<string, true>>({});
  const [selectedItem, setSelectedItem] = useState<PendingApprovalItem | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const remainingQueue = useMemo(
    () => items.filter((item) => !removedIds[item.id]),
    [items, removedIds],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    const filtered = remainingQueue.filter((item) => {
      if (typeFilter === "gifs" && !isGifItem(item)) return false;
      if (typeFilter === "images" && isGifItem(item)) return false;

      if (
        riskFilter === "flagged" &&
        !item.asset.moderation.userSensitiveFlag
      ) {
        return false;
      }
      if (
        riskFilter === "borderline_or_explicit" &&
        item.asset.moderation.scanResult !== "borderline" &&
        item.asset.moderation.scanResult !== "explicit"
      ) {
        return false;
      }

      if (!normalizedQuery) return true;
      const haystack = [
        item.asset.id,
        item.asset.title,
        item.uploader.displayName,
        item.uploader.username ?? "",
        ...item.asset.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    filtered.sort((a, b) => {
      if (sortBy === "oldest") return a.asset.createdAt - b.asset.createdAt;
      if (sortBy === "largest") return b.asset.fileSize - a.asset.fileSize;
      return b.asset.createdAt - a.asset.createdAt;
    });

    return filtered;
  }, [remainingQueue, riskFilter, searchValue, sortBy, typeFilter]);

  const runAction = async (
    item: PendingApprovalItem,
    action: ApprovalAction,
    reason?: string | null,
  ) => {
    setActionError(null);
    setActionSuccess(null);
    setBusyById((prev) => ({ ...prev, [item.id]: action }));

    try {
      if (action === "approve") {
        const result = await approveUploadAsset({ assetId: item.id });
        if (!result.approved) {
          throw new Error("Approval did not complete.");
        }
        setActionSuccess("Asset approved.");
      } else {
        const result = await rejectUploadAsset({
          assetId: item.id,
          reason: reason ?? null,
        });
        if (!result.rejected) {
          throw new Error("Rejection did not complete.");
        }
        setActionSuccess("Asset rejected.");
      }

      setRemovedIds((prev) => ({ ...prev, [item.id]: true }));
      setSelectedItem((current) => (current?.id === item.id ? null : current));
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "Moderation action failed.";
      if (
        action === "reject" &&
        message.toLowerCase().includes("functions/not-found")
      ) {
        setActionError(
          "rejectUploadAsset callable is not deployed yet. UI integration is ready.",
        );
      } else {
        setActionError(message);
      }
    } finally {
      setBusyById((prev) => ({ ...prev, [item.id]: null }));
    }
  };

  return (
    <>
      <Stack spacing={1.5} sx={{ minHeight: 0 }}>
        <ApprovalToolbar
          pendingCount={remainingQueue.length}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          riskFilter={riskFilter}
          onRiskFilterChange={setRiskFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />

        <Box
          className="gallery-scroll"
          sx={{
            maxHeight: "calc(100vh - 300px)",
            minHeight: 200,
          }}
        >
          {loading ? (
            <ApprovalLoadingState />
          ) : error ? (
            <ApprovalErrorState message={error} />
          ) : filteredItems.length === 0 ? (
            <ApprovalEmptyState />
          ) : (
            <PendingApprovalList
              items={filteredItems}
              busyById={busyById}
              onApprove={(item) => void runAction(item, "approve")}
              onReject={(item) => void runAction(item, "reject")}
              onViewDetails={setSelectedItem}
            />
          )}
        </Box>
      </Stack>

      <ApprovalDetailsModal
        open={Boolean(selectedItem)}
        item={selectedItem}
        busyAction={selectedItem ? (busyById[selectedItem.id] ?? null) : null}
        onClose={() => setSelectedItem(null)}
        onApprove={(item) => void runAction(item, "approve")}
        onReject={(item, reason) => void runAction(item, "reject", reason)}
      />

      <Snackbar
        open={Boolean(actionError)}
        autoHideDuration={5000}
        onClose={() => setActionError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(actionSuccess)}
        autoHideDuration={3500}
        onClose={() => setActionSuccess(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setActionSuccess(null)}>
          {actionSuccess}
        </Alert>
      </Snackbar>
    </>
  );
}
