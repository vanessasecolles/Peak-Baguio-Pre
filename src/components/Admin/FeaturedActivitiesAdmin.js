import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const FeaturedActivitiesAdmin = () => {
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', image: '', isFeatured: false, category: '' });
  const [editId, setEditId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const activitiesCollection = collection(db, 'featuredActivities');
  const categoriesCollection = collection(db, 'categories');

  useEffect(() => {
    const unsubscribeActivities = onSnapshot(activitiesCollection, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setActivities(data);
    });

    const unsubscribeCategories = onSnapshot(categoriesCollection, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(data);
    });

    return () => {
      unsubscribeActivities();
      unsubscribeCategories();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const docRef = doc(db, 'featuredActivities', editId);
        await updateDoc(docRef, formData);
        alert('Featured Activity updated successfully!');
      } else {
        await addDoc(activitiesCollection, formData);
        alert('Featured Activity added successfully!');
      }
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error managing activity: ', error);
      alert('There was an error managing the activity. Please try again.');
    }
  };

  const handleEdit = (activity) => {
    setFormData({
      title: activity.title,
      description: activity.description,
      image: activity.image,
      isFeatured: activity.isFeatured || false,
      category: activity.category || '',
    });
    setEditId(activity.id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        const docRef = doc(db, 'featuredActivities', deleteId);
        await deleteDoc(docRef);
        alert('Featured Activity deleted successfully!');
        closeDeleteModal();
      } catch (error) {
        console.error('Error deleting activity: ', error);
        alert('There was an error deleting the activity. Please try again.');
      }
    }
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteId(null);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', image: '', isFeatured: false, category: '' });
    setEditId(null);
  };

  return (
    <div className="p-8 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50 min-h-screen">
      <div className="bg-white shadow-xl rounded-lg p-8 mb-10 transform hover:scale-105 transition-transform duration-500 ease-in-out">
        <h2 className="text-4xl font-bold mb-6 text-center text-teal-700">Manage Featured Activities</h2>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-teal-700 text-white py-4 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500 flex items-center justify-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add New Activity</span>
        </button>
      </div>

      <div className="bg-white shadow-xl rounded-lg p-8">
        <h3 className="text-3xl font-bold mb-6 text-center text-teal-700">Existing Featured Activities</h3>
        {activities.length === 0 ? (
          <p className="text-center text-teal-800">No featured activities found. Please add some activities.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activities.map((activity) => (
              <div key={activity.id} className="border rounded-lg p-6 shadow-lg bg-white transform hover:scale-105 transition-transform duration-500 ease-in-out">
                {activity.image && (
                  <img
                    src={activity.image}
                    alt={activity.title}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <h4 className="text-2xl font-semibold mb-4 text-teal-800">{activity.title} {activity.isFeatured && <span className='text-sm text-yellow-500'>(Featured)</span>}</h4>
                <p className="text-gray-700 mb-4">{activity.description}</p>
                <p className="text-gray-600 mb-4">Category: {activity.category}</p>
                <div className="flex justify-between">
                  <button
                    onClick={() => handleEdit(activity)}
                    className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-4 focus:ring-yellow-400 flex items-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => openDeleteModal(activity.id)}
                    className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-400 flex items-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Add/Edit Activity */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        contentLabel="Add/Edit Activity Modal"
        className="modal-content bg-white p-8 rounded-lg shadow-2xl max-w-md mx-auto transform hover:scale-105 transition-transform duration-500 ease-in-out"
        overlayClassName="modal-overlay fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div className="flex justify-end mb-4">
          <button onClick={() => {
            setIsModalOpen(false);
            resetForm();
          }}>
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>
        <h3 className="text-3xl font-bold mb-6 text-teal-700 text-center">{editId ? "Edit Activity" : "Add New Activity"}</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-teal-800">Activity Title</label>
            <input
              type="text"
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-teal-800">Description</label>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
              rows="3"
              required
            ></textarea>
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-teal-800">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-teal-800">Image URL</label>
            <input
              type="text"
              placeholder="Image URL"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
              required
            />
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
            <label className="font-semibold text-teal-800">Featured Activity</label>
          </div>
          <button
            type="submit"
            className="bg-teal-700 text-white py-4 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500 flex items-center justify-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>{editId ? "Update Activity" : "Add Activity"}</span>
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={closeDeleteModal}
        contentLabel="Delete Activity Confirmation"
        className="modal-content bg-white p-8 rounded-lg shadow-2xl max-w-md mx-auto transform hover:scale-105 transition-transform duration-500 ease-in-out"
        overlayClassName="modal-overlay fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <h3 className="text-3xl font-bold mb-6 text-red-700 text-center">Delete Activity</h3>
        <p className="text-gray-700 text-lg text-center mb-8">Are you sure you want to delete this activity?</p>
        <div className="flex justify-center space-x-6">
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500 transition duration-300 ease-in-out"
          >
            Delete
          </button>
          <button
            onClick={closeDeleteModal}
            className="bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-500 transition duration-300 ease-in-out"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default FeaturedActivitiesAdmin;
