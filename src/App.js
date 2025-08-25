import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "./firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// User Components
import Navbar from "./components/Users/NavBar"; // User-facing Navbar
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import UserAuth from "./pages/UserAuth"; // User Registration/Login Component
import UserItineraries from "./components/Users/UserItineraries"; // User Itineraries Component
import ChangePassword from "./components/Users/ChangePassword";
import ScrollToTop from "./pages/ScrollToTop";

// Admin Components
import AdminNav from "./components/Admin/AdminNav"; // Admin Sidebar Navigation
import GenerateItineraryAdmin from "./components/Admin/GenerateItineraryAdmin"; // New Component
import AddAdmin from "./components/Admin/AddAdmin"; // AddAdmin Component
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminItinerariesTable from "./components/Admin/AdminItinerariesTable";
import AdminAccounts from "./components/Admin/AdminAccounts";
import UserAccounts from "./components/Admin/UserAccounts";
import SpotDetails from "./components/Users/SpotsReusable";
import ExploreBaguio from "./components/Users/ExploreBaguio";
import DynamicSpotAdmin from "./components/Admin/DynamicSpotAdmin";
import AddSpot from "./components/Admin/AddSpot";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const [userRole, setUserRole] = useState(null); // null, "user", "admin"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is logged in, fetch the role from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role);
        } else {
          setUserRole("user"); // Default to user if no role is specified
        }
      } else {
        // User is logged out
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while role is being determined
  }

  return (
    <Router>
         <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
      />
        <ScrollToTop />
      <Routes>
        {/* User Routes */}
        {userRole !== "admin" && (
          <>
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <Home />
                </>
              }
            />
            <Route
              path="/about"
              element={
                <>
                  <Navbar />
                  <About />
                </>
              }
            />
            <Route
              path="/contact"
              element={
                <>
                  <Navbar />
                  <Contact />
                </>
              }
            />
       
           
            <Route path="/explore-baguio" element={<ExploreBaguio />} />
            <Route
                path="/spots/:spotId"
                element={
                  <>
                    <Navbar />
                    <SpotDetails />
                  </>
                }
              />
           
            
                {/* Other user routes */}
                <Route
                  path="/change-password"
                  element={
                    <>
                      <Navbar />
                      <ChangePassword />
                    </>
                  }
                />
             
          
            <Route
              path="/user-auth"
              element={
                <>
                  <Navbar />
                  <UserAuth />
                </>
              }
            />
            <Route
              path="/my-itineraries"
              element={
                <>
                  <Navbar />
                  <UserItineraries />
                </>
              }
            />
          </>
        )}

        {/* Admin Dashboard Routes */}
        {(userRole === "admin" || userRole === "secretary") && (
          <Route
            path="/admin-dashboard/*"
            element={
              <div className="flex">
                {/* Admin Navigation Sidebar */}
                <AdminNav userRole={userRole} />

                {/* Admin Content Area */}
                <div className="flex-1 p-8">
                  <Routes>
                    <Route path="generate-itinerary" element={<GenerateItineraryAdmin />} />
                    <Route path="add-spots" element={<AddSpot/>} />
                    <Route path="spot/:spotId" element={<DynamicSpotAdmin />} />
                    <Route path="add-admin" element={<AddAdmin />} />
                    <Route path="itin-table" element={<AdminItinerariesTable />} />
                    <Route path="admin-accounts" element={<AdminAccounts />} />
                    <Route path="user-accounts" element={<UserAccounts />} />
                    {/* Redirect /admin-dashboard to /admin-dashboard/highlights */}
                    <Route path="" element={<AdminDashboard />} />
                  </Routes>
                </div>
              </div>
            }
          />
        )}


        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />

        

        {/* Redirect any unmatched admin path to admin login */}
        {userRole === "admin" && (
          <Route path="*" element={<Navigate to="/admin-dashboard" />} />
        )}

        {/* Redirect any unmatched user path to home */}
        {userRole !== "admin" && (
          <Route path="*" element={<Navigate to="/" />} />
        )}
      </Routes>
    </Router>
  );
};

export default App;