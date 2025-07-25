import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDoc,
  setDoc,
} from "firebase/firestore";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faPlus,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

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
  const [currentType, setCurrentType] = useState("activities");
  const [subType, setSubType] = useState("morning");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", description: "", image: "" });

  const [spotDescription, setSpotDescription] = useState("");
  const [spotImage, setSpotImage] = useState("");
  const [spotParkingArea, setSpotParkingArea] = useState("");
  const [isSpotModalOpen, setIsSpotModalOpen] = useState(false);

  const formattedSpotId = spotId
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  useEffect(() => {
    if (!spotId) {
      navigate("/", { replace: true });
      return;
    }
    setLoading(true);
    const itemsRef = collection(
      db,
      "spots",
      formattedSpotId,
      currentType,
      subType,
      "list"
    );
    const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
      setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    getDoc(doc(db, "spots", formattedSpotId)).then((spotDoc) => {
      if (spotDoc.exists()) {
        const data = spotDoc.data();
        setSpotDescription(data.description || "");
        setSpotImage(data.image || "");
        setSpotParkingArea(data.parkingArea || "");
      }
    });
    return () => unsubscribe();
  }, [spotId, formattedSpotId, currentType, subType, navigate]);

  const handleAddOrUpdate = async () => {
    const path = `spots/${formattedSpotId}/${currentType}/${subType}/list`;
    try {
      if (currentItem) {
        await updateDoc(doc(db, path, currentItem.id), currentItem);
      } else {
        await addDoc(collection(db, path), newItem);
      }
      toast.success(`Item ${currentItem ? "updated" : "added"} successfully!`);
      setIsModalOpen(false);
      resetForm();
    } catch {
      toast.error(`Failed to ${currentItem ? "update" : "add"} item.`);
    }
  };

  const handleDelete = async (id) => {
    const path = `spots/${formattedSpotId}/${currentType}/${subType}/list`;
    try {
      await deleteDoc(doc(db, path, id));
      toast.success("Item deleted successfully!");
    } catch {
      toast.error("Failed to delete item.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const setter = currentItem ? setCurrentItem : setNewItem;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setCurrentItem(null);
    setNewItem({ name: "", description: "", image: "" });
  };

  const openModal = (item = null) => {
    setCurrentItem(item);
    setNewItem(item || { name: "", description: "", image: "" });
    setIsModalOpen(true);
  };

  const saveSpotDetails = async () => {
    await setDoc(
      doc(db, "spots", formattedSpotId),
      { description: spotDescription, image: spotImage, parkingArea: spotParkingArea },
      { merge: true }
    );
    setIsSpotModalOpen(false);
    toast.success("Spot details updated successfully!");
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen md:ml-64">
      {/* Spot Details */}
      <div className="bg-white shadow-md rounded p-4 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{formattedSpotId}</h2>
          <button
            className="bg-yellow-500 text-white px-3 py-1 rounded"
            onClick={() => setIsSpotModalOpen(true)}
          >
            <FontAwesomeIcon icon={faEdit} /> Edit Spot Details
          </button>
        </div>
        <img src={spotImage} alt="" className="mt-4 rounded w-full h-60 object-cover" />
        <div className="mt-2 text-gray-700" dangerouslySetInnerHTML={{ __html: spotDescription }} />
        <div className="mt-1 text-gray-500">
          <strong>Parking Area:</strong>{' '}
          <span dangerouslySetInnerHTML={{ __html: spotParkingArea }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-between mb-4">
        <div>
          <button
            className={`${currentType === 'activities' ? 'bg-blue-500 text-white' : 'bg-gray-300'} px-4 py-2 rounded mr-2`}
            onClick={() => { setCurrentType('activities'); setSubType('morning'); }}
          >Activities</button>
          <button
            className={`${currentType === 'dining' ? 'bg-blue-500 text-white' : 'bg-gray-300'} px-4 py-2 rounded`}
            onClick={() => { setCurrentType('dining'); setSubType('luxury'); }}
          >Dining</button>
        </div>
        <div className="flex gap-2">
          {(currentType === 'activities'
            ? ['morning','afternoon','evening']
            : ['luxury','midRange','lowBudget']
          ).map(type => (
            <button
              key={type}
              className={`${subType === type ? 'bg-green-500 text-white' : 'bg-gray-300'} px-3 py-1 rounded`}
              onClick={() => setSubType(type)}
            >{tabLabels[type]}</button>
          ))}
        </div>
      </div>

      {/* Add Item */}
      <div className="flex justify-end mb-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => openModal()}
        ><FontAwesomeIcon icon={faPlus} /> Add {currentType === 'activities' ? 'Activity' : 'Dining Option'}</button>
      </div>

      {/* Items List */}
      {loading ? <p>Loading...</p> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="border rounded p-4">
              <img src={item.image} alt="" className="w-full h-40 object-cover rounded mb-2" />
              <h3 className="font-bold">{item.name}</h3>
              <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: item.description }} />
              {currentType === 'dining' && <p className="text-sm">{item.price}</p>}
              <button className="bg-yellow-500 text-white px-3 py-1 rounded mr-2" onClick={() => openModal(item)}><FontAwesomeIcon icon={faEdit} /></button>
              <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => handleDelete(item.id)}><FontAwesomeIcon icon={faTrash} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Spot Modal */}
      <Modal isOpen={isSpotModalOpen} onRequestClose={() => setIsSpotModalOpen(false)} className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <h3 className="font-bold mb-4">Edit Spot Details</h3>
        <input className="w-full p-2 border rounded mb-3" placeholder="Spot Image URL" value={spotImage} onChange={e => setSpotImage(e.target.value)} />
        <ReactQuill theme="snow" value={spotDescription} onChange={setSpotDescription} modules={quillModules} placeholder="Spot Description" />
        <ReactQuill theme="snow" value={spotParkingArea} onChange={setSpotParkingArea} modules={quillModules} placeholder="Parking Area" />
        <button className="bg-teal-600 text-white px-4 py-2 rounded float-right mt-4" onClick={saveSpotDetails}>Save Changes</button>
      </Modal>

      {/* Item Modal */}
      <Modal isOpen={isModalOpen} onRequestClose={() => { setIsModalOpen(false); resetForm(); }} className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto" overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{currentItem ? 'Edit Item' : 'Add New Item'}</h3>
          <button onClick={() => setIsModalOpen(false)}><FontAwesomeIcon icon={faTimes} size="lg" /></button>
        </div>
        <input className="w-full p-2 border rounded mb-3" name="name" placeholder="Item Name" value={currentItem?.name || newItem.name} onChange={handleInputChange} />
        <ReactQuill theme="snow" value={currentItem?.description || newItem.description} onChange={value => { currentItem ? setCurrentItem(prev => ({...prev, description: value})) : setNewItem(prev => ({...prev, description: value})); }} modules={quillModules} placeholder="Item Description" />
        <input className="w-full p-2 border rounded mb-3" name="image" placeholder="Item Image URL" value={currentItem?.image || newItem.image} onChange={handleInputChange} />
        {/* Only show price input for dining */}
        {currentType === 'dining' && (
          <input className="w-full p-2 border rounded mb-3" type="text" name="price" placeholder="Price (e.g. '100 PHP', 'Free')" value={currentItem?.price || newItem.price} onChange={handleInputChange} />
        )}
        <button className="bg-teal-600 text-white px-4 py-2 rounded float-right" onClick={handleAddOrUpdate}>{currentItem ? 'Update' : 'Add'}</button>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default DynamicSpotAdmin;
