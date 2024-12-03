import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

Modal.setAppElement("#root");

const ReusableCategoryAdmin = ({ categoryName }) => {
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({
    name: "",
    image: "",
    isFeatured: false,
    logisticalDetails: "",
    nearbyAttractions: "",
    budget: "",
    backgroundInformation: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchActivities = () => {
      const placesCollectionRef = collection(db, "categories", categoryName, "places");
      const unsubscribe = onSnapshot(placesCollectionRef, (snapshot) => {
        const activitiesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActivities(activitiesData);
      });

      return () => unsubscribe();
    };

    fetchActivities();
  }, [categoryName]);

  const handleAddActivity = async () => {
    try {
      setLoading(true);
      const placesCollectionRef = collection(db, "categories", categoryName, "places");
      await addDoc(placesCollectionRef, newActivity);
      resetForm();
      setIsModalOpen(false);
      toast.success("Activity added successfully!");
    } catch (error) {
      console.error("Error adding activity: ", error);
      toast.error("Error adding activity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateActivity = async () => {
    if (!currentActivity) return;
    try {
      setLoading(true);
      const activityDocRef = doc(db, "categories", categoryName, "places", currentActivity.id);
      await updateDoc(activityDocRef, currentActivity);
      resetForm();
      setIsModalOpen(false);
      toast.success("Activity updated successfully!");
    } catch (error) {
      console.error("Error updating activity: ", error);
      toast.error("Error updating activity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async () => {
    try {
      setLoading(true);
      const activityDocRef = doc(db, "categories", categoryName, "places", deleteId);
      await deleteDoc(activityDocRef);
      closeDeleteModal();
      toast.success("Activity deleted successfully!");
    } catch (error) {
      console.error("Error deleting activity: ", error);
      toast.error("Error deleting activity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (activity = null) => {
    if (activity) {
      setCurrentActivity(activity);
    } else {
      setCurrentActivity(null);
      setNewActivity({
        name: "",
        image: "",
        isFeatured: false,
        logisticalDetails: "",
        nearbyAttractions: "",
        budget: "",
        backgroundInformation: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
    setIsDeleteModalOpen(false);
  };

  const resetForm = () => {
    setCurrentActivity(null);
    setNewActivity({
      name: "",
      image: "",
      isFeatured: false,
      logisticalDetails: "",
      nearbyAttractions: "",
      budget: "",
      backgroundInformation: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (currentActivity) {
      setCurrentActivity((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    } else {
      setNewActivity((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  return (
    <div className="p-8 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50 min-h-screen">
      <div className="bg-white shadow-xl rounded-lg p-8 mb-10 transform hover:scale-105 transition-transform duration-500 ease-in-out">
        <h2 className="text-4xl font-bold mb-6 text-center text-teal-700">{categoryName} Management</h2>
        <button
          onClick={() => openModal()}
          className="bg-teal-700 text-white py-4 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500 flex items-center justify-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Add New Activity</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center text-teal-700">Loading...</div>
      ) : (
        <div className="bg-white shadow-xl rounded-lg p-8">
          <h3 className="text-3xl font-bold mb-6 text-center text-teal-700">Manage Activities</h3>
          {activities.length === 0 ? (
            <p className="text-center text-teal-800">No activities available. Please add some activities.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activities.map((activity) => (
                <div key={activity.id} className="border rounded-lg p-6 shadow-lg bg-white transform hover:scale-105 transition-transform duration-500 ease-in-out">
                  {activity.image && (
                    <img
                      src={activity.image}
                      alt={activity.name}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  <h4 className="text-2xl font-semibold mb-4 text-teal-800">{activity.name}</h4>
                  <p className="text-gray-700 mb-4">Logistical Details: {activity.logisticalDetails}</p>
                  <p className="text-gray-700 mb-4">Nearby Attractions: {activity.nearbyAttractions}</p>
                  <p className="text-gray-700 mb-4">Budget: {activity.budget}</p>
                  <p className="text-gray-700 mb-4">Background Information: {activity.backgroundInformation}</p>
                  <p className="text-gray-600 mb-4">Featured: {activity.isFeatured ? "Yes" : "No"}</p>
                  <div className="flex justify-between">
                    <button
                      onClick={() => openModal(activity)}
                      className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-4 focus:ring-yellow-400 flex items-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => openDeleteModal(activity.id)}
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
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Add/Edit Activity Modal"
        className="modal-content bg-white p-8 rounded-lg shadow-2xl max-w-md mx-auto w-full transform transition-transform duration-500 ease-in-out"
        overlayClassName="modal-overlay fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto"
      >
        <div className="flex justify-end mb-4">
          <button onClick={closeModal}>
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>
        <h3 className="text-3xl font-bold mb-6 text-teal-700 text-center">{currentActivity ? "Edit Activity" : "Add New Activity"}</h3>
        <div className="space-y-6">
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-teal-800">Activity Name</label>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={currentActivity ? currentActivity.name : newActivity.name}
              onChange={handleInputChange}
              className="p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-teal-800">Logistical Details</label>
            <textarea
              name="logisticalDetails"
              placeholder="Logistical Details"
              value={currentActivity ? currentActivity.logisticalDetails : newActivity.logisticalDetails}
              onChange={handleInputChange}
              className="p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
              rows="3"
            ></textarea>
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-teal-800">Nearby Attractions</label>
            <textarea
              name="nearbyAttractions"
              placeholder="Nearby Attractions"
              value={currentActivity ? currentActivity.nearbyAttractions : newActivity.nearbyAttractions}
              onChange={handleInputChange}
              className="p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
              rows="3"
            ></textarea>
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-teal-800">Budget</label>
            <input
              type="text"
              name="budget"
              placeholder="Budget"
              value={currentActivity ? currentActivity.budget : newActivity.budget}
              onChange={handleInputChange}
              className="p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
            />
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-teal-800">Background Information</label>
            <textarea
              name="backgroundInformation"
              placeholder="Background Information"
              value={currentActivity ? currentActivity.backgroundInformation : newActivity.backgroundInformation}
              onChange={handleInputChange}
              className="p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
              rows="3"
            ></textarea>
          </div>
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-teal-800">Image URL</label>
            <input
              type="text"
              name="image"
              placeholder="Image URL"
              value={currentActivity ? currentActivity.image : newActivity.image}
              onChange={handleInputChange}
              className="p-4 border border-teal-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
            />
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              name="isFeatured"
              checked={currentActivity ? currentActivity.isFeatured : newActivity.isFeatured}
              onChange={handleInputChange}
              className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
            <label className="font-semibold text-teal-800">Featured Activity</label>
          </div>
          <button
            onClick={currentActivity ? handleUpdateActivity : handleAddActivity}
            className="bg-teal-700 text-white py-4 px-6 rounded-lg hover:bg-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500 flex items-center justify-center space-x-2 transition-transform transform hover:scale-105 duration-300 ease-in-out"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>{currentActivity ? "Save Changes" : "Add Activity"}</span>
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={closeDeleteModal}
        contentLabel="Delete Activity Confirmation"
        className="modal-content bg-white p-8 rounded-lg shadow-2xl max-w-md mx-auto w-full transform transition-transform duration-500 ease-in-out"
        overlayClassName="modal-overlay fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <h3 className="text-3xl font-bold mb-6 text-red-700 text-center">Delete Activity</h3>
        <p className="text-gray-700 text-lg text-center mb-8">Are you sure you want to delete this activity?</p>
        <div className="flex justify-center space-x-6">
          <button
            onClick={handleDeleteActivity}
            className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500 transition duration-300 ease-in-out"
          >
            Delete
          </button>
          <button
            onClick={closeDeleteModal}
            className="bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-500 transition duration-300 ease-in-out"
          >
            Cancel
          </button>
        </div>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default ReusableCategoryAdmin;
