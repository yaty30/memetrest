import logoSrc from "../assets/logo.png";

interface LogoProps {
  size?: number;
}

const Logo = ({ size = 36 }: LogoProps) => (
  <img
    src={logoSrc}
    alt="memetrest"
    width={size}
    height={size}
    draggable={false}
    onContextMenu={(e) => e.preventDefault()}
    style={{
      objectFit: "cover",
      filter: "grayscale(100%) brightness(70%)",
      display: "block",
      flexShrink: 0,
    }}
  />
);
export default Logo;
