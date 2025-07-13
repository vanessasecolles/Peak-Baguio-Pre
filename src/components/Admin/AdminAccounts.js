import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { db, auth } from '../../firebaseConfig';
import {
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';

const AdminAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [accountFormData, setAccountFormData] = useState({ email: '', password: '', role: 'admin' }); // Include role field
  const [editAccountId, setEditAccountId] = useState(null);
  const navigate = useNavigate(); // Use navigate to handle navigation

  // Fetch admin accounts from Firestore in real-time
  useEffect(() => {
    const accountsCollection = collection(db, 'users');
    const unsubscribe = onSnapshot(accountsCollection, (snapshot) => {
      // Filter only admin and secretary roles
      const filteredAccounts = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((account) => account.role === 'admin' || account.role === 'secretary');
      setAccounts(filteredAccounts);
    });

    return () => unsubscribe();
  }, []);

  // Handle form submission for adding or updating an admin account
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editAccountId) {
        // Update existing account in Firestore
        const accountDoc = doc(db, 'users', editAccountId);
        await updateDoc(accountDoc, { email: accountFormData.email, role: accountFormData.role });
        alert('Account updated successfully!');
      } else {
        // Create a new user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          accountFormData.email,
          accountFormData.password
        );

        const uid = userCredential.user.uid;

        // Add account details to Firestore using UID as the document ID
        const accountDocRef = doc(db, 'users', uid);
        await setDoc(accountDocRef, {
          email: accountFormData.email,
          role: accountFormData.role, // Set role field
          uid: uid,
        });

        alert('Admin account created successfully!');
        navigate('/admin-dashboard'); // Redirect to the admin dashboard
      }

      setAccountFormData({ email: '', password: '', role: 'admin' }); // Reset form
      setEditAccountId(null);
    } catch (error) {
      console.error('Error handling account:', error);
      alert('There was an error while saving the account. Please try again.');
    }
  };

  // Handle edit button click for accounts
  const handleAccountEdit = (account) => {
    setAccountFormData({ email: account.email, password: '', role: account.role });
    setEditAccountId(account.id);
  };

  // Handle delete button click for accounts
  const handleAccountDelete = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        // Delete user from Firebase Authentication
        const userToDelete = auth.currentUser;

        if (userToDelete) {
          await deleteUser(userToDelete);
        }

        // Delete account from Firestore
        const accountDoc = doc(db, 'users', accountId);
        await deleteDoc(accountDoc);

        alert('Account deleted successfully!');
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('There was an error while deleting the account. Please try again.');
      }
    }
  };

  // Handle form field changes for accounts
  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 md:ml-64">
      <h2 className="text-3xl font-bold mb-6 text-center text-teal-700">Manage Admin Accounts</h2>
      <form onSubmit={handleAccountSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="email" className="block font-medium mb-2 text-teal-800">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={accountFormData.email}
            onChange={handleAccountChange}
            className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block font-medium mb-2 text-teal-800">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={accountFormData.password}
            onChange={handleAccountChange}
            className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500"
            required={!editAccountId}
            disabled={!!editAccountId}
          />
        </div>
        <div>
          <label htmlFor="role" className="block font-medium mb-2 text-teal-800">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={accountFormData.role}
            onChange={handleAccountChange}
            className="w-full p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500"
          >
            <option value="admin">Admin</option>
            <option value="secretary">Secretary</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-teal-700 text-white py-3 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
        >
          {editAccountId ? 'Update Account' : 'Add Account'}
        </button>
      </form>

      <div className="mt-10 bg-white shadow-md rounded-lg p-6">
        <h3 className="text-2xl font-bold mb-6 text-teal-700">Existing Admin Accounts</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-teal-100">
                <th className="py-3 px-6 text-left font-semibold text-teal-800 border-b">Email</th>
                <th className="py-3 px-6 text-left font-semibold text-teal-800 border-b">Role</th>
                <th className="py-3 px-6 text-left font-semibold text-teal-800 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length > 0 ? (
                accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-teal-50 transition duration-200">
                    <td className="py-4 px-6 border-b text-teal-900">{account.email}</td>
                    <td className="py-4 px-6 border-b text-teal-900">{account.role}</td>
                    <td className="py-4 px-6 border-b">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleAccountEdit(account)}
                          className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-4 focus:ring-yellow-400 transition duration-300 ease-in-out"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleAccountDelete(account.id)}
                          className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500 transition duration-300 ease-in-out"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-6 text-gray-600">
                    No admin accounts found.
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

export default AdminAccounts;
