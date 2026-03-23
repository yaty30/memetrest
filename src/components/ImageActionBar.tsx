import { Send, Star, PenLine, Trash2, MoreVertical } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ActionItem from "./ActionItem";
import "./ImageActionBar.css";

interface ActionDef {
  icon: LucideIcon;
  label: string;
}

const actions: ActionDef[] = [
  { icon: Send, label: "Send" },
  { icon: Star, label: "Favorite" },
  { icon: PenLine, label: "Edit" },
  { icon: Trash2, label: "Delete" },
  { icon: MoreVertical, label: "More" },
];

export default function ImageActionBar() {
  return (
    <div className="image-action-bar">
      {actions.map((action) => (
        <ActionItem
          key={action.label}
          icon={action.icon}
          label={action.label}
        />
      ))}
    </div>
  );
}
