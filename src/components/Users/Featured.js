import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

const Featured = () => {
  const [featuredItems, setFeaturedItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const featuredCollection = collection(db, "featuredActivities");
    const unsubscribe = onSnapshot(featuredCollection, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFeaturedItems(data);
    });

    return () => unsubscribe();
  }, []);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % featuredItems.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + featuredItems.length) % featuredItems.length);
  };

  return (
    <section className="py-16 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
      <h2 className="text-4xl font-bold mb-12 text-center text-teal-700">Featured Activities</h2>
      {featuredItems.length === 0 ? (
        <p className="text-center text-lg text-gray-700">No featured activities available at the moment.</p>
      ) : (
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative">
            <div className="group rounded-lg shadow-xl overflow-hidden bg-white transform transition-transform duration-500 hover:scale-105">
              {featuredItems[currentIndex].image && (
                <div className="relative w-full h-80 overflow-hidden">
                  <img
                    src={featuredItems[currentIndex].image}
                    alt={featuredItems[currentIndex].title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                </div>
              )}
              <div className="p-8">
                <h3 className="text-3xl font-semibold mb-4 text-teal-800 group-hover:text-teal-600 transition-colors duration-300">
                  {featuredItems[currentIndex].title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {featuredItems[currentIndex].description}
                </p>
                <button className="bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 transition-transform transform hover:scale-105 duration-300 ease-in-out">
                  Learn More
                </button>
              </div>
            </div>

            {/* Carousel Controls */}
            <button
              className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 transition-transform transform hover:scale-110 duration-300"
              onClick={handlePrev}
            >
              &#8592; Prev
            </button>
            <button
              className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 transition-transform transform hover:scale-110 duration-300"
              onClick={handleNext}
            >
              Next &#8594;
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Featured;