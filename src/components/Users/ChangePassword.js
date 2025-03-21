import React, { useState } from "react";
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    // Basic check for password length
    if (newPassword.length < 6) {
      setError("New password should be at least 6 characters long.");
      return;
    }

    // Ensure user is logged in
    if (!user) {
      setError("No user is logged in.");
      return;
    }

    setLoading(true);

    try {
      // Reauthenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update the user's password
      await updatePassword(user, newPassword);
      setSuccess("Password updated successfully!");

      // Reset form fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      // Check Firebase error codes for more specific messages
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Your current password is incorrect. Please try again.");
      } else if (err.code === "auth/weak-password") {
        setError("Your new password is too weak. Please choose a stronger one.");
      } else {
        // Fallback error message
        setError(err.message || "Failed to update password.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#D8ECFB] to-[#EFF8F9] flex items-center justify-center p-4">
      <div className="bg-white shadow-md rounded p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-teal-700">Change Password</h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}
        {success && <p className="text-green-600 mb-2">{success}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-teal-700 font-semibold">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1 focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-teal-700 font-semibold">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1 focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-teal-700 font-semibold">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mt-1 focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-teal-700 text-white py-2 px-4 rounded hover:bg-teal-800 transition-colors duration-300"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
