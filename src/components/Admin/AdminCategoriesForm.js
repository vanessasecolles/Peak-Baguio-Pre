import React, { useState } from "react";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const AdminCategoriesForm = () => {
  const [category, setCategory] = useState({ name: "", image: "" });
  const db = getFirestore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCategory((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "categories"), category);
      alert("Category added successfully!");
      setCategory({ name: "", image: "" });
    } catch (error) {
      console.error("Error adding category: ", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="Category Name"
        value={category.name}
        onChange={handleChange}
        className="w-full p-3 border border-gray-300 rounded-md"
        required
      />
      <input
        type="text"
        name="image"
        placeholder="Image URL"
        value={category.image}
        onChange={handleChange}
        className="w-full p-3 border border-gray-300 rounded-md"
        required
      />
      <button
        type="submit"
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Add Category
      </button>
    </form>
  );
};

export default AdminCategoriesForm;
