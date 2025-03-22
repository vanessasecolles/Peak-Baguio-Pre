import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDoc, setDoc } from "firebase/firestore";
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
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", description: "", price: 0, image: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentType, setCurrentType] = useState("activities");
  const [subType, setSubType] = useState("morning");
  const [loading, setLoading] = useState(true);
  const [spotDescription, setSpotDescription] = useState("");
  const [spotImage, setSpotImage] = useState("");
  const [isSpotModalOpen, setIsSpotModalOpen] = useState(false);

  const formattedSpotId = spotId
    ? spotId.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "";

  useEffect(() => {
    if (!spotId) {
      navigate("/", { replace: true });
      return;
    }

    const itemsCollectionRef = collection(
      db,
      "spots",
      formattedSpotId,
      `${currentType}/${subType}/list`
    );

    const unsubscribe = onSnapshot(itemsCollectionRef, (snapshot) => {
      setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const fetchSpotDetails = async () => {
      const spotDocRef = doc(db, "spots", formattedSpotId);
      const spotDocSnap = await getDoc(spotDocRef);
      if (spotDocSnap.exists()) {
        setSpotDescription(spotDocSnap.data().description || "");
        setSpotImage(spotDocSnap.data().image || "");
      }
    };

    fetchSpotDetails();

    return () => unsubscribe();
  }, [spotId, formattedSpotId, currentType, subType, navigate]);

  const handleAddOrUpdate = async () => {
    const path = `spots/${formattedSpotId}/${currentType}/${subType}/list`;
    try {
      currentItem
        ? await updateDoc(doc(db, path, currentItem.id), currentItem)
        : await addDoc(collection(db, path), newItem);

      toast.success(`Item ${currentItem ? "updated" : "added"} successfully!`);
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error(`Failed to ${currentItem ? "update" : "add"} item.`);
    }
  };

  const handleDelete = async (id) => {
    const path = `spots/${formattedSpotId}/${currentType}/${subType}/list`;
    try {
      await deleteDoc(doc(db, path, id));
      toast.success("Item deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete item.");
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

  const saveSpotDetails = async () => {
    const spotDocRef = doc(db, "spots", formattedSpotId);
    try {
      await setDoc(spotDocRef, { description: spotDescription, image: spotImage }, { merge: true });
      setIsSpotModalOpen(false);
      toast.success("Spot details updated successfully!");
    } catch (error) {
      toast.error("Failed to update spot details.");
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="bg-white shadow-md rounded p-4 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{formattedSpotId}</h2>
          <button className="bg-yellow-500 text-white px-3 py-1 rounded" onClick={() => setIsSpotModalOpen(true)}>
            <FontAwesomeIcon icon={faEdit} /> Edit Spot Details
          </button>
        </div>
        <img src={spotImage} alt={formattedSpotId} className="mt-4 rounded w-full h-60 object-cover"/>
        <p className="mt-2 text-gray-700">{spotDescription}</p>
      </div>

      <div className="flex justify-between mb-4">
        <div>
          <button className={`px-4 py-2 mr-2 rounded ${currentType === "activities" ? "bg-blue-500 text-white" : "bg-gray-300"}`} onClick={() => { setCurrentType("activities"); setSubType("morning"); }}>Activities</button>
          <button className={`px-4 py-2 rounded ${currentType === "dining" ? "bg-blue-500 text-white" : "bg-gray-300"}`} onClick={() => { setCurrentType("dining"); setSubType("luxury"); }}>Dining</button>
        </div>

        <div className="flex gap-2">
          {(currentType === "activities" ? ["morning", "afternoon", "evening"] : ["luxury", "midRange", "lowBudget"]).map((type) => (
            <button key={type} className={`px-3 py-1 rounded ${subType === type ? "bg-green-500 text-white" : "bg-gray-300"}`} onClick={() => setSubType(type)}>
              {tabLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p>Loading...</p> : items.length === 0 ? <p>No items available.</p> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="border rounded p-4">
              <img src={item.image} alt={item.name} className="w-full h-40 object-cover rounded mb-2"/>
              <h3 className="font-bold">{item.name}</h3>
              <p>{item.description}</p>
              <p className="text-sm">Price: {item.price}</p>
              <button className="bg-yellow-500 px-3 py-1 rounded text-white mr-2" onClick={() => openModal(item)}><FontAwesomeIcon icon={faEdit} /></button>
              <button className="bg-red-500 px-3 py-1 rounded text-white" onClick={() => handleDelete(item.id)}><FontAwesomeIcon icon={faTrash} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Modals for item and spot details */}
      {/* Keep modals exactly as previously given */}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{currentItem ? "Edit Item" : "Add New Item"}</h3>
          <button onClick={() => setIsModalOpen(false)}>
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <input
          className="w-full p-2 border rounded mb-3"
          name="name"
          placeholder="Item Name"
          value={currentItem ? currentItem.name : newItem.name}
          onChange={handleInputChange}
        />
        <textarea
          className="w-full p-2 border rounded mb-3"
          name="description"
          placeholder="Item Description"
          value={currentItem ? currentItem.description : newItem.description}
          onChange={handleInputChange}
          rows={3}
        />
        <input
          className="w-full p-2 border rounded mb-3"
          name="image"
          placeholder="Item Image URL"
          value={currentItem ? currentItem.image : newItem.image}
          onChange={handleInputChange}
        />
        <input
          className="w-full p-2 border rounded mb-3"
          type="number"
          name="price"
          placeholder="Price"
          value={currentItem ? currentItem.price : newItem.price}
          onChange={handleInputChange}
        />

        <button
          className="bg-teal-600 text-white px-4 py-2 rounded float-right"
          onClick={handleAddOrUpdate}
        >
          {currentItem ? "Update" : "Add"}
        </button>
      </Modal>

      <Modal
        isOpen={isSpotModalOpen}
        onRequestClose={() => setIsSpotModalOpen(false)}
        className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Edit Spot Details</h3>
          <button onClick={() => setIsSpotModalOpen(false)}>
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <input
          className="w-full p-2 border rounded mb-3"
          placeholder="Spot Image URL"
          value={spotImage}
          onChange={(e) => setSpotImage(e.target.value)}
        />

        <textarea
          className="w-full p-2 border rounded mb-3"
          rows={4}
          placeholder="Spot Description"
          value={spotDescription}
          onChange={(e) => setSpotDescription(e.target.value)}
        />

        <button
          className="bg-teal-600 text-white px-4 py-2 rounded float-right"
          onClick={saveSpotDetails}
        >
          Save Changes
        </button>
      </Modal>



      <ToastContainer />
    </div>
  );
};

export default DynamicSpotAdmin;
