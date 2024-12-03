import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

const Highlights = () => {
  const [highlights, setHighlights] = useState([]);

  useEffect(() => {
    const highlightsCollection = collection(db, "highlights");
    const unsubscribe = onSnapshot(highlightsCollection, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHighlights(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="py-16 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
      <h2 className="text-4xl font-bold mb-12 text-center text-teal-700">Highlights</h2>
      {highlights.length === 0 ? (
        <p className="text-center text-lg text-gray-700">No highlights available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto px-6">
          {highlights.map((highlight) => (
            <div
              key={highlight.id}
              className="group relative bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-500 hover:scale-105"
              style={{ minHeight: '350px' }} // Limit card height
            >
              {highlight.image && (
                <div className="relative w-full h-64 overflow-hidden">
                  <img
                    src={highlight.image}
                    alt={highlight.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                </div>
              )}
              <div className="p-6 flex flex-col justify-between" style={{ minHeight: '100px' }}>
                <div>
                  <h3 className="text-2xl font-semibold mb-4 text-teal-800 group-hover:text-teal-600 transition-colors duration-300">
                    {highlight.title}
                  </h3>
                  <p className={`text-gray-600 leading-relaxed mb-4 ${highlight.description.length < 100 ? 'text-lg' : ''}`}>
                    {highlight.description}
                  </p>
                </div>
                <button className="bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 transition-transform transform hover:scale-105 duration-300 ease-in-out">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Highlights;
