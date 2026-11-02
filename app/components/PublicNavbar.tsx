import { ArrowRight, Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import Brand from "./Brand";
import ThemeToggle from "./ThemeToggle";

const PublicNavbar = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const navigation = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const navigationId = useId();

  useEffect(() => {
    if (!open) return;
    navigation.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const onOutside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (desktop.matches) setOpen(false); };
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("keydown", onEscape);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("keydown", onEscape);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  const close = () => {
    if (open) {
      setOpen(false);
      trigger.current?.focus();
    }
  };

  return (
    <header
      ref={header}
      className="public-header page-container"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Brand />
      <div ref={navigation} id={navigationId} className="public-navigation" data-open={open}>
        <nav className="public-links" aria-label="Main navigation">
          <a href="#sample-review" className="demo-nav-link" onClick={close}>Demo</a>
          <a href="#features" onClick={close}>What you get</a>
          <a href="#how-it-works" onClick={close}>How it works</a>
        </nav>
        <div className="public-auth-actions">
          <Link className="text-button" to={isAuthenticated ? "/dashboard" : "/auth"} onClick={close}>{isAuthenticated ? "My reviews" : "Log In"}</Link>
          <Link className="primary-button" to={isAuthenticated ? "/upload" : "/auth?next=/upload"} onClick={close}>Get started <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="public-header-controls">
        <ThemeToggle />
        <button ref={trigger} type="button" className="icon-button public-menu-trigger" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls={navigationId} onClick={() => setOpen(!open)}>
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
};

export default PublicNavbar;
