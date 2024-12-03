import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminNav = ({ userRole }) => {
  const navigate = useNavigate();

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
                `block py-3 px-4 rounded-lg ${isActive ? "bg-blue-700 text-white" : "hover:bg-blue-600 hover:text-white transition-colors duration-300"}`
              }
            >
              Itineraries Table
            </NavLink>
          </li>

          {/* Links visible only to admin */}
          {userRole === "admin" && (
            <>
              {[
                "Adventures & Activities",
                "Art & Creativity",
                "Culture & History",
                "Events & Festivals",
                "Family-Friendly",
                "Food & Gastronomy",
                "Nature & Outdoors",
                "Seasonal Attractions",
                "Shopping & Souvenirs",
              ].map((category) => (
                <li key={category}>
                  <NavLink
                    to={`/admin-dashboard/category/${category.toLowerCase().replace(/ & | /g, '-')}`}
                    className={({ isActive }) =>
                      `block py-3 px-4 rounded-lg ${isActive ? "bg-blue-700 text-white" : "hover:bg-blue-600 hover:text-white transition-colors duration-300"}`
                    }
                  >
                    {category}
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink
                  to="/admin-dashboard/admin-accounts"
                  className={({ isActive }) =>
                    `block py-3 px-4 rounded-lg ${isActive ? "bg-blue-700 text-white" : "hover:bg-blue-600 hover:text-white transition-colors duration-300"}`
                  }
                >
                  Admin Accounts
                </NavLink>
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
