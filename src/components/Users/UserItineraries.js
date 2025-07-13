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
  faThumbsUp,
  faThumbsDown,
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
  const [filtered, setFiltered] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest');
  const [detailItin, setDetailItin] = useState(null);
  const [delModal, setDelModal] = useState(false);
  const [delItin, setDelItin] = useState(null);
  const [fbModal, setFbModal] = useState(false);
  const [fbAction, setFbAction] = useState({ id: null, type: null });
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const user = auth.currentUser;

  // Real-time fetch
  useEffect(() => {
    if (!user) return setLoading(false);
    const q = query(
      collection(db, 'itineraries'),
      where('userId', '==', user.uid)
    );
    return onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItineraries(data);
      setLoading(false);
    });
  }, [user]);

  // Apply filter & sort
  useEffect(() => {
    let arr = [...itineraries];
    if (feedbackFilter !== 'All') {
      arr = arr.filter(i => i.feedback === feedbackFilter.toLowerCase());
    }
    arr.sort((a, b) => {
      const ta = a.timestamp.seconds;
      const tb = b.timestamp.seconds;
      return sortOrder === 'Newest' ? tb - ta : ta - tb;
    });
    setFiltered(arr);
  }, [itineraries, feedbackFilter, sortOrder]);

  const handleDelete = async id => {
    try {
      await deleteDoc(doc(db, 'itineraries', id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDelModal(false);
    }
  };

  const handlePrint = md => {
    const clean = md
      .split('\n')
      .filter(l => !l.toLowerCase().startsWith('[read more') && l.trim().toUpperCase() !== 'END')
      .join('\n');
    const html = marked(clean);
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Itinerary</title>
        <style>body{font-family:sans-serif;padding:20px} a{text-decoration:underline;color:#2563eb;}</style>
      </head><body>${html}</body></html>`);
    win.document.close(); win.print(); win.close();
    toast.info('Print opened');
  };

  const openFeedback = (id, type) => {
    setFbAction({ id, type }); setFbModal(true);
  };
  const confirmFb = async () => {
    await updateDoc(doc(db, 'itineraries', fbAction.id), { feedback: fbAction.type });
    toast.success(fbAction.type === 'liked' ? 'Liked' : 'Disliked');
    setFbModal(false);
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <section className="py-8 bg-gray-50">
      <div className="px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-teal-700 mb-6">Your Itineraries</h2>
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <select
            value={feedbackFilter}
            onChange={e => setFeedbackFilter(e.target.value)}
            className="p-2 border rounded"
          >
            {['All', 'Liked', 'Disliked'].map(opt => <option key={opt}>{opt}</option>)}
          </select>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="p-2 border rounded"
          >
            {['Newest', 'Oldest'].map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </div>
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(it => {
            const date = new Date(it.timestamp.seconds*1000).toLocaleDateString();
            const isLiked = it.feedback === 'liked';
            const isDisliked = it.feedback === 'disliked';
            return (
              <div key={it.id} className="relative bg-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1 transition flex flex-col h-full">
                {/* Feedback Badge */}
                {isLiked && <span className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">✔️</span>}
                {isDisliked && <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">❌</span>}
                <div className="p-4 flex-1">
                  <span className="inline-block bg-teal-100 text-teal-800 text-sm px-2 py-1 rounded-full mb-2">{date}</span>
                  <div className="prose prose-teal mb-4 max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{a: ({node,...props})=><a {...props} className="text-blue-600 underline"/>}}>
                      {it.itinerary.length>300 ? it.itinerary.substring(0,300)+'...' : it.itinerary}
                    </ReactMarkdown>
                  </div>
                </div>
                {/* Sticky Footer */}
                <div className="mt-auto p-4 border-t bg-gray-50 flex justify-end gap-2">
                  <button onClick={()=>handlePrint(it.itinerary)} className="p-2 rounded bg-teal-600 text-white"><FontAwesomeIcon icon={faPrint}/></button>
                  <button onClick={()=>openFeedback(it.id,'liked')} disabled={isLiked} className={`p-2 rounded ${isLiked?'bg-green-800 text-white opacity-50':'bg-green-600 text-white'}`}><FontAwesomeIcon icon={faThumbsUp}/></button>
                  <button onClick={()=>openFeedback(it.id,'disliked')} disabled={isDisliked} className={`p-2 rounded ${isDisliked?'bg-red-800 text-white opacity-50':'bg-red-600 text-white'}`}><FontAwesomeIcon icon={faThumbsDown}/></button>
                  <button onClick={()=>{setDelItin(it);setDelModal(true);}} className="p-2 rounded bg-gray-600 text-white"><FontAwesomeIcon icon={faTrash}/></button>
                  <button onClick={()=>setDetailItin(it)} className="w-full text-sm text-blue-600 mt-2">Read More</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Drawer */}
      <Modal isOpen={!!detailItin} onRequestClose={()=>setDetailItin(null)} className="fixed right-0 top-0 h-full w-full md:w-1/2 bg-white shadow-xl p-6 overflow-auto" overlayClassName="fixed inset-0 bg-black bg-opacity-50">
        <button onClick={()=>setDetailItin(null)} className="mb-4 text-gray-600">Close</button>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{a: ({node,...props})=><a {...props} className="text-blue-600 underline"/>}}>
          {detailItin?.itinerary || ''}
        </ReactMarkdown>
      </Modal>

      {/* Feedback Modal */}
      <Modal isOpen={fbModal} onRequestClose={()=>setFbModal(false)} className="modal-content bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto" overlayClassName="modal-overlay bg-black bg-opacity-50 fixed inset-0 flex items-center justify-center">
        <h3 className="text-xl font-bold mb-4 text-center">Confirm {fbAction.type==='liked'?'Like':'Dislike'}?</h3>
        <div className="flex justify-around">
          <button onClick={confirmFb} className="bg-teal-600 text-white px-4 py-2 rounded">Yes</button>
          <button onClick={()=>setFbModal(false)} className="bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={delModal} onRequestClose={()=>setDelModal(false)} className="modal-content bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto" overlayClassName="modal-overlay bg-black bg-opacity-50 fixed inset-0 flex items-center justify-center">
        <h3 className="text-xl font-bold mb-4 text-center text-red-700">Delete Itinerary?</h3>
        <div className="flex justify-around">
          <button onClick={()=>handleDelete(delItin.id)} className="bg-red-600 text-white px-4 py-2 rounded">Delete</button>
          <button onClick={()=>setDelModal(false)} className="bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
        </div>
      </Modal>

      <ToastContainer />
    </section>
  );
};

export default UserItineraries;
