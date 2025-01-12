import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt, faChevronDown, faChevronRight, faUserShield } from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminNav = ({ userRole }) => {
  const navigate = useNavigate();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spotsCollapsed, setSpotsCollapsed] = useState(false);

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

  const formatToURL = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("You have successfully logged out.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setTimeout(() => {
        navigate("/"); // Redirect to the homepage after toast notification
      }, 3000);
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("There was an error logging out. Please try again.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-teal-900 via-blue-900 to-teal-800 text-white w-64 min-h-screen p-6 shadow-xl">
        <NavLink to="/admin-dashboard" className="block mb-8 text-center">
          <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        </NavLink>
        <ul className="space-y-6">
          {/* Common links for both admin and secretary */}
          <li>
            <NavLink
              to="/admin-dashboard/itin-table"
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

          {/* Links visible only to admin */}
          {userRole === "admin" && (
            <>
              {/* Admin Accounts */}
              <li>
                <NavLink
                  to="/admin-dashboard/admin-accounts"
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

              {/* Dynamic Spot List */}
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
