import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import TruncatedText from './TruncatedText';

const timeOfDayOptions = ['Morning', 'Afternoon', 'Evening'];
const budgetOptions = ['Low Budget', 'Mid Range', 'Luxury'];

const SpotDetails = () => {
  const { spotId } = useParams();
  const [activities, setActivities] = useState([]);
  const [dining, setDining] = useState([]);
  const [selectedSection, setSelectedSection] = useState('All');
  const [subTab, setSubTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [parkingArea, setParkingArea] = useState('');
  const [spotImage, setSpotImage] = useState('');

  const title = spotId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Spot details
      const spotRef = doc(db, 'spots', title);
      const spotSnap = await getDoc(spotRef);
      if (spotSnap.exists()) {
        const data = spotSnap.data();
        setDescription(data.description || '');
        setParkingArea(data.parkingArea || 'No information available.');
        setSpotImage(data.image || '');
      }
      // Activities
      const actPromises = timeOfDayOptions.map(async t => {
        const ref = collection(db, 'spots', title, 'activities', t.toLowerCase(), 'list');
        const snap = await getDocs(ref);
        return { time: t, items: snap.docs.map(d => d.data()) };
      });
      // Dining
      const dinPromises = budgetOptions.map(async b => {
        const key = b.replace(/ /g, '');
        const ref = collection(db, 'spots', title, 'dining', key.charAt(0).toLowerCase() + key.slice(1), 'list');
        const snap = await getDocs(ref);
        return { budget: b, items: snap.docs.map(d => d.data()) };
      });
      const [actData, dinData] = await Promise.all([Promise.all(actPromises), Promise.all(dinPromises)]);
      setActivities(actData);
      setDining(dinData);
      setLoading(false);
    };
    fetchData();
  }, [spotId, title]);

  const getFilteredActivities = () => {
    if (subTab === 'All') return activities.flatMap(a => a.items);
    const found = activities.find(a => a.time === subTab);
    return found ? found.items : [];
  };
  const getFilteredDining = () => {
    if (subTab === 'All') return dining.flatMap(d => d.items);
    const found = dining.find(d => d.budget === subTab);
    return found ? found.items : [];
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <section className="py-16 bg-gradient-to-r from-blue-100 via-teal-100 to-green-100">
      <div className="max-w-4xl mx-auto text-center px-6 mb-12">
        <h2 className="text-4xl font-bold text-teal-800 mb-4">{title}</h2>
        {spotImage && <img src={spotImage} alt={title} className="w-full h-64 object-cover rounded-lg shadow-md mb-4" />}
        <div className="text-lg text-gray-700 mb-2"><TruncatedText htmlContent={description} /></div>
        <div className="mt-4"><span className="font-semibold text-teal-800">Parking Area:</span> <span className="text-blue-600 underline" dangerouslySetInnerHTML={{ __html: parkingArea }} /></div>
      </div>

      {/* Main Tabs */}
      <div className="max-w-4xl mx-auto px-6 mb-6">
        <nav className="flex justify-center space-x-4">
          {['All', 'Activities', 'Dining'].map(sec => (
            <button
              key={sec}
              onClick={() => { setSelectedSection(sec); setSubTab('All'); }}
              className={`px-4 py-2 rounded-full font-medium ${selectedSection === sec ? 'bg-teal-600 text-white' : 'bg-white text-teal-800 shadow-sm'}`}
            >{sec}</button>
          ))}
        </nav>
      </div>

      {/* Sub Tabs */}
      {selectedSection !== 'All' && (
        <div className="max-w-4xl mx-auto px-6 mb-8">
          <nav className="flex justify-center space-x-3">
            {(selectedSection === 'Activities' ? ['All', ...timeOfDayOptions] : ['All', ...budgetOptions]).map(tab => (
              <button
                key={tab}
                onClick={() => setSubTab(tab)}
                className={`px-3 py-1 rounded ${subTab === tab ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >{tab}</button>
            ))}
          </nav>
        </div>
      )}

      {/* Content Cards */}
      {['All', 'Activities'].includes(selectedSection) && (
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <h3 className="col-span-full text-2xl font-bold text-teal-800 mb-4">Activities</h3>
          {getFilteredActivities().length > 0 ? getFilteredActivities().map((a,i) => (
            <div key={i} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 spot-card">
              {a.image && <img src={a.image} alt={a.name} className="w-full h-48 object-cover mb-4 rounded" />}
              <h4 className="text-xl font-semibold text-teal-800 mb-2">{a.name}</h4>
              <TruncatedText htmlContent={a.description} />
            </div>
          )) : <p className="col-span-full text-center text-lg">No activities available.</p>}
        </div>
      )}

      {['All', 'Dining'].includes(selectedSection) && (
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          <h3 className="col-span-full text-2xl font-bold text-teal-800 mb-4">Dining Options</h3>
          {getFilteredDining().length > 0 ? getFilteredDining().map((d,i) => (
            <div key={i} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 spot-card">
              {d.image && <img src={d.image} alt={d.name} className="w-full h-48 object-cover mb-4 rounded" />}
              <h4 className="text-xl font-semibold text-teal-800 mb-2">{d.name}</h4>
              <TruncatedText htmlContent={d.description} />
              <p className="text-gray-700 font-semibold mt-4">{d.price}</p>
            </div>
          )) : <p className="col-span-full text-center text-lg">No dining options available.</p>}
        </div>
      )}
    </section>
  );
};

export default SpotDetails;
