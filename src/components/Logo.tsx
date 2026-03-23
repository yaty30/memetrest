import logoSrc from "../assets/logo.jpg";

interface LogoProps {
  size?: number;
}

const Logo = ({ size = 36 }: LogoProps) => (
  <img
    src={logoSrc}
    alt="memetrest"
    width={size}
    height={size}
    style={{
      borderRadius: "50%",
      objectFit: "cover",
      display: "block",
      flexShrink: 0,
    }}
  />
);
export default Logo;
