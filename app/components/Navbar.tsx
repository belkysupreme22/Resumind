import { Link, useNavigate } from "react-router";
import { FaUserCircle } from "react-icons/fa";
import { usePuterStore } from "~/lib/puter";
import { useState, useEffect, useRef } from "react";


const NavBar = () => {
  const { auth } = usePuterStore();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <nav className="navbar">
      <Link to="/">
        <p className="brand-wordmark text-2xl font-bold text-gradient">RESUMIND</p>
      </Link>
      {/* <Link to="/upload" className="primary-button w-fit">
        Upload Resume
      </Link> */}
      <div className="flex items-center gap-4">
        <Link to="/upload" className="primary-button w-fit">
          Upload Resume
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            className="profile-trigger"
            onClick={() => setShowMenu((v) => !v)}
            aria-label="Profile menu"
          >
            <FaUserCircle size={28} className="text-inherit" />
            <span>{auth.user?.username}</span>
            
          </button>

            {showMenu && (
              <div
                className="profile-menu"
              >
                <div className="flex flex-col py-2">
                  
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition"
                    onClick={() => {
                      auth.signOut();
                      navigate("/auth");
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                    </svg>
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
