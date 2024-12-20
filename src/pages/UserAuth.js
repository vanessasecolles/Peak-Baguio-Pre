import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';

Modal.setAppElement('#root');

const UserAuth = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (isRegister) {
        // Register User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create a user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'user', // Set role as 'user'
          itineraryAccessCount: 0,
        });

        // Show success modal
        setIsModalOpen(true);
      } else {
        // Log In User
        await signInWithEmailAndPassword(auth, email, password);
        // Redirect after successful login
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleAuthMode = () => {
    setIsRegister((prev) => !prev);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Navigate to home page after successful registration
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        {isLoggedIn ? (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6 text-teal-700">You are already logged in</h2>
            <button
              onClick={handleLogout}
              className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500"
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-6 text-center text-teal-700">
              {isRegister ? 'Register' : 'Login'} to Peak Baguio
            </h2>
            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label htmlFor="email" className="block font-semibold text-teal-800 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500"
                />
              </div>

              <div>
                <label htmlFor="password" className="block font-semibold text-teal-800 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500"
                />
              </div>

              {error && <p className="text-red-600 text-center">{error}</p>}

              <button
                type="submit"
                className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500"
              >
                {isRegister ? 'Register' : 'Login'}
              </button>
            </form>

            <p className="text-center mt-4">
              {isRegister ? 'Already have an account?' : 'Don\'t have an account yet?'}{' '}
              <button
                onClick={toggleAuthMode}
                className="text-teal-600 font-semibold hover:underline focus:outline-none"
              >
                {isRegister ? 'Login here' : 'Register here'}
              </button>
            </p>
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Registration Successful"
        className="modal-content bg-white p-8 rounded-lg shadow-2xl max-w-md mx-auto mt-20 transform transition-transform duration-500 ease-in-out"
        overlayClassName="modal-overlay fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div className="p-6">
          <h3 className="text-3xl font-bold mb-4 text-teal-700">Registration Successful!</h3>
          <p className="text-gray-700 mb-6">You have successfully registered. You can now log in and start planning your adventure in Baguio City!</p>
          <button
            onClick={closeModal}
            className="bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default UserAuth;