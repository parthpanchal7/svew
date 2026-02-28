import brandLogo from '../assets/logo_svew.png';
export default function BrandLogo({ size = 42, compact = false }) {
  return (
    <div
      className={`brand-logo ${compact ? "brand-logo-compact" : ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span>
        <img src={brandLogo} alt="Logo" />
      </span>
    </div>
  );
}
