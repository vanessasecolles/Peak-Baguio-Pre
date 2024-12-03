import React, { useState } from "react";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const AdminPopularSpotsForm = () => {
  const [spot, setSpot] = useState({ title: "", description: "", image: "" });
  const db = getFirestore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSpot((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "popularsSpots"), spot);
      alert("Popular Spot added successfully!");
      setSpot({ title: "", description: "", image: "" });
    } catch (error) {
      console.error("Error adding popular spot: ", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="title"
        placeholder="Title"
        value={spot.title}
        onChange={handleChange}
        className="w-full p-3 border border-gray-300 rounded-md"
        required
      />
      <textarea
        name="description"
        placeholder="Description"
        value={spot.description}
        onChange={handleChange}
        className="w-full p-3 border border-gray-300 rounded-md"
        rows="3"
        required
      ></textarea>
      <input
        type="text"
        name="image"
        placeholder="Image URL"
        value={spot.image}
        onChange={handleChange}
        className="w-full p-3 border border-gray-300 rounded-md"
        required
      />
      <button
        type="submit"
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Add Popular Spot
      </button>
    </form>
  );
};

export default AdminPopularSpotsForm;
