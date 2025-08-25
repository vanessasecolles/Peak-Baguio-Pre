import React, { useState } from "react";
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ERROR_MAP_COMMON = {
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/too-many-requests": "Too many attempts. Please wait a bit and try again.",
  "auth/operation-not-allowed": "Password sign-in is disabled for this project.",
  "auth/internal-error": "Something went wrong. Please try again.",
};

const ERROR_MAP_REAUTH = {
  "auth/wrong-password": "Current password is incorrect.",
  "auth/invalid-credential": "Current password is incorrect.",
  "auth/user-mismatch": "Your session changed. Please sign in again and retry.",
  "auth/user-disabled": "This account has been disabled. Contact support.",
};

const ERROR_MAP_UPDATE = {
  "auth/weak-password":
    "New password is too weak. Use more characters and mix letters, numbers, and symbols.",
  "auth/requires-recent-login":
    "For security, please sign in again and then update your password.",
};

const mapAuthError = (err, step /* 'reauth' | 'update' */) => {
  const code = err?.code || "";
  const table = {
    ...ERROR_MAP_COMMON,
    ...(step === "reauth" ? ERROR_MAP_REAUTH : ERROR_MAP_UPDATE),
  };
  return table[code] || "Couldn't update password. Please try again.";
};


const ChangePassword = () => {
  const [current, setCurrent] = useState("");
  const [nw, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  // Password strength: very basic based on length & variety
  const strength = () => {
    let score = 0;
    if (nw.length >= 6) score += 1;
    if (/[A-Z]/.test(nw)) score += 1;
    if (/[0-9]/.test(nw)) score += 1;
    if (/[^A-Za-z0-9]/.test(nw)) score += 1;
    return score; // 0–4
  };

  const strengthLabel = ["Too Short","Weak","Okay","Good","Strong"][strength()];

  const isValid =
    current &&
    nw.length >= 6 &&
    confirm === nw;

  // 2) In handleSubmit, replace your try/catch with this:
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("No user is logged in.");

    if (nw === current) {
      return toast.error("New password must be different from the current password.");
    }

    setLoading(true);
    let step = "reauth";
    try {
      // Re-authenticate with current password
      const cred = EmailAuthProvider.credential(user.email || "", current);
      await reauthenticateWithCredential(user, cred);

      // Update to the new password
      step = "update";
      await updatePassword(user, nw);

      toast.success("Password updated successfully!");
      setCurrent("");
      setNew("");
      setConfirm("");
    } catch (err) {
      console.error("ChangePassword error:", err);
      toast.error(mapAuthError(err, step));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-r from-[#D8ECFB] to-[#EFF8F9] flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md relative">
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-teal-500 text-white p-4 rounded-full shadow-xl">
            <FontAwesomeIcon icon={faLock} size="2x" />
          </div>
        </div>
        <h2 className="mt-8 text-2xl font-bold mb-6 text-center text-teal-700">
          Change Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current */}
          <div>
            <label className="block text-teal-800 font-semibold mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-teal-300"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500"
              >
                <FontAwesomeIcon icon={showCurrent ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {/* New */}
          <div>
            <label className="block text-teal-800 font-semibold mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={nw}
                onChange={(e) => setNew(e.target.value)}
                className={`w-full p-3 border rounded focus:outline-none ${
                  nw.length > 0 && nw.length < 6
                    ? "border-red-500"
                    : "focus:ring-2 focus:ring-teal-300"
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500"
              >
                <FontAwesomeIcon icon={showNew ? faEyeSlash : faEye} />
              </button>
            </div>
            {nw && (
              <div className="mt-2 flex items-center">
                <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden mr-2">
                  <div
                    className={`h-full ${
                      strength() < 2
                        ? "bg-red-500"
                        : strength() < 3
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${(strength()/4)*100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{strengthLabel}</span>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-teal-800 font-semibold mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`w-full p-3 border rounded focus:outline-none ${
                  confirm && confirm !== nw
                    ? "border-red-500"
                    : "focus:ring-2 focus:ring-teal-300"
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500"
              >
                <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} />
              </button>
            </div>
            {confirm && confirm !== nw && (
              <p className="mt-1 text-red-500 text-sm">
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || loading}
            className={`w-full py-3 rounded text-white font-semibold transition ${
              isValid
                ? "bg-teal-700 hover:bg-teal-800"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      <ToastContainer position="top-right" />
    </div>
  );
};

export default ChangePassword;
