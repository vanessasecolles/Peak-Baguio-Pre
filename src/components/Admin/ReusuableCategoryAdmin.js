import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

Modal.setAppElement("#root");

const DynamicSpotAdmin = ({ spotId, type }) => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    image: "",
    description: "",
    price: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);

  const sectionTitle = type.charAt(0).toUpperCase() + type.slice(1);

  useEffect(() => {
    const fetchItems = () => {
      const itemsCollectionRef = collection(db, "spots", spotId, type);
      const unsubscribe = onSnapshot(itemsCollectionRef, (snapshot) => {
        const itemsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemsData);
      });

      return () => unsubscribe();
    };

    fetchItems();
  }, [spotId, type]);

  const handleAddItem = async () => {
    try {
      setLoading(true);
      const itemsCollectionRef = collection(db, "spots", spotId, type);
      await addDoc(itemsCollectionRef, newItem);
      resetForm();
      setIsModalOpen(false);
      toast.success(`${sectionTitle} added successfully!`);
    } catch (error) {
      console.error(`Error adding ${type}: `, error);
      toast.error(`Error adding ${type}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async () => {
    if (!currentItem) return;
    try {
      setLoading(true);
      const itemDocRef = doc(db, "spots", spotId, type, currentItem.id);
      await updateDoc(itemDocRef, currentItem);
      resetForm();
      setIsModalOpen(false);
      toast.success(`${sectionTitle} updated successfully!`);
    } catch (error) {
      console.error(`Error updating ${type}: `, error);
      toast.error(`Error updating ${type}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    try {
      setLoading(true);
      const itemDocRef = doc(db, "spots", spotId, type, deleteId);
      await deleteDoc(itemDocRef);
      closeDeleteModal();
      toast.success(`${sectionTitle} deleted successfully!`);
    } catch (error) {
      console.error(`Error deleting ${type}: `, error);
      toast.error(`Error deleting ${type}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setCurrentItem(item);
    } else {
      setCurrentItem(null);
      setNewItem({
        name: "",
        image: "",
        description: "",
        price: 0,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
    setIsDeleteModalOpen(false);
  };

  const resetForm = () => {
    setCurrentItem(null);
    setNewItem({
      name: "",
      image: "",
      description: "",
      price: 0,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (currentItem) {
      setCurrentItem((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setNewItem((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="p-8 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50 min-h-screen">
      <div className="bg-white shadow-xl rounded-lg p-8 mb-10">
        <h2 className="text-4xl font-bold mb-6 text-center text-teal-700">{sectionTitle} Management</h2>
        <button
          onClick={() => openModal()}
          className="bg-teal-700 text-white py-4 px-6 rounded-lg hover:bg-teal-800"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add New {sectionTitle}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center text-teal-700">Loading...</div>
      ) : (
        <div className="bg-white shadow-xl rounded-lg p-8">
          <h3 className="text-3xl font-bold mb-6 text-center text-teal-700">Manage {sectionTitle}</h3>
          {items.length === 0 ? (
            <p className="text-center text-teal-800">No {type} available. Please add some.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg p-6 shadow-lg bg-white">
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-48 object-cover mb-4" />}
                  <h4 className="text-2xl font-semibold mb-4">{item.name}</h4>
                  <p className="text-gray-700 mb-4">{item.description}</p>
                  <p className="text-gray-700 mb-4">Price: {item.price}</p>
                  <div className="flex justify-between">
                    <button onClick={() => openModal(item)} className="bg-yellow-500 text-white py-2 px-4 rounded-lg">
                      <FontAwesomeIcon icon={faEdit} />
                      Edit
                    </button>
                    <button onClick={() => openDeleteModal(item.id)} className="bg-red-500 text-white py-2 px-4 rounded-lg">
                      <FontAwesomeIcon icon={faTrash} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onRequestClose={closeModal}>
        <h3>{currentItem ? "Edit Item" : "Add New Item"}</h3>
        {/* Form Fields */}
        <input
          type="text"
          name="name"
          value={currentItem ? currentItem.name : newItem.name}
          onChange={handleInputChange}
          placeholder="Name"
        />
        <textarea
          name="description"
          value={currentItem ? currentItem.description : newItem.description}
          onChange={handleInputChange}
          placeholder="Description"
        />
        <input
          type="text"
          name="image"
          value={currentItem ? currentItem.image : newItem.image}
          onChange={handleInputChange}
          placeholder="Image URL"
        />
        <input
          type="number"
          name="price"
          value={currentItem ? currentItem.price : newItem.price}
          onChange={handleInputChange}
          placeholder="Price"
        />
        <button onClick={currentItem ? handleUpdateItem : handleAddItem}>
          {currentItem ? "Save Changes" : "Add Item"}
        </button>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default DynamicSpotAdmin;
