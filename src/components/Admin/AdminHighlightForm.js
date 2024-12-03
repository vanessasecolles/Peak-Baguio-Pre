import React, { useState } from "react";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const AdminHighlightForm = () => {
  const [highlight, setHighlight] = useState({ title: "", description: "", image: "" });
  const db = getFirestore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHighlight((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "highlights"), highlight);
      alert("Highlight added successfully!");
      setHighlight({ title: "", description: "", image: "" });
    } catch (error) {
      console.error("Error adding highlight: ", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="title"
        placeholder="Title"
        value={highlight.title}
        onChange={handleChange}
        className="w-full p-3 border border-gray-300 rounded-md"
        required
      />
      <textarea
        name="description"
        placeholder="Description"
        value={highlight.description}
        onChange={handleChange}
        className="w-full p-3 border border-gray-300 rounded-md"
        rows="3"
        required
      ></textarea>
      <input
        type="text"
        name="image"
        placeholder="Image URL"
        value={highlight.image}
        onChange={handleChange}
        className="w-full p-3 border border-gray-300 rounded-md"
        required
      />
      <button
        type="submit"
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Add Highlight
      </button>
    </form>
  );
};

export default AdminHighlightForm;
