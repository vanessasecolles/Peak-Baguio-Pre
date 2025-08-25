import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const mapAuthError = (code) => {
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/missing-email':
      return 'Email is required.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/email-already-in-use':
      return 'That email is already registered.';
    case 'auth/weak-password':
      return 'Password is too weak (use 6+ characters).';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is disabled by the project.';
    case 'auth/unauthorized-continue-uri':
    case 'auth/invalid-continue-uri':
      return 'The return URL is not authorized in Firebase settings.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

const UserAuth = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return unsub;
  }, []);

  const canLogin = email.trim() !== '' && password.length >= 6;
  const canRegister = canLogin && password === confirmPassword;
  const canReset = email.trim() !== '';

  // Optional: return users back to your app after password reset
  // Make sure this origin is added to Firebase Auth → Settings → Authorized domains
  const actionCodeSettings = {
    url: `${window.location.origin}/auth?from=reset`,
    handleCodeInApp: false,
  };

    const handlePasswordReset = async () => {
      if (!canReset) return;
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
        // Generic message (prevents user enumeration)
        toast.success('If an account exists for that email, a reset link has been sent.');
        setResetMode(false);
        setPassword('');
        setConfirmPassword('');
      } catch (err) {
        toast.error(mapAuthError(err.code) || err.message);
      } finally {
        setLoading(false);
      }
    };

  const handleRegister = async () => {
    if (!canRegister) return;
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // Create the profile document (uid as doc id)
      await setDoc(doc(db, 'users', user.uid), { email: user.email, role: 'user' });

      toast.success('Welcome! You are now signed in.');
      // Redirect newly-registered user
      navigate('/');
    } catch (err) {
      toast.error(mapAuthError(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!canLogin) return;
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

      // Fetch user role (default to user if doc missing)
      let role = 'user';
      try {
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        if (snap.exists()) {
          const data = snap.data();
          role = data?.role || 'user';
        }
      } catch {
        // If Firestore is locked down, just proceed as 'user'
      }

      toast.success('Logged in! Redirecting...', {
        autoClose: 1200,
        onClose: () => navigate(role === 'admin' ? '/admin' : '/'),
      });
    } catch (err) {
      toast.error(mapAuthError(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (resetMode) return handlePasswordReset();
    if (mode === 'register') return handleRegister();
    return handleLogin();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.info('Logged out.');
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      toast.error(mapAuthError(err.code) || err.message);
    }
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6 text-teal-700">You are logged in</h2>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        {/* Tabs */}
        <div className="flex mb-6">
          <button
            onClick={() => { setMode('login'); setResetMode(false); }}
            className={`flex-1 py-2 ${mode === 'login' && !resetMode ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-600'}`}
          >
            Login
          </button>
          <button
            onClick={() => { setMode('register'); setResetMode(false); }}
            className={`flex-1 py-2 ${mode === 'register' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-600'}`}
          >
            Register
          </button>
          <button
            onClick={() => setResetMode((r) => !r)}
            className={`flex-1 py-2 ${resetMode ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-600'}`}
          >
            Reset
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-300"
              required
            />
          </div>

          {!resetMode && (
            <>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-300"
                  required
                  minLength={6}
                />
              </div>

              {mode === 'register' && (
                <div className="relative">
                  <FontAwesomeIcon icon={faLock} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-300"
                    required
                    minLength={6}
                  />
                  {confirmPassword && confirmPassword !== password && (
                    <p className="mt-1 text-red-500 text-sm">Passwords do not match.</p>
                  )}
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              (resetMode ? !canReset : mode === 'login' ? !canLogin : !canRegister)
            }
            className={`w-full py-2 rounded text-white font-semibold transition ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : resetMode
                ? canReset ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-400 cursor-not-allowed'
                : mode === 'login'
                ? canLogin ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-400 cursor-not-allowed'
                : canRegister
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {loading
              ? 'Please wait...'
              : resetMode
              ? 'Send Reset Email'
              : mode === 'login'
              ? 'Login'
              : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserAuth;
