import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      className="back-to-top"
      href="#top"
      hidden={!visible}
      onClick={(event) => {
        event.preventDefault();
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById("main-content")?.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" });
      }}
    >
      <ArrowUp size={16} aria-hidden="true" /> Back to top
    </a>
  );
};

export default BackToTop;
