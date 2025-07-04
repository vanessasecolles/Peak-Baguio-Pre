// UserItineraries.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrash,
  faPrint,
  faCheck,
  faClipboardCheck,
} from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-modal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { marked } from 'marked';
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
    if (!user) {
      setLoading(false);
      return;
    }
    const itinerariesQuery = query(
      collection(db, 'itineraries'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(itinerariesQuery, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItineraries(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'itineraries', id));
      toast.success('Itinerary deleted successfully.');
    } catch {
      toast.error('Failed to delete the itinerary. Please try again.');
    }
    setIsDeleteModalOpen(false);
  };

  const handlePrint = (itineraryMd) => {
    // Remove any "[read more...]" lines and trailing "END"
    const cleanMd = itineraryMd
      .split('\n')
      .filter(
        (line) =>
          !line.trim().toLowerCase().startsWith('[read more') &&
          line.trim().toUpperCase() !== 'END'
      )
      .join('\n');

    const htmlBody = marked(cleanMd);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Your Baguio City Itinerary</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            h1 {
              color: #0d9488;
              margin-bottom: 0.5em;
            }
            h2, h3, h4 {
              color: #115e59;
              margin-top: 1em;
              margin-bottom: 0.5em;
            }
            ul, ol {
              margin-left: 1.5em;
              margin-bottom: 1em;
            }
            a {
              color: #2563eb;
              text-decoration: underline;
            }
            .footer {
              margin-top: 2em;
              font-size: 0.9em;
              text-align: center;
              color: #555;
            }
          </style>
        </head>
        <body>
          <h1>Your Baguio City Itinerary</h1>
          ${htmlBody}
          <div class="footer">
            Generated on ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    toast.info('Opened print preview!');
  };

  const handlePlanToUse = (itinerary) => {
    setSelectedItinerary(itinerary);
    setIsFeedbackModalOpen(true);
  };

  const handleFeedback = async (feedback) => {
    if (!selectedItinerary) return;
    try {
      await updateDoc(doc(db, 'itineraries', selectedItinerary.id), {
        planned: true,
        feedback,
      });
      toast.success('Thank you for your feedback!');
    } catch {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsFeedbackModalOpen(false);
      setSelectedItinerary(null);
    }
  };

  const handleMarkAsUsed = async (itinerary) => {
    try {
      await updateDoc(doc(db, 'itineraries', itinerary.id), {
        used: true,
      });
      toast.success('Itinerary marked as used!');
    } catch {
      toast.error('Failed to mark as used. Please try again.');
    }
  };

  const toggleExpanded = (id) => {
    setExpandedItineraries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const openDeleteModal = (itinerary) => {
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
          <div className="space-y-6">
            {itineraries.map((it) => (
              <div
                key={it.id}
                className="p-4 sm:p-6 border border-teal-300 rounded-lg bg-gray-50"
              >
                <h3 className="text-lg sm:text-2xl font-semibold mb-3 text-teal-800">
                  Itinerary Generated on{' '}
                  {new Date(it.timestamp.seconds * 1000).toLocaleDateString()}
                </h3>

                <div className="text-gray-600 leading-relaxed whitespace-pre-line mb-3">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          className="text-blue-600 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                    }}
                  >
                    {expandedItineraries[it.id] || it.itinerary.length <= 300
                      ? it.itinerary
                      : `${it.itinerary.substring(0, 300)}...`}
                  </ReactMarkdown>
                </div>

                {it.itinerary.length > 300 && (
                  <button
                    onClick={() => toggleExpanded(it.id)}
                    className="text-teal-600 underline focus:outline-none mb-4"
                  >
                    {expandedItineraries[it.id] ? 'Read Less' : 'Read More'}
                  </button>
                )}

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => handlePrint(it.itinerary)}
                    className="bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 flex items-center space-x-2"
                  >
                    <FontAwesomeIcon icon={faPrint} />
                    <span>Print</span>
                  </button>

                  {!it.planned && (
                    <button
                      onClick={() => handlePlanToUse(it)}
                      className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      <span>Plan to Use</span>
                    </button>
                  )}

                  {it.planned && !it.used && (
                    <button
                      onClick={() => handleMarkAsUsed(it)}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <FontAwesomeIcon icon={faClipboardCheck} />
                      <span>Mark as Completed</span>
                    </button>
                  )}

                  {!it.planned && (
                    <button
                      onClick={() => openDeleteModal(it)}
                      className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center space-x-2"
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

      {/* Feedback Modal */}
      <Modal
        isOpen={isFeedbackModalOpen}
        onRequestClose={() => setIsFeedbackModalOpen(false)}
        contentLabel="Feedback Modal"
        className="modal-content bg-white p-4 sm:p-8 rounded-lg shadow-2xl w-11/12 max-w-md mx-auto"
        overlayClassName="modal-overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <h3 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6 text-teal-700 text-center">
          Did you like this itinerary?
        </h3>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => handleFeedback('liked')}
            className="bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700"
          >
            Yes
          </button>
          <button
            onClick={() => handleFeedback('disliked')}
            className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700"
          >
            No
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={closeDeleteModal}
        contentLabel="Delete Confirmation Modal"
        className="modal-content bg-white p-4 sm:p-8 rounded-lg shadow-2xl w-11/12 max-w-md mx-auto"
        overlayClassName="modal-overlay fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <h3 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6 text-red-700 text-center">
          Are you sure you want to delete this itinerary?
        </h3>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => handleDelete(itineraryToDelete.id)}
            className="bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700"
          >
            Yes, Delete
          </button>
          <button
            onClick={closeDeleteModal}
            className="bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700"
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
