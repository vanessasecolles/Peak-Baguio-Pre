import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const GenerateItineraryAdmin = () => {
  const [fields, setFields] = useState({ budgets: [], durations: [], interests: [] });
  const [formData, setFormData] = useState({
    type: "budget",
    value: "",
  });
  const [editId, setEditId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch itinerary fields dynamically from Firestore
  useEffect(() => {
    const itineraryDoc = doc(db, "itineraryFields", "fields");
    const unsubscribe = onSnapshot(itineraryDoc, (snapshot) => {
      if (snapshot.exists()) {
        setFields(snapshot.data());
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle form submission for adding or updating a field
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itineraryDoc = doc(db, "itineraryFields", "fields");
      const updatedFields = { ...fields };

      if (editId !== null) {
        // Update existing field
        updatedFields[formData.type][editId] = formData.value;
      } else {
        // Add new field
        updatedFields[formData.type] = [...updatedFields[formData.type], formData.value];
      }

      await updateDoc(itineraryDoc, updatedFields);
      alert(editId !== null ? "Field updated successfully!" : "Field added successfully!");
      setFormData({ type: "budget", value: "" });
      setEditId(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error handling field:", error);
      alert("There was an error while saving the field. Please try again.");
    }
  };

  // Handle edit button click
  const handleEdit = (type, index) => {
    setFormData({ type, value: fields[type][index] });
    setEditId(index);
    setIsModalOpen(true);
  };

  // Handle delete button click
  const handleDelete = async (type, index) => {
    if (window.confirm("Are you sure you want to delete this field?")) {
      try {
        const itineraryDoc = doc(db, "itineraryFields", "fields");
        const updatedFields = { ...fields };
        updatedFields[type].splice(index, 1);

        await updateDoc(itineraryDoc, updatedFields);
        alert("Field deleted successfully!");
      } catch (error) {
        console.error("Error deleting field:", error);
        alert("There was an error while deleting the field. Please try again.");
      }
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setFormData({ type: "budget", value: "" });
    setEditId(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-8 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50 min-h-screen">
      <div className="bg-white shadow-2xl rounded-xl p-8 mb-12 transform hover:scale-105 transition-transform duration-500 ease-in-out">
        <h2 className="text-4xl font-bold mb-6 text-center text-teal-800">Manage Itinerary Fields</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-800 text-white py-3 px-6 rounded-lg hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-500 flex items-center justify-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out text-base"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add New Field</span>
        </button>
      </div>

      <div className="bg-white shadow-2xl rounded-xl p-8">
        <h3 className="text-3xl font-bold mb-6 text-center text-teal-800">Existing Fields</h3>
        {Object.keys(fields).map((type) => (
          <div key={type} className="mb-10">
            <h4 className="text-2xl font-semibold mb-4 capitalize text-teal-900">{type}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {fields[type].map((value, index) => (
                <div key={index} className="border rounded-lg p-6 shadow-lg bg-white transform hover:scale-105 transition-transform duration-500 ease-in-out">
                  <p className="text-gray-700 mb-4 text-base">{value}</p>
                  <div className="flex justify-between">
                    <button
                      onClick={() => handleEdit(type, index)}
                      className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-4 focus:ring-yellow-400 flex items-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out text-base"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(type, index)}
                      className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-400 flex items-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out text-base"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal for Add/Edit Field */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        contentLabel="Add/Edit Field Modal"
        className="modal-content bg-white p-8 rounded-lg shadow-2xl max-w-md mx-auto transform hover:scale-105 transition-transform duration-500 ease-in-out"
        overlayClassName="modal-overlay fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-3xl font-bold text-teal-700 text-center">{editId !== null ? "Edit Field" : "Add New Field"}</h3>
          <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
            <FontAwesomeIcon icon={faTimes} size="2x" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-teal-900 text-lg">Field Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="p-3 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out text-base"
              required
            >
              <option value="budget">Budget</option>
              <option value="duration">Duration</option>
              <option value="interest">Interest</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-teal-900 text-lg">Field Value</label>
            <input
              type="text"
              id="value"
              name="value"
              value={formData.value}
              onChange={handleChange}
              className="p-3 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out text-base"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-teal-800 text-white py-3 px-6 rounded-lg hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-500 flex items-center justify-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out text-base"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>{editId !== null ? "Update Field" : "Add Field"}</span>
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default GenerateItineraryAdmin;
