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

const tabLabels = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  luxury: "Luxury",
  midRange: "Mid Range",
  lowBudget: "Low Budget",
};

const DynamicSpotAdmin = () => {
  const { spotId } = useParams();
  const formattedSpotId = spotId.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: 0, image: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentType, setCurrentType] = useState("activities");
  const [subType, setSubType] = useState("morning");
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);

  useEffect(() => {
    if (!formattedSpotId) return;

    const itemsCollectionRef = collection(db, "spots", formattedSpotId, `${currentType}/${subType}/list`);
    const unsubscribe = onSnapshot(itemsCollectionRef, (snapshot) => {
      setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [formattedSpotId, currentType, subType]);

  const handleAddOrUpdate = async () => {
    const path = `spots/${formattedSpotId}/${currentType}/${subType}/list`;
    setOperationLoading(true);
    try {
      if (currentItem) {
        await updateDoc(doc(db, path, currentItem.id), currentItem);
        toast.success("Item updated successfully!");
      } else {
        await addDoc(collection(db, path), newItem);
        toast.success("Item added successfully!");
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${currentItem ? "update" : "add"} item.`);
    } finally {
      setTimeout(() => setOperationLoading(false), 1500);
    }
  };

  const handleDelete = async (id) => {
    const path = `spots/${formattedSpotId}/${currentType}/${subType}/list`;
    setOperationLoading(true);
    try {
      await deleteDoc(doc(db, path, id));
      toast.success("Item deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete item.");
    } finally {
      setTimeout(() => setOperationLoading(false), 1500);
    }
  };

  const openModal = (item = null) => {
    setCurrentItem(item);
    setNewItem(item || { name: "", description: "", price: 0, image: "" });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const setter = currentItem ? setCurrentItem : setNewItem;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setCurrentItem(null);
    setNewItem({ name: "", description: "", price: 0, image: "" });
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-3">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded ${currentType === "activities" ? "bg-blue-500 text-white" : "bg-gray-300"}`}
            onClick={() => { setCurrentType("activities"); setSubType("morning"); }}
          >
            Activities
          </button>
          <button
            className={`px-4 py-2 rounded ${currentType === "dining" ? "bg-blue-500 text-white" : "bg-gray-300"}`}
            onClick={() => { setCurrentType("dining"); setSubType("luxury"); }}
          >
            Dining
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(currentType === "activities" ? ["morning", "afternoon", "evening"] : ["luxury", "midRange", "lowBudget"]).map((type) => (
            <button
              key={type}
              className={`px-3 py-1 rounded ${subType === type ? "bg-green-500 text-white" : "bg-gray-300"}`}
              onClick={() => setSubType(type)}
            >
              {tabLabels[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-md rounded p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {formattedSpotId} - {tabLabels[subType]} {currentType.charAt(0).toUpperCase() + currentType.slice(1)}
          </h2>
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => openModal()}>
            <FontAwesomeIcon icon={faPlus} /> Add Item
          </button>
        </div>

        {loading || operationLoading ? (
          <p className="text-center py-4">Loading...</p>
        ) : items.length === 0 ? (
          <p>No items available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded p-4">
                <img src={item.image} alt={item.name} className="w-full h-40 object-cover mb-2 rounded" />
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-gray-600">{item.description}</p>
                <p className="text-sm text-gray-500">Price: {item.price}</p>
                <div className="flex justify-between mt-2">
                  <button className="bg-yellow-500 text-white px-3 py-1 rounded" onClick={() => openModal(item)}>
                    <FontAwesomeIcon icon={faEdit} /> Edit
                  </button>
                  <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => handleDelete(item.id)}>
                    <FontAwesomeIcon icon={faTrash} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => { setIsModalOpen(false); resetForm(); }}
        className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        {/* Modal content unchanged */}
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default DynamicSpotAdmin;
