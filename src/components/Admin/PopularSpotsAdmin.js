import React, { useState, useEffect } from "react";
import { db, storage } from "../../firebaseConfig";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

const PopularSpotsAdmin = () => {
  const [spots, setSpots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: "", description: "", image: "", isFeatured: false, category: "" });
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const spotsCollection = collection(db, "popularsSpots");
  const categoriesCollection = collection(db, "categories");

  useEffect(() => {
    const unsubscribeSpots = onSnapshot(spotsCollection, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSpots(data);
    });

    const unsubscribeCategories = onSnapshot(categoriesCollection, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(data);
    });

    return () => {
      unsubscribeSpots();
      unsubscribeCategories();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = formData.image;

      if (imageFile) {
        const imageRef = ref(storage, `popularsSpots/${uuidv4()}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const newSpotData = {
        name: formData.name,
        description: formData.description,
        image: imageUrl,
        isFeatured: formData.isFeatured,
        category: formData.category,
      };

      if (editId) {
        const docRef = doc(db, "popularsSpots", editId);
        await updateDoc(docRef, newSpotData);
        alert("Popular spot updated successfully!");
      } else {
        await addDoc(spotsCollection, newSpotData);
        alert("Popular spot added successfully!");
      }

      setFormData({ name: "", description: "", image: "", isFeatured: false, category: "" });
      setImageFile(null);
      setEditId(null);
    } catch (error) {
      console.error("Error handling popular spot:", error);
      alert("There was an error while saving the popular spot. Please try again.");
    }
  };

  const handleEdit = (spot) => {
    setFormData({
      name: spot.name,
      description: spot.description,
      image: spot.image,
      isFeatured: spot.isFeatured || false,
      category: spot.category || "",
    });
    setEditId(spot.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this popular spot?")) {
      try {
        const docRef = doc(db, "popularsSpots", id);
        await deleteDoc(docRef);
        alert("Popular spot deleted successfully!");
      } catch (error) {
        console.error("Error deleting popular spot:", error);
        alert("There was an error while deleting the popular spot. Please try again.");
      }
    }
  };

  return (
    <div className="p-8 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50 min-h-screen">
      <div className="bg-white shadow-xl rounded-lg p-8 mb-10 transform hover:scale-105 transition-transform duration-500 ease-in-out">
        <h2 className="text-4xl font-bold mb-6 text-center text-teal-700">Manage Popular Spots</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-teal-800">Spot Name</label>
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <label className="font-semibold mb-2 text-teal-800">Image Upload</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
            />
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
            <label className="font-semibold text-teal-800">Featured Spot</label>
          </div>
          <button
            type="submit"
            className="bg-teal-700 text-white py-4 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500 flex items-center justify-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>{editId ? "Update Spot" : "Add Spot"}</span>
          </button>
        </form>
      </div>

      <div className="bg-white shadow-xl rounded-lg p-8">
        <h3 className="text-3xl font-bold mb-6 text-center text-teal-700">Existing Popular Spots</h3>
        {spots.length === 0 ? (
          <p className="text-center text-teal-800">No popular spots found. Please add some spots.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {spots.map((spot) => (
              <div key={spot.id} className="border rounded-lg p-6 shadow-lg bg-white transform hover:scale-105 transition-transform duration-500 ease-in-out">
                {spot.image && (
                  <img
                    src={spot.image}
                    alt={spot.name}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <h4 className="text-2xl font-semibold mb-4 text-teal-800">{spot.name} {spot.isFeatured && <span className='text-sm text-yellow-500'>(Featured)</span>}</h4>
                <p className="text-gray-700 mb-4">{spot.description}</p>
                <p className="text-gray-600 mb-4">Category: {spot.category}</p>
                <div className="flex justify-between">
                  <button
                    onClick={() => handleEdit(spot)}
                    className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-4 focus:ring-yellow-400 flex items-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(spot.id)}
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
    </div>
  );
};

export default PopularSpotsAdmin;