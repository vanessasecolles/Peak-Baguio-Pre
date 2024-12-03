import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { auth } from "../firebaseConfig";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

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
        setError("Access denied. Admins & Secretaries only.");
        return;
      }

      const userData = userDoc.data();
      console.log("User Data:", userData); // Log user data to help debug

      if (userData.role === "admin" || userData.role === "secretary") {
        console.log("Admin or Secretary logged in:", user.email);
        window.location.href = "/admin-dashboard"; // Redirect to admin dashboard
      } else {
        console.error("Access denied. Role is not admin or secretary.");
        setError("Access denied. Admins & Secretaries only.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password.");
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
      <div className="bg-white shadow-2xl rounded-lg p-10 w-full max-w-md transform hover:scale-105 transition-transform duration-500 ease-in-out">
        <h2 className="text-4xl font-bold mb-6 text-center text-teal-700">Admin & Secretary Login</h2>
        {error && (
          <p className="text-red-600 text-center text-sm mb-6">
            {error}
          </p>
        )}
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
          <button
            type="submit"
            className="w-full bg-teal-700 text-white py-4 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500 transition-transform transform hover:scale-105 duration-300 ease-in-out"
          >
            Login
          </button>
        </form>
      </div>
    </section>
  );
};

export default AdminLogin;
