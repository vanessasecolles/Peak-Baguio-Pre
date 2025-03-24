import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddSpot = () => {
  const [spot, setSpot] = useState({
    name: "",
    description: "",
    image: "",
    parkingArea: "",
  });

  const handleChange = (e) => {
    setSpot({ ...spot, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, description, image, parkingArea } = spot;

    if (!name || !description || !image || !parkingArea) {
      toast.error("All fields are required.");
      return;
    }

    try {
      await setDoc(doc(db, "spots", name), {
        name,
        description,
        image,
        parkingArea,
      });

      toast.success("Spot added successfully!");

      setSpot({ name: "", description: "", image: "", parkingArea: "" });

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error("Error adding spot: ", error);
      toast.error("Failed to add spot.");
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-teal-700 mb-6">Add New Spot</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Spot Name
            </label>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              name="name"
              placeholder="Enter spot name"
              value={spot.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Press Enter for new line)
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              name="description"
              placeholder="Enter spot description"
              value={spot.description}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Image URL
            </label>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              name="image"
              placeholder="Enter image URL"
              value={spot.image}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Parking Area (Press Enter for new line)
            </label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              name="parkingArea"
              placeholder="Enter parking area details (press Enter for new line)"
              value={spot.parkingArea}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-300"
            >
              Add Spot
            </button>
          </div>
        </form>
      </div>

      <ToastContainer />
    </div>
  );
};

export default AddSpot;
