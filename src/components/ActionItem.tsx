import type { LucideIcon } from "lucide-react";
import "./ActionItem.css";

interface ActionItemProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

export default function ActionItem({
  icon: Icon,
  label,
  onClick,
}: ActionItemProps) {
  return (
    <button className="action-item" onClick={onClick} aria-label={label}>
      <Icon size={22} strokeWidth={1.6} />
      <span className="action-item-label">{label}</span>
    </button>
  );
}
