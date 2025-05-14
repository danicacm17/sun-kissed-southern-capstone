import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaUser, FaShoppingCart, FaHeart, FaBars } from "react-icons/fa";
import "./Navbar.css";

function Navbar() {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  useEffect(() => {
    setDropdownOpen(null);
    setMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout(); // No need to call navigate — handled in AuthContext
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/">
          <img src="/SK&S Large Logo.svg" alt="Sun-Kissed & Southern" className="logo" />
        </Link>
      </div>

      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        <FaBars />
      </button>

      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        <div className="nav-main">
          <div className="dropdown">
            <button
              className="dropdown-toggle"
              onClick={() => setDropdownOpen(dropdownOpen === "shop" ? null : "shop")}
            >
              Shop
            </button>
            {dropdownOpen === "shop" && (
              <div className="dropdown-menu">
                <Link to="/category/t-shirts">T-Shirts</Link>
                <Link to="/category/tank-tops">Tank Tops</Link>
                <Link to="/category/sweatshirts">Sweatshirts</Link>
                <Link to="/category/beach-towels">Beach Towels</Link>
                <Link to="/category/tumblers">Tumblers</Link>
                <Link to="/category/totes">Totes</Link>
                <Link to="/category/accessories">Accessories</Link>
              </div>
            )}
          </div>

          <Link to="/blog">Blog</Link>
          <Link to="/about">About</Link>
        </div>

        <div className="icon-links">
          {user && (
            <>
              <div className="profile-dropdown">
                <button
                  className="icon-btn profile-toggle"
                  onClick={() => setDropdownOpen(dropdownOpen === "profile" ? null : "profile")}
                >
                  <FaUser />
                </button>
                {dropdownOpen === "profile" && (
                  <div className="dropdown-menu profile-menu">
                    <Link to="/profile">Profile</Link>
                    {!loading && user.role === "admin" && <Link to="/admin">Dashboard</Link>}
                    <button onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>

              <Link to="/favorites" className="icon-btn" title="Favorites">
                <FaHeart />
              </Link>
            </>
          )}

          <Link to="/cart" className="icon-btn" title="Cart">
            <FaShoppingCart />
          </Link>

          {!user && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
