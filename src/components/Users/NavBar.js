import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import logo from '../../img/logoPB.png';
import { app } from '../../firebaseConfig'; // Import initialized Firebase app
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

// Get Auth instance
const auth = getAuth(app);

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      alert("Thank you for using Peak Baguio! You have been logged out.");
      await signOut(auth);
      window.location.href = "/user-auth"; // Redirect to login page after logout
    } catch (err) {
      console.error("Error logging out: ", err);
    }
  };

  const handleCategoryClick = (category) => {
    navigate(`/${category.toLowerCase().replace(/ & | /g, '-')}`);
  };

  return (
    <nav className="user-navbar bg-teal-700 text-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img src={logo} alt="Peak Baguio Logo" className="h-12 w-auto mr-4" />
          <span className="text-2xl font-bold text-yellow-400">Peak Baguio</span>
        </div>

        <ul className="flex space-x-6 items-center">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `p-2 rounded ${isActive ? "font-bold text-yellow-300" : "hover:text-yellow-200 transition-colors duration-300"}`
              }
            >
              Home
            </NavLink>
          </li>
          {/*
          <li>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `p-2 rounded ${isActive ? "font-bold text-yellow-300" : "hover:text-yellow-200 transition-colors duration-300"}`
              }
            >
              About
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `p-2 rounded ${isActive ? "font-bold text-yellow-300" : "hover:text-yellow-200 transition-colors duration-300"}`
              }
            >
              Contact
            </NavLink>
          </li>
          */}
          <li className="relative group">
            <span className="p-2 rounded cursor-pointer hover:text-yellow-200 transition-colors duration-300">
              Explore Baguio
            </span>
            <div className="absolute left-0 top-full mt-2 w-48 bg-white text-teal-700 shadow-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <ul className="flex flex-col py-2">
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
                  <li
                    key={category}
                    className="px-4 py-2 text-sm hover:bg-teal-100 cursor-pointer"
                    onClick={() => handleCategoryClick(category)}
                  >
                    {category}
                  </li>
                ))}
              </ul>
            </div>
          </li>
          {isLoggedIn ? (
            <>
              <li>
                <NavLink
                  to="/my-itineraries"
                  className={({ isActive }) =>
                    `p-2 rounded ${isActive ? "font-bold text-yellow-300" : "hover:text-yellow-200 transition-colors duration-300"}`
                  }
                >
                  My Itineraries
                </NavLink>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded font-bold text-yellow-300 hover:text-yellow-200 transition-colors duration-300 focus:outline-none"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <NavLink
                to="/user-auth"
                className={({ isActive }) =>
                  `p-2 rounded ${isActive ? "font-bold text-yellow-300" : "hover:text-yellow-200 transition-colors duration-300"}`
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
