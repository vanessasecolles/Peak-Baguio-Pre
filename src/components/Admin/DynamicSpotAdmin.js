import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

Modal.setAppElement("#root");

const DynamicSpotAdmin = () => {
  const { spotId } = useParams();
  const formattedSpotId = spotId
    .replace(/-/g, " ") // Replace hyphens with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize each word

  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: 0,
    image: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [currentType, setCurrentType] = useState("activities"); // "activities" or "dining"
  const [subType, setSubType] = useState("morning"); // "morning", "afternoon", "evening", "luxury", "midRange", "lowBudget"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!formattedSpotId) return;

    const fetchItems = () => {
      const subCollectionPath = `${currentType}/${subType}/list`;
      const itemsCollectionRef = collection(db, "spots", formattedSpotId, subCollectionPath);

      const unsubscribe = onSnapshot(
        itemsCollectionRef,
        (snapshot) => {
          const itemsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setItems(itemsData);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching items:", error);
        }
      );

      return () => unsubscribe();
    };

    fetchItems();
  }, [formattedSpotId, currentType, subType]);

  const handleAddItem = async () => {
    const subCollectionPath = `${currentType}/${subType}/list`;
    const itemsCollectionRef = collection(db, "spots", formattedSpotId, subCollectionPath);

    try {
      await addDoc(itemsCollectionRef, newItem);
      toast.success("Item added successfully!");
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item.");
    }
  };

  const handleUpdateItem = async () => {
    const subCollectionPath = `${currentType}/${subType}/list`;
    const docRef = doc(db, "spots", formattedSpotId, subCollectionPath, currentItem.id);

    try {
      await updateDoc(docRef, currentItem);
      toast.success("Item updated successfully!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item.");
    }
  };

  const handleDeleteItem = async () => {
    const subCollectionPath = `${currentType}/${subType}/list`;
    const docRef = doc(db, "spots", formattedSpotId, subCollectionPath, deleteId);

    try {
      await deleteDoc(docRef);
      toast.success("Item deleted successfully!");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item.");
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setCurrentItem(item);
    } else {
      setCurrentItem(null);
      setNewItem({
        name: "",
        description: "",
        price: 0,
        image: "",
      });
    }
    setIsModalOpen(true);
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

  const closeModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setCurrentItem(null);
    setNewItem({
      name: "",
      description: "",
      price: 0,
      image: "",
    });
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between mb-6">
        <div>
          <button
            className={`px-4 py-2 mr-2 ${currentType === "activities" ? "bg-blue-500 text-white" : "bg-gray-300"}`}
            onClick={() => {
              setCurrentType("activities");
              setSubType("morning");
            }}
          >
            Activities
          </button>
          <button
            className={`px-4 py-2 ${currentType === "dining" ? "bg-blue-500 text-white" : "bg-gray-300"}`}
            onClick={() => {
              setCurrentType("dining");
              setSubType("luxury");
            }}
          >
            Dining
          </button>
        </div>
        <div>
          {["morning", "afternoon", "evening", "luxury", "midRange", "lowBudget"]
            .filter((type) => (currentType === "activities" ? ["morning", "afternoon", "evening"] : ["luxury", "midRange", "lowBudget"]).includes(type))
            .map((type) => (
              <button
                key={type}
                className={`px-3 py-1 mr-2 ${subType === type ? "bg-green-500 text-white" : "bg-gray-300"}`}
                onClick={() => setSubType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
        </div>
      </div>

      <div className="bg-white shadow-md rounded p-4">
        <h2 className="text-2xl font-bold mb-4">{`${formattedSpotId} - ${subType.charAt(0).toUpperCase() + subType.slice(1)} ${currentType}`}</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
          onClick={() => openModal()}
        >
          <FontAwesomeIcon icon={faPlus} /> Add Item
        </button>
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <p>No items available in this category.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded p-4">
                <img src={item.image} alt={item.name} className="w-full h-40 object-cover mb-4" />
                <h3 className="font-bold text-xl">{item.name}</h3>
                <p>{item.description}</p>
                <p className="text-gray-500">Price: {item.price}</p>
                <div className="flex justify-between mt-4">
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                    onClick={() => openModal(item)}
                  >
                    <FontAwesomeIcon icon={faEdit} /> Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded"
                    onClick={() => {
                        console.log(item.id)
                      setDeleteId(item.id);
                      handleDeleteItem();
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="modal-content bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-auto"
        overlayClassName="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-teal-700">
            {currentItem ? "Edit Item" : "Add New Item"}
            </h3>
            <button
            className="text-gray-500 hover:text-gray-700"
            onClick={closeModal}
            >
            <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
        </div>
        <form>
            <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name
            </label>
            <input
                type="text"
                name="name"
                value={currentItem ? currentItem.name : newItem.name}
                onChange={handleInputChange}
                placeholder="Enter name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
            />
            </div>
            <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
            </label>
            <textarea
                name="description"
                value={currentItem ? currentItem.description : newItem.description}
                onChange={handleInputChange}
                placeholder="Enter description"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                rows="4"
                required
            ></textarea>
            </div>
            <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Image URL
            </label>
            <input
                type="text"
                name="image"
                value={currentItem ? currentItem.image : newItem.image}
                onChange={handleInputChange}
                placeholder="Enter image URL"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            </div>
            <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price
            </label>
            <input
                type="number"
                name="price"
                value={currentItem ? currentItem.price : newItem.price}
                onChange={handleInputChange}
                placeholder="Enter price"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            </div>
            <div className="flex justify-end space-x-4">
            <button
                type="button"
                onClick={closeModal}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
                Cancel
            </button>
            <button
                type="button"
                onClick={currentItem ? handleUpdateItem : handleAddItem}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
                {currentItem ? "Save Changes" : "Add Item"}
            </button>
            </div>
        </form>
        </Modal>


      <ToastContainer />
    </div>
  );
};

export default DynamicSpotAdmin;
