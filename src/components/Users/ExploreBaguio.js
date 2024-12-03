import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const ExploreBaguio = () => {
  const [places, setPlaces] = useState([]);
  const [expandedLogistics, setExpandedLogistics] = useState({});
  const scrollRef = useRef(null);

  useEffect(() => {
    // Firestore query to fetch featured places from the "places" subcollection under each "category"
    const categoryCollection = collection(db, "categories");
    const unsubscribe = onSnapshot(categoryCollection, (categorySnapshot) => {
      let allPlaces = [];
      categorySnapshot.forEach((categoryDoc) => {
        const placesCollection = collection(db, "categories", categoryDoc.id, "places");
        const q = query(placesCollection, where("isFeatured", "==", true));
        onSnapshot(q, (placesSnapshot) => {
          const placesData = placesSnapshot.docs.map((doc) => ({
            id: doc.id,
            tag: categoryDoc.id,
            ...doc.data(),
          }));
          allPlaces = [...allPlaces, ...placesData];
          setPlaces(allPlaces);
        });
      });
    });

    return () => unsubscribe();
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

  const toggleLogistics = (placeId) => {
    setExpandedLogistics((prevState) => ({
      ...prevState,
      [placeId]: !prevState[placeId],
    }));
  };

  return (
    <section className="py-16 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
      <h2 className="text-4xl font-bold mb-12 text-center text-teal-700">Explore Baguio</h2>
      {places.length === 0 ? (
        <p className="text-center text-lg text-gray-700">No places available at the moment.</p>
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

            <div ref={scrollRef} className="flex overflow-x-hidden space-x-6 px-4 scrollbar-hide">
              {places.map((place) => (
                <div key={place.id} className="min-w-[16rem] w-64 flex-shrink-0 group rounded-lg shadow-xl overflow-hidden bg-white transform transition-transform duration-500 hover:scale-105">
                  {place.image && (
                    <div className="relative w-full h-48 overflow-hidden">
                      <img
                        src={place.image}
                        alt={place.name}
                        className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-2xl font-semibold mb-2 text-teal-800 group-hover:text-teal-600 transition-colors duration-300">
                      {place.name}
                    </h3>
                    <div className="text-gray-700 mb-2">
                      {place.logisticalDetails &&
                        (expandedLogistics[place.id] || place.logisticalDetails.length <= 100 ? (
                          <p>{place.logisticalDetails}</p>
                        ) : (
                          <>
                            <p>{place.logisticalDetails.substring(0, 100)}...</p>
                            <button
                              onClick={() => toggleLogistics(place.id)}
                              className="text-teal-600 hover:underline mt-2"
                            >
                              Read More
                            </button>
                          </>
                        ))}
                      {expandedLogistics[place.id] && (
                        <button
                          onClick={() => toggleLogistics(place.id)}
                          className="text-teal-600 hover:underline mt-2"
                        >
                          Show Less
                        </button>
                      )}
                    </div>
                    {place.budget && (
                      <p className="text-teal-700 font-bold">Budget: {place.budget}</p>
                    )}
                  </div>
                </div>
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
              View all Places to Visit in Baguio
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ExploreBaguio;
