import { Link } from "react-router";

const Brand = ({ to = "/" }: { to?: string }) => (
  <Link
    to={to}
    className="brand-link"
    aria-label={to === "/dashboard" ? "Resumind dashboard" : "Resumind home"}
  >
    <span className="brand-wordmark text-2xl font-bold text-gradient">RESUMIND</span>
  </Link>
);

export default Brand;
