import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";

const ExploreBaguio = () => {
  const [spots, setSpots] = useState([]);

  // Fetch spots from Firestore
  useEffect(() => {
    const spotsCollection = collection(db, "spots");
    const unsubscribe = onSnapshot(spotsCollection, (snapshot) => {
      const spotsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSpots(spotsData);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  return (
    <section className="py-16 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
      <h2 className="text-4xl font-bold mb-12 text-center text-teal-700">
        Explore Baguio
      </h2>
      {spots.length === 0 ? (
        <p className="text-center text-lg text-gray-700">
          No spots available at the moment.
        </p>
      ) : (
        <div className="max-w-6xl mx-auto px-4">
          {/* Flex container with wrapping and centered items */}
          <div className="flex flex-wrap justify-center gap-6">
            {spots.map((spot) => (
              <Link
                key={spot.id}
                to={`/spots/${spot.id}`}
                className="group w-96 rounded-lg shadow-xl overflow-hidden bg-white transform transition-transform duration-500 hover:scale-105"
              >
                {spot.image && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <img
                      src={spot.image}
                      alt={spot.name}
                      className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-2xl font-semibold mb-2 text-teal-800 group-hover:text-teal-600 transition-colors duration-300">
                    {spot.name}
                  </h3>
                  <p className="text-gray-700 mb-4">{spot.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ExploreBaguio;
