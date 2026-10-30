import { Link, useNavigate } from "react-router";
import { LogOut, Upload, UserRound } from "lucide-react";
import { usePuterStore } from "~/lib/puter";
import { useState, useEffect, useId, useRef } from "react";


const NavBar = () => {
  const { auth } = usePuterStore();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (showMenu && event.key === "Escape") {
        setShowMenu(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showMenu]);
  return (
    <nav className="navbar">
      <Link to="/">
        <p className="brand-wordmark text-2xl font-bold text-gradient">RESUMIND</p>
      </Link>
      {/* <Link to="/upload" className="primary-button w-fit">
        Upload Resume
      </Link> */}
      <div className="navbar-actions">
        <Link to="/upload" className="primary-button w-fit">
          <Upload className="size-4 shrink-0" aria-hidden="true" />
          Upload Resume
        </Link>

        <div className="relative" ref={menuRef} onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setShowMenu(false);
        }}>
          <button
            ref={triggerRef}
            type="button"
            className="profile-trigger"
            onClick={() => setShowMenu((v) => !v)}
            aria-label="Profile menu"
            aria-expanded={showMenu}
            aria-controls={showMenu ? menuId : undefined}
          >
            <UserRound className="size-4 shrink-0" aria-hidden="true" />
            <span className="profile-name">{auth.user?.username}</span>
            
          </button>

            {showMenu && (
              <div
                id={menuId}
                className="profile-menu"
              >
                <div className="flex flex-col py-2">
                  
                  <button
                    type="button"
                    className="profile-logout"
                    onClick={() => {
                      auth.signOut();
                      navigate("/auth");
                    }}
                  >
                    <LogOut className="size-4 shrink-0" aria-hidden="true" />
                    Logout
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </nav>
  );
};
export default NavBar;
