import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const FoodGastronomy = () => {
  const [activities, setActivities] = useState([]);
  const [reviews, setReviews] = useState([
    {
      reviewer: "Sophia Adams",
      rating: 5,
      comment: "The food tour was amazing! I got to try a variety of local dishes and each one was more delicious than the last!",
    },
    {
      reviewer: "James Taylor",
      rating: 4,
      comment: "Great experience for food lovers. The local cuisine was authentic and the guide was knowledgeable.",
    },
  ]);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const placesCollectionRef = collection(db, "categories", "Food & Gastronomy", "places");
        const querySnapshot = await getDocs(placesCollectionRef);
        const activitiesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActivities(activitiesData);
      } catch (error) {
        console.error("Error fetching activities: ", error);
      }
    };

    fetchActivities();
  }, []);

  return (
    <section className="py-16 bg-gradient-to-r from-orange-100 via-yellow-100 to-red-100">
      <h2 className="text-4xl font-bold mb-12 text-center text-red-800">Food & Gastronomy</h2>

      {activities.length === 0 ? (
        <p className="text-center text-lg text-gray-700">No food or gastronomy activities available at the moment.</p>
      ) : (
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activities.map((activity, index) => (
            <div key={index} className="group rounded-lg shadow-xl overflow-hidden bg-white transform transition-transform duration-500 hover:scale-105">
              {activity.image && (
                <div className="relative w-full h-64 overflow-hidden">
                  <img
                    src={activity.image}
                    alt={activity.name}
                    className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-4 text-red-800 group-hover:text-red-600 transition-colors duration-300">
                  {activity.name}
                </h3>
                <p className="text-gray-700 mb-4">
                  <span className="font-bold text-red-800">Logistical Details:</span> {activity.logisticalDetails || "No logistical details available."}
                </p>
                <p className="text-gray-700 mb-4">
                  <span className="font-bold text-red-800">Budget:</span> {activity.budget || "No budget information available."}
                </p>
                <p className="text-gray-700 mb-4">
                  <span className="font-bold text-red-800">Background Information:</span> {activity.backgroundInformation || "No background information available."}
                </p>
                <p className="text-gray-700 mb-6">
                  <span className="font-bold text-red-800">Nearby Attractions:</span> {activity.nearbyAttractions || "No nearby attractions available."}
                </p>

                <div className="border-t border-gray-300 pt-4">
                  <h4 className="text-lg font-semibold text-red-700 mb-3">Reviews:</h4>
                  {reviews.slice(0, showAllReviews ? reviews.length : 2).map((review, reviewIndex) => (
                    <div key={reviewIndex} className="mb-4">
                      <p className="font-bold text-red-800">{review.reviewer}</p>
                      <p className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                  {reviews.length > 2 && (
                    <button
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="text-red-600 hover:underline mt-2"
                    >
                      {showAllReviews ? "Show Less" : "Read More Reviews"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default FoodGastronomy;