import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPrint, faCheck, faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-modal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

Modal.setAppElement('#root');

const UserItineraries = () => {
  const [itineraries, setItineraries] = useState([]);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [expandedItineraries, setExpandedItineraries] = useState({});
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itineraryToDelete, setItineraryToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const itinerariesQuery = query(
        collection(db, 'itineraries'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(itinerariesQuery, (snapshot) => {
        const fetchedItineraries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItineraries(fetchedItineraries);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'itineraries', id));
      toast.success('Itinerary deleted successfully.');
    } catch (error) {
      toast.error('Failed to delete the itinerary. Please try again.');
    }
    setIsDeleteModalOpen(false);
  };

  const handlePrint = (itinerary) => {
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`
      <html>
        <head>
          <title>Print Itinerary</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { color: #0d9488; }
          </style>
        </head>
        <body>
          <h2>Your Baguio City Itinerary</h2>
          <pre>${itinerary}</pre>
        </body>
      </html>
    `);
    newWindow.document.close();
    newWindow.print();
    toast.info('Printing itinerary...');
  };

  const handlePlanToUse = (itinerary) => {
    setSelectedItinerary(itinerary);
    setIsFeedbackModalOpen(true);
  };

  const handleFeedback = async (feedback) => {
    if (selectedItinerary) {
      try {
        const itineraryRef = doc(db, 'itineraries', selectedItinerary.id);
        await updateDoc(itineraryRef, {
          planned: true,
          feedback: feedback,
        });
        toast.success('Thank you for your feedback!');
      } catch (error) {
        toast.error('Failed to submit feedback. Please try again.');
      } finally {
        setIsFeedbackModalOpen(false);
        setSelectedItinerary(null);
      }
    }
  };

  const handleMarkAsUsed = async (itinerary) => {
    try {
      const itineraryRef = doc(db, 'itineraries', itinerary.id);
      await updateDoc(itineraryRef, {
        used: true,
      });
      toast.success('Itinerary marked as used!');
    } catch (error) {
      toast.error('Failed to mark as used. Please try again.');
    }
  };

  const toggleExpanded = (id) => {
    setExpandedItineraries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeleteConfirmation = (itinerary) => {
    setItineraryToDelete(itinerary);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItineraryToDelete(null);
  };

  if (loading) {
    return (
      <section className="flex justify-center items-center min-h-screen bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
        <p className="text-2xl text-teal-700">Loading itineraries...</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
      <div className="bg-white shadow-2xl rounded-lg p-4 sm:p-6 md:p-10 w-full max-w-4xl">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-8 text-center text-teal-700">
          Your Itineraries
        </h2>
        {itineraries.length === 0 ? (
          <p className="text-center text-base sm:text-lg text-gray-700">
            No itineraries found. Generate your first itinerary to get started!
          </p>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {itineraries.map((itinerary) => (
              <div key={itinerary.id} className="p-4 sm:p-6 border border-teal-300 rounded-lg bg-gray-50">
                <h3 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-4 text-teal-800">
                  Itinerary Generated on {new Date(itinerary.timestamp?.seconds * 1000).toLocaleDateString()}
                </h3>
                <div className="text-gray-600 leading-relaxed whitespace-pre-line mb-2 sm:mb-4">
                  <ReactMarkdown className="itinerary-content" remarkPlugins={[remarkGfm]}>
                    {expandedItineraries[itinerary.id] || itinerary.itinerary.length <= 300
                      ? itinerary.itinerary
                      : `${itinerary.itinerary.substring(0, 300)}...`}
                  </ReactMarkdown>
                </div>
                {itinerary.itinerary.length > 300 && (
                  <button
                    onClick={() => toggleExpanded(itinerary.id)}
                    className="text-teal-600 underline focus:outline-none"
                  >
                    {expandedItineraries[itinerary.id] ? 'Read Less' : 'Read More'}
                  </button>
                )}

                {itinerary.coordinates && itinerary.coordinates.length > 1 && (
                  <div className="my-2 sm:my-4">
                    <h4 className="text-base sm:text-lg font-semibold text-teal-800 mb-1 sm:mb-2">
                      Google Maps Directions:
                    </h4>
                    {itinerary.coordinates.map((location, index) => {
                      if (index < itinerary.coordinates.length - 1) {
                        const start = location.name;
                        const end = itinerary.coordinates[index + 1].name;
                        const googleMapsLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                          `${start}, Baguio, Philippines`
                        )}&destination=${encodeURIComponent(`${end}, Baguio, Philippines`)}`;
                        return (
                          <p key={index} className="text-blue-600 underline mb-1">
                            <a href={googleMapsLink} target="_blank" rel="noopener noreferrer">
                              <strong>Travel from {start} to {end}</strong>
                            </a>
                          </p>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-4 mt-4">
                  <button
                    onClick={() => handlePrint(itinerary.itinerary)}
                    className="w-full sm:w-auto bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 flex items-center justify-center space-x-2 transition duration-300 ease-in-out"
                  >
                    <FontAwesomeIcon icon={faPrint} />
                    <span>Print</span>
                  </button>
                  {!itinerary.planned && (
                    <button
                      onClick={() => handlePlanToUse(itinerary)}
                      className="w-full sm:w-auto bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500 flex items-center justify-center space-x-2 transition duration-300 ease-in-out"
                      title="Set this itinerary as planned for future travel."
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      <span>Plan to Use</span>
                    </button>
                  )}
                  {itinerary.planned && !itinerary.used && (
                    <button
                      onClick={() => handleMarkAsUsed(itinerary)}
                      className="w-full sm:w-auto bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 flex items-center justify-center space-x-2 transition duration-300 ease-in-out"
                      title="Mark this itinerary as used."
                    >
                      <FontAwesomeIcon icon={faClipboardCheck} />
                      <span>Mark as Completed</span>
                    </button>
                  )}
                  {!itinerary.planned && (
                    <button
                      onClick={() => handleDeleteConfirmation(itinerary)}
                      className="w-full sm:w-auto bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500 flex items-center justify-center space-x-2 transition duration-300 ease-in-out"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isFeedbackModalOpen}
        onRequestClose={() => setIsFeedbackModalOpen(false)}
        contentLabel="Feedback Modal"
        className="modal-content bg-white p-4 sm:p-8 rounded-lg shadow-2xl w-11/12 max-w-md mx-auto"
        overlayClassName="modal-overlay fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <h3 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6 text-teal-700 text-center">
          Did you like this itinerary?
        </h3>
        <div className="flex flex-col sm:flex-row justify-center items-stretch gap-2 sm:gap-6">
          <button
            onClick={() => handleFeedback("liked")}
            className="w-full sm:w-auto bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 transition duration-300 ease-in-out"
          >
            Yes
          </button>
          <button
            onClick={() => handleFeedback("disliked")}
            className="w-full sm:w-auto bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500 transition duration-300 ease-in-out"
          >
            No
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={closeDeleteModal}
        contentLabel="Delete Confirmation Modal"
        className="modal-content bg-white p-4 sm:p-8 rounded-lg shadow-2xl w-11/12 max-w-md mx-auto"
        overlayClassName="modal-overlay fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <h3 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6 text-red-700 text-center">
          Are you sure you want to delete this itinerary?
        </h3>
        <div className="flex flex-col sm:flex-row justify-center items-stretch gap-2 sm:gap-6">
          <button
            onClick={() => handleDelete(itineraryToDelete.id)}
            className="w-full sm:w-auto bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500 transition duration-300 ease-in-out"
          >
            Yes, Delete
          </button>
          <button
            onClick={closeDeleteModal}
            className="w-full sm:w-auto bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-500 transition duration-300 ease-in-out"
          >
            Cancel
          </button>
        </div>
      </Modal>

      <ToastContainer />
    </section>
  );
};

export default UserItineraries;
