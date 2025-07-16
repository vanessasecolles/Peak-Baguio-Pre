// src/components/UserAuth.js
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
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const UserAuth = () => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return unsubscribe;
  }, []);

  // Validation
  const canLogin = email.trim() !== '' && password.length >= 6;
  const canRegister = canLogin && password === confirmPassword;
  const canReset = email.trim() !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (resetMode) {
        // Password reset flow
        const usersQ = query(collection(db, 'users'), where('email', '==', email));
        const snap = await getDocs(usersQ);
        if (snap.empty) {
          toast.error('No account with that email.');
        } else {
          await sendPasswordResetEmail(auth, email);
          toast.success('Password reset email sent.');
          setResetMode(false);
        }
        return;
      }

      if (mode === 'register') {
        // Registration
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', user.uid), { email: user.email, role: 'user' });
        toast.success('Registered successfully! Please login.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      } else {
        // Login + role check + toast-then-navigate
        const cred = await signInWithEmailAndPassword(auth, email, password);

        // Fetch the user document to read their role
        const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
        const userData = userSnap.exists() ? userSnap.data() : { role: 'user' };

        toast.success('Logged in! Redirecting...', {
          autoClose: 1500,
          onClose: () => {
            if (userData.role === 'admin') {
              navigate('/admin');
            } else {
              navigate('/');
            }
          },
        });
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.info('Logged out');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // If already logged in…
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

  // Login / Register / Reset UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        {/* Tabs */}
        <div className="flex mb-6">
          <button
            onClick={() => { setMode('login'); setResetMode(false); }}
            className={`flex-1 py-2 ${
              mode === 'login' && !resetMode
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-600'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setMode('register'); setResetMode(false); }}
            className={`flex-1 py-2 ${
              mode === 'register'
                ? 'border-b-2 border-teal-600 text-teal-600'
                : 'text-gray-600'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => setResetMode((r) => !r)}
            className={`flex-1 py-2 ${
              resetMode ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-600'
            }`}
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
              resetMode
                ? !canReset
                : mode === 'login'
                ? !canLogin
                : !canRegister
            }
            className={`w-full py-2 rounded text-white font-semibold transition ${
              resetMode
                ? canReset
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-gray-400 cursor-not-allowed'
                : mode === 'login'
                ? canLogin
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : 'bg-gray-400 cursor-not-allowed'
                : canRegister
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {resetMode
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
