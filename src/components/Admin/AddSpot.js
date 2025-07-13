import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { toast, ToastContainer } from "react-toastify";
import ReactQuill from "react-quill"; 
import "react-quill/dist/quill.snow.css"; // Import Quill's default styling
import "react-toastify/dist/ReactToastify.css";

const AddSpot = () => {
  const [spot, setSpot] = useState({
    name: "",
    description: "",
    image: "",
    parkingArea: "",
  });

  // Quill toolbar configuration (bold, italic, underline, etc.)
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],        // Heading levels
      ["bold", "italic", "underline"],    // Text style buttons
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],                           // Link insert
      ["clean"],                          // Remove formatting
    ],
  };

  const handleChange = (e) => {
    // For normal text inputs (name, image), we do the usual:
    setSpot({ ...spot, [e.target.name]: e.target.value });
  };

  const handleDescriptionChange = (value) => {
    // For the Quill editor, 'value' is an HTML string
    setSpot((prev) => ({ ...prev, description: value }));
  };

  const handleParkingChange = (value) => {
    // Similarly for the parking area
    setSpot((prev) => ({ ...prev, parkingArea: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, description, image, parkingArea } = spot;

    if (!name || !description || !image || !parkingArea) {
      toast.error("All fields are required.");
      return;
    }

    try {
      // Storing HTML strings from Quill in Firestore
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
    <div className="min-h-screen p-8 bg-gray-100 flex items-center justify-center md:ml-64">
      <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-teal-700 mb-6">Add New Spot</h2>

        <form onSubmit={handleSubmit}>
          {/* Spot Name */}
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

          {/* Description using ReactQuill */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <ReactQuill
              theme="snow"
              value={spot.description}
              onChange={handleDescriptionChange}
              modules={quillModules}
              placeholder="Describe the spot (bold, italic, bullet points, etc.)"
            />
          </div>

          {/* Image URL */}
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

          {/* Parking Area using ReactQuill */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Parking Area
            </label>
            <ReactQuill
              theme="snow"
              value={spot.parkingArea}
              onChange={handleParkingChange}
              modules={quillModules}
              placeholder="Provide parking area details"
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
