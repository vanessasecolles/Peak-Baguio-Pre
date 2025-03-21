import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignOutAlt,
  faChevronDown,
  faChevronRight,
  faUserShield,
  faTimes,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminNav = () => {
  // Local state for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // For demonstration, we hardcode userRole as "admin".
  // Adjust as needed or remove if you want a simpler sidebar.
  const userRole = "admin";

  // Spots state
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spotsCollapsed, setSpotsCollapsed] = useState(false);

  const navigate = useNavigate();

  // Fetch spots from Firestore
  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const spotsCollectionRef = collection(db, "spots");
        const snapshot = await getDocs(spotsCollectionRef);
        const spotsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSpots(spotsData);
      } catch (error) {
        console.error("Error fetching spots:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();
  }, []);

  // Convert spot ID or name to a URL-friendly string
  const formatToURL = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("You have successfully logged out.", {
        position: "top-right",
        autoClose: 3000,
      });
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("There was an error logging out. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Close the mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* 
        MOBILE HEADER (fixed, full-width).
        Only visible on screens smaller than md (md:hidden).
      */}
      <header className="md:hidden w-full fixed top-0 left-0 z-50 bg-gradient-to-r from-teal-900 via-blue-900 to-teal-800 p-4 shadow-xl flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <button onClick={() => setIsMobileMenuOpen(true)}>
          <FontAwesomeIcon icon={faBars} className="text-white text-2xl" />
        </button>
      </header>

      {/* 
        MOBILE OVERLAY (dark semi-transparent background)
        Appears behind the sidebar when it's open on small screens.
      */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* 
        SIDEBAR NAVIGATION 
        - On mobile: slides in/out with translate-x-0 / -translate-x-full
        - On desktop (md+): always visible (static) at width 64
      */}
      <nav
        className={`
          bg-gradient-to-r from-teal-900 via-blue-900 to-teal-800 text-white
          w-64 p-6 shadow-xl min-h-screen
          fixed top-0 left-0 z-50
          transform transition-transform duration-300
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0
        `}
        style={{ marginTop: isMobileMenuOpen ? 0 : "" }}
      >
        {/* 
          CLOSE BUTTON (mobile only).
          Hidden on md+ screens because the sidebar is always open on desktop.
        */}
        <div className="md:hidden flex justify-end mb-4">
          <button onClick={closeMobileMenu}>
            <FontAwesomeIcon icon={faTimes} className="text-white text-2xl" />
          </button>
        </div>

        {/* 
          On desktop, show "Admin Dashboard" text inside the sidebar.
          Hidden on mobile because we already have a full-width header there.
        */}
        <NavLink
          to="/admin-dashboard"
          className="hidden md:block mb-8 text-center"
          onClick={closeMobileMenu}
        >
          <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        </NavLink>

        <ul className="space-y-6">
          {/* Common link (both admin & secretary) */}
          <li>
            <NavLink
              to="/admin-dashboard/itin-table"
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `block py-3 px-4 rounded-lg ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "hover:bg-blue-600 hover:text-white transition-colors duration-300"
                }`
              }
            >
              Itineraries Table
            </NavLink>
          </li>

          {/* Admin-only links (hard-coded userRole = 'admin' in this example) */}
          {userRole === "admin" && (
            <>
              <li>
                <NavLink
                  to="/admin-dashboard/admin-accounts"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block py-3 px-4 rounded-lg ${
                      isActive
                        ? "bg-blue-700 text-white"
                        : "hover:bg-blue-600 hover:text-white transition-colors duration-300"
                    }`
                  }
                >
                  <FontAwesomeIcon icon={faUserShield} className="mr-2" />
                  Admin Accounts
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin-dashboard/user-accounts"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block py-3 px-4 rounded-lg ${
                      isActive
                        ? "bg-blue-700 text-white"
                        : "hover:bg-blue-600 hover:text-white transition-colors duration-300"
                    }`
                  }
                >
                  <FontAwesomeIcon icon={faUserShield} className="mr-2" />
                  User Accounts
                </NavLink>
              </li>

              {/* Manage Spots (collapsible submenu) */}
              <li>
                <div
                  className="flex justify-between items-center py-3 px-4 rounded-lg bg-white text-teal-800 cursor-pointer"
                  onClick={() => setSpotsCollapsed(!spotsCollapsed)}
                >
                  <span>Manage Spots</span>
                  <FontAwesomeIcon
                    icon={spotsCollapsed ? faChevronDown : faChevronRight}
                  />
                </div>
                {!spotsCollapsed && (
                  <ul className="mt-2 space-y-2">
                    {loading ? (
                      <li className="text-center">Loading spots...</li>
                    ) : spots.length === 0 ? (
                      <li className="text-center">No spots available.</li>
                    ) : (
                      spots.map((spot) => (
                        <li key={spot.id}>
                          <NavLink
                            to={`/admin-dashboard/spot/${formatToURL(spot.id)}`}
                            onClick={closeMobileMenu}
                            className={({ isActive }) =>
                              `block py-2 px-4 rounded-lg ${
                                isActive
                                  ? "bg-blue-700 text-white"
                                  : "hover:bg-blue-600 hover:text-white transition-colors duration-300"
                              }`
                            }
                          >
                            {spot.name || "Unnamed Spot"}
                          </NavLink>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            </>
          )}
        </ul>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-10 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 w-full flex items-center justify-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out"
        >
          <FontAwesomeIcon icon={faSignOutAlt} />
          <span>Logout</span>
        </button>
      </nav>

      <ToastContainer />
    </>
  );
};

export default AdminNav;
