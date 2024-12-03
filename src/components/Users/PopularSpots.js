import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

const PopularSpots = () => {
  const [spots, setSpots] = useState([]);

  useEffect(() => {
    const spotsCollection = collection(db, "popularsSpots");
    const unsubscribe = onSnapshot(spotsCollection, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSpots(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="py-16 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
      <h2 className="text-4xl font-bold mb-12 text-center text-teal-700">Popular Spots</h2>
      {spots.length === 0 ? (
        <p className="text-center text-lg text-gray-700">No popular spots available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto px-6">
          {spots.map((spot) => (
            <div
              key={spot.id}
              className="group relative bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-500 hover:scale-105"
            >
              {spot.image && (
                <div className="relative w-full h-64 overflow-hidden">
                  <img
                    src={spot.image}
                    alt={spot.name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-4 text-teal-800 group-hover:text-teal-600 transition-colors duration-300">
                  {spot.name}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">{spot.description}</p>
                <button className="bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 transition-transform transform hover:scale-105 duration-300 ease-in-out">
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

export default PopularSpots;