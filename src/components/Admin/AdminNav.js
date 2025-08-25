import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
  faTable,
  faChartSimple,
  faPlusSquare,
} from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminNav = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userRole = "admin";
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  // collapsed by default
  const [isSpotsOpen, setIsSpotsOpen] = useState(false);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const snapshot = await getDocs(collection(db, "spots"));
        setSpots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpots();
  }, []);

  const formatToURL = name =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully.");
      setTimeout(() => navigate("/"), 2000);
    } catch {
      toast.error("Logout failed.");
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // --- Active route helpers ---
  const isManageRoute =
    pathname.startsWith("/admin-dashboard/spot/") ||
    pathname === "/admin-dashboard/add-spots";

  // Auto-open the Manage Spots section when its routes are active; keep closed otherwise
  useEffect(() => {
    setIsSpotsOpen(isManageRoute);
  }, [isManageRoute]);

  const navClasses = (isActive) =>
    `flex items-center p-2 rounded transition-colors ${
      isActive ? "bg-blue-700" : "hover:bg-blue-600"
    }`;

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 w-full bg-gradient-to-r from-teal-900 via-blue-900 to-teal-800 text-white p-4 flex justify-between items-center z-50">
        <h1 className="text-2xl font-bold">Peak Baguio</h1>
        <button onClick={() => setIsMobileMenuOpen(true)}>
          <FontAwesomeIcon icon={faBars} size="lg" />
        </button>
      </header>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-r from-teal-900 via-blue-900 to-teal-800 text-white transform ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform md:translate-x-0 z-50`}
      >
        <div className="md:hidden flex justify-end p-4">
          <button onClick={closeMobileMenu}>
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        {/* Brand Title */}
        <div className="p-6 text-center border-b border-teal-700">
          <h1 className="text-3xl font-bold">Peak Baguio</h1>
        </div>

        {/* Navigation Links */}
        <ul className="p-6 space-y-4">
          {/* Analytics Dashboard (exact match) */}
          <li>
            <NavLink
              to="/admin-dashboard"
              end
              onClick={closeMobileMenu}
              className={({ isActive }) => navClasses(isActive)}
            >
              <FontAwesomeIcon icon={faChartSimple} className="mr-3" />
              Analytics Dashboard
            </NavLink>
          </li>

          {/* Itineraries Table */}
          <li>
            <NavLink
              to="/admin-dashboard/itin-table"
              onClick={closeMobileMenu}
              className={({ isActive }) => navClasses(isActive)}
            >
              <FontAwesomeIcon icon={faTable} className="mr-3" />
              Itineraries Table
            </NavLink>
          </li>

          {/* Admin-only Links */}
          {userRole === "admin" && (
            <>
              <li>
                <NavLink
                  to="/admin-dashboard/admin-accounts"
                  onClick={closeMobileMenu}
                  className={({ isActive }) => navClasses(isActive)}
                >
                  <FontAwesomeIcon icon={faUserShield} className="mr-3" />
                  Admin Accounts
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/admin-dashboard/user-accounts"
                  onClick={closeMobileMenu}
                  className={({ isActive }) => navClasses(isActive)}
                >
                  <FontAwesomeIcon icon={faUserShield} className="mr-3" />
                  User Accounts
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/admin-dashboard/add-spots"
                  onClick={closeMobileMenu}
                  className={({ isActive }) => navClasses(isActive)}
                >
                  <FontAwesomeIcon icon={faPlusSquare} className="mr-3" />
                  Add Spots
                </NavLink>
              </li>

              {/* Manage Spots Submenu */}
              <li>
                <div
                  role="button"
                  aria-expanded={isSpotsOpen}
                  className={`flex justify-between items-center p-2 rounded cursor-pointer transition-colors ${
                    isManageRoute ? "bg-blue-700" : "hover:bg-blue-600"
                  }`}
                  onClick={() => setIsSpotsOpen((v) => !v)}
                >
                  <span>Manage Spots</span>
                  <FontAwesomeIcon icon={isSpotsOpen ? faChevronDown : faChevronRight} />
                </div>

                {isSpotsOpen && (
                  <ul className="mt-2 pl-4 space-y-2">
                    {loading ? (
                      <li className="opacity-80">Loading spots...</li>
                    ) : (
                      spots.map((s) => (
                        <li key={s.id}>
                          <NavLink
                            to={`/admin-dashboard/spot/${formatToURL(s.id)}`}
                            onClick={closeMobileMenu}
                            className={({ isActive }) =>
                              `block p-2 rounded transition-colors ${
                                isActive ? "bg-blue-700" : "hover:bg-blue-600"
                              }`
                            }
                          >
                            {s.name || "Unnamed"}
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

        {/* Logout */}
        <div className="p-6 border-t border-teal-700">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 py-2 rounded flex justify-center items-center space-x-2 transition-transform hover:scale-105"
          >
            <FontAwesomeIcon icon={faSignOutAlt} /> <span>Logout</span>
          </button>
        </div>
      </nav>

      <ToastContainer />
    </>
  );
};

export default AdminNav;
