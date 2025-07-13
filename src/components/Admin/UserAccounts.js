import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebaseConfig';
import { collection, setDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';

const UserAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [accountFormData, setAccountFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  // Fetch only user accounts in real-time
  useEffect(() => {
    const accountsCollection = collection(db, 'users');
    const unsubscribe = onSnapshot(accountsCollection, (snapshot) => {
      const filteredAccounts = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((account) => account.role === 'user');
      setAccounts(filteredAccounts);
    });

    return () => unsubscribe();
  }, []);

  // Handle form submission for creating a new user account
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create a new user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        accountFormData.email,
        accountFormData.password
      );

      const uid = userCredential.user.uid;

      // Save user account details in Firestore with role set to 'user'
      const accountDocRef = doc(db, 'users', uid);
      await setDoc(accountDocRef, {
        email: accountFormData.email,
        role: 'user',
        uid: uid,
      });

      alert('User account created successfully!');
      navigate('/admin-dashboard'); // Change route if needed
      setAccountFormData({ email: '', password: '' });
    } catch (error) {
      console.error('Error creating user account:', error);
      alert('There was an error while creating the user account. Please try again.');
    }
  };

  // Handle delete button click for user accounts
  const handleAccountDelete = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        // Delete the user from Firebase Authentication (note: this deletes the current user, adjust as needed)
        const userToDelete = auth.currentUser;
        if (userToDelete) {
          await deleteUser(userToDelete);
        }

        // Delete the account from Firestore
        const accountDoc = doc(db, 'users', accountId);
        await deleteDoc(accountDoc);

        alert('User account deleted successfully!');
      } catch (error) {
        console.error('Error deleting user account:', error);
        alert('There was an error while deleting the user account. Please try again.');
      }
    }
  };

  // Handle form field changes
  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 md:ml-64">
      <h2 className="text-3xl font-bold mb-6 text-center text-teal-700">Manage User Accounts</h2>

      <div className="mt-10 bg-white shadow-md rounded-lg p-6">
        <h3 className="text-2xl font-bold mb-6 text-teal-700">Existing User Accounts</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-teal-100">
                <th className="py-3 px-6 text-left font-semibold text-teal-800 border-b">Email</th>
                <th className="py-3 px-6 text-left font-semibold text-teal-800 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length > 0 ? (
                accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-teal-50 transition duration-200">
                    <td className="py-4 px-6 border-b text-teal-900">{account.email}</td>
                    <td className="py-4 px-6 border-b">
                      <button
                        onClick={() => handleAccountDelete(account.id)}
                        className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500 transition duration-300 ease-in-out"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="text-center py-6 text-gray-600">
                    No user accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserAccounts;
