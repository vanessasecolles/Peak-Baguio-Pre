import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const CategoriesAdmin = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: "", image: "", isFeatured: false });
  const [editId, setEditId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const categoriesCollection = collection(db, "categories");

  useEffect(() => {
    const unsubscribe = onSnapshot(categoriesCollection, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const docRef = doc(db, "categories", editId);
        await updateDoc(docRef, formData);
        alert("Category updated successfully!");
      } else {
        await addDoc(categoriesCollection, formData);
        alert("Category added successfully!");
      }
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error handling category:", error);
      alert("There was an error while saving the category. Please try again.");
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      image: category.image,
      isFeatured: category.isFeatured || false,
    });
    setEditId(category.id);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      try {
        const docRef = doc(db, "categories", deleteId);
        await deleteDoc(docRef);
        alert("Category deleted successfully!");
        closeDeleteModal();
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("There was an error while deleting the category. Please try again.");
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
    setFormData({ name: "", image: "", isFeatured: false });
    setEditId(null);
  };

  return (
    <div className="p-8 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50 min-h-screen">
      <div className="bg-white shadow-xl rounded-lg p-8 mb-10 transform hover:scale-105 transition-transform duration-500 ease-in-out">
        <h2 className="text-4xl font-bold mb-6 text-center text-teal-700">Manage Categories</h2>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-teal-700 text-white py-4 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500 flex items-center justify-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add New Category</span>
        </button>
      </div>

      <div className="bg-white shadow-xl rounded-lg p-8">
        <h3 className="text-3xl font-bold mb-6 text-center text-teal-700">Existing Categories</h3>
        {categories.length === 0 ? (
          <p className="text-center text-teal-800">No categories found. Please add some categories.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <div key={category.id} className="border rounded-lg p-6 shadow-lg bg-white transform hover:scale-105 transition-transform duration-500 ease-in-out">
                {category.image && (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <h4 className="text-2xl font-semibold mb-4 text-teal-800">{category.name} {category.isFeatured && <span className='text-sm text-yellow-500'>(Featured)</span>}</h4>
                <div className="flex justify-between">
                  <button
                    onClick={() => handleEdit(category)}
                    className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-4 focus:ring-yellow-400 flex items-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => openDeleteModal(category.id)}
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

      {/* Modal for Add/Edit Category */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        contentLabel="Add/Edit Category Modal"
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
        <h3 className="text-3xl font-bold mb-6 text-teal-700 text-center">{editId ? "Edit Category" : "Add New Category"}</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-teal-800">Category Name</label>
            <input
              type="text"
              placeholder="Category Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
              required
            />
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
            <label className="font-semibold text-teal-800">Featured Category</label>
          </div>
          <button
            type="submit"
            className="bg-teal-700 text-white py-4 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500 flex items-center justify-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>{editId ? "Update Category" : "Add Category"}</span>
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={closeDeleteModal}
        contentLabel="Delete Category Confirmation"
        className="modal-content bg-white p-8 rounded-lg shadow-2xl max-w-md mx-auto transform hover:scale-105 transition-transform duration-500 ease-in-out"
        overlayClassName="modal-overlay fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <h3 className="text-3xl font-bold mb-6 text-teal-700 text-center">Confirm Deletion</h3>
        <p className="text-gray-700 text-lg text-center mb-8">Are you sure you want to delete this category?</p>
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

export default CategoriesAdmin;
