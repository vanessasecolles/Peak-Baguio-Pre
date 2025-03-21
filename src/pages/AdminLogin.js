import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "../firebaseConfig";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Authenticate user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const db = getFirestore();
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.error("User document not found in Firestore.");
        toast.error("Access denied. Admins & Secretaries only.");
        return;
      }

      const userData = userDoc.data();
      console.log("User Data:", userData);

      if (userData.role === "admin" || userData.role === "secretary") {
        console.log("Admin or Secretary logged in:", user.email);
        window.location.href = "/admin-dashboard"; // Redirect to admin dashboard
      } else {
        console.error("Access denied. Role is not admin or secretary.");
        toast.error("Access denied. Admins & Secretaries only.");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Invalid email or password.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address to reset your password.");
      return;
    }

    try {
      const db = getFirestore();
      // Check if the email exists in the 'users' collection
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(usersQuery);
      if (querySnapshot.empty) {
        toast.error("No account found with this email address.");
        return;
      }

      // Email exists, send the password reset email
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent. Please check your inbox.");
    } catch (err) {
      console.error("Reset Password error:", err);
      toast.error(err.message);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
      <div className="bg-white shadow-2xl rounded-lg p-10 w-full max-w-md transform hover:scale-105 transition-transform duration-500 ease-in-out">
        <h2 className="text-4xl font-bold mb-6 text-center text-teal-700">Admin & Secretary Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
              required
            />
          </div>
          {/* Forgot Password Button */}
          <div className="text-right">
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-teal-700 font-semibold hover:underline focus:outline-none text-sm"
            >
              Forgot Password?
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-teal-700 text-white py-4 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500 transition-transform transform hover:scale-105 duration-300 ease-in-out"
          >
            Login
          </button>
        </form>
      </div>
      <ToastContainer 
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </section>
  );
};

export default AdminLogin;
