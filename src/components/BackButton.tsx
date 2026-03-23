import { ArrowLeft } from "lucide-react";
import "./BackButton.css";

interface BackButtonProps {
  onClick?: () => void;
}

export default function BackButton({ onClick }: BackButtonProps) {
  return (
    <button className="back-button" onClick={onClick} aria-label="Go back">
      <ArrowLeft size={20} strokeWidth={2} />
    </button>
  );
}
