import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";

const ExploreBaguio = () => {
  const [spots, setSpots] = useState([]);
  const scrollRef = useRef(null);

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

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
      <h2 className="text-4xl font-bold mb-12 text-center text-teal-700">Explore Baguio</h2>
      {spots.length === 0 ? (
        <p className="text-center text-lg text-gray-700">No spots available at the moment.</p>
      ) : (
        <div className="max-w-6xl mx-auto px-6 relative">
          <div className="flex items-center">
            {/* Scroll Left Button */}
            <button
              className="bg-teal-600 text-white p-3 rounded-full hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 transition-transform transform hover:scale-110 duration-300"
              onClick={handleScrollLeft}
            >
              &#8592;
            </button>

            <div ref={scrollRef} className="flex overflow-x-auto space-x-6 px-4 scrollbar-hide">
              {spots.map((spot) => (
                <Link
                  key={spot.id}
                  to={`/spots/${spot.id}`} // Use spot ID in the URL
                  className="min-w-[16rem] w-64 flex-shrink-0 group rounded-lg shadow-xl overflow-hidden bg-white transform transition-transform duration-500 hover:scale-105"
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

            {/* Scroll Right Button */}
            <button
              className="bg-teal-600 text-white p-3 rounded-full hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 transition-transform transform hover:scale-110 duration-300"
              onClick={handleScrollRight}
            >
              &#8594;
            </button>
          </div>

          <div className="text-center mt-8">
            <button className="bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 transition-transform transform hover:scale-105 duration-300 ease-in-out">
              View all Spots
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExploreBaguio;
