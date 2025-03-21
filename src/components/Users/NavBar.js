import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import logo from "../../img/logoPB.png";
import { app } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const toSlug = (name) => name.toLowerCase().replace(/ /g, "-");

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [spots, setSpots] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // State for toggling the Explore Baguio submenu on mobile
  const [isExploreOpenMobile, setIsExploreOpenMobile] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(app), (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const spotsSnapshot = await getDocs(collection(db, "spots"));
        const spotsData = spotsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setSpots(spotsData);
      } catch (error) {
        console.error("Error fetching spots:", error);
      }
    };
    fetchSpots();
  }, []);

  const handleLogout = async () => {
    alert("Thank you for using Peak Baguio! You have been logged out.");
    await signOut(getAuth(app));
    window.location.href = "/user-auth";
  };

  const handleSpotClick = (spotName) => {
    navigate(`/spots/${toSlug(spotName)}`);
    // Close both the main menu and the Explore submenu on mobile
    setIsMenuOpen(false);
    setIsExploreOpenMobile(false);
  };

  return (
    <nav className="user-navbar bg-teal-700 text-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center relative">
        {/* Logo + Title */}
        <div className="flex items-center">
          <img src={logo} alt="Peak Baguio Logo" className="h-12 w-auto mr-4" />
          <span className="text-2xl font-bold text-yellow-400">Peak Baguio</span>
        </div>

        {/* Hamburger Icon (mobile) */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            // X icon
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // Hamburger icon
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
            </svg>
          )}
        </button>

        {/* Menu Links */}
        <ul
          className={`
            md:flex md:space-x-6 md:items-center
            absolute md:static
            top-full left-0 w-full md:w-auto
            bg-teal-700 md:bg-transparent
            z-50
            mt-1 md:mt-0
            rounded-b-lg md:rounded-none
            shadow-lg md:shadow-none
            p-4 md:p-0
            space-y-4 md:space-y-0
            transform-gpu transition-all duration-300 ease-in-out
            ${
              isMenuOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }
            md:opacity-100 md:translate-y-0 md:pointer-events-auto
          `}
        >
          {/* HOME */}
          <li>
            <NavLink
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                `block p-2 rounded ${
                  isActive
                    ? "font-bold text-yellow-300"
                    : "hover:text-yellow-200 transition-colors duration-300"
                }`
              }
            >
              Home
            </NavLink>
          </li>

          {/* DESKTOP: Explore Baguio (hover) */}
          <li className="relative group hidden md:block">
            <span className="block p-2 rounded cursor-pointer hover:text-yellow-200 transition-colors duration-300">
              Explore Baguio
            </span>
            <div className="absolute left-0 top-full mt-2 w-48 bg-white text-teal-700 shadow-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <ul className="flex flex-col py-2">
                {spots.map((spot) => (
                  <li
                    key={spot.id}
                    className="px-4 py-2 text-sm hover:bg-teal-100 cursor-pointer"
                    onClick={() => handleSpotClick(spot.name)}
                  >
                    {spot.name}
                  </li>
                ))}
              </ul>
            </div>
          </li>

          {/* MOBILE: Explore Baguio (click/toggle) */}
          <li className="md:hidden">
            <button
              onClick={() => setIsExploreOpenMobile(!isExploreOpenMobile)}
              className="block p-2 rounded w-full text-left hover:text-yellow-200 transition-colors duration-300"
            >
              Explore Baguio
            </button>
            {/* Conditionally render the submenu */}
            {isExploreOpenMobile && (
              <div className="mt-2 ml-4">
                <ul className="flex flex-col space-y-2">
                  {spots.map((spot) => (
                    <li
                      key={spot.id}
                      className="text-sm hover:text-yellow-200 cursor-pointer"
                      onClick={() => handleSpotClick(spot.name)}
                    >
                      {spot.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>

          {/* AUTH LINKS */}
          {isLoggedIn ? (
            <>
              {/* My Itineraries */}
              <li>
                <NavLink
                  to="/my-itineraries"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `block p-2 rounded ${
                      isActive
                        ? "font-bold text-yellow-300"
                        : "hover:text-yellow-200 transition-colors duration-300"
                    }`
                  }
                >
                  My Itineraries
                </NavLink>
              </li>

              {/* Change Password */}
              <li>
                <NavLink
                  to="/change-password"
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `block p-2 rounded ${
                      isActive
                        ? "font-bold text-yellow-300"
                        : "hover:text-yellow-200 transition-colors duration-300"
                    }`
                  }
                >
                  Change Password
                </NavLink>
              </li>

              {/* Logout */}
              <li>
                <button
                  onClick={handleLogout}
                  className="block p-2 rounded font-bold text-yellow-300 hover:text-yellow-200 transition-colors duration-300 focus:outline-none"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            // Register / Login
            <li>
              <NavLink
                to="/user-auth"
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `block p-2 rounded ${
                    isActive
                      ? "font-bold text-yellow-300"
                      : "hover:text-yellow-200 transition-colors duration-300"
                  }`
                }
              >
                Register / Login
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
