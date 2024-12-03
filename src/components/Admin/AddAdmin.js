import React, { useState } from "react";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";

const AddAdmin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create a new user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Add a new document in Firestore with the user ID and set the role as 'admin'
      const userId = userCredential.user.uid;
      const userDocRef = doc(db, "users", userId);
      await setDoc(userDocRef, { role: "admin", email: formData.email });

      alert("Admin account created successfully!");
      setFormData({ email: "", password: "" });
    } catch (error) {
      console.error("Error creating admin:", error);
      alert("There was an error creating the admin. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add New Admin</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-md"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-md"
          required
        />
        <button
          type="submit"
          className={`bg-blue-500 text-white py-2 px-4 rounded ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"}`}
          disabled={loading}
        >
          {loading ? "Creating Admin..." : "Add Admin"}
        </button>
      </form>
    </div>
  );
};

export default AddAdmin;
