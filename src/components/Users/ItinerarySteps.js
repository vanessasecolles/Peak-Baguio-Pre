import React from 'react';

const ItinerarySteps = () => {
  return (
    <section className="bg-white py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-8 text-teal-700">
          How to Generate Your Perfect Itinerary
        </h2>
        <div className="space-y-12">
          <div className="bg-gray-100 shadow-md rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-4 text-teal-700">Step 1: Login/Register</h3>
            <p className="text-gray-700">
              To get started, you need to <span className="font-semibold text-teal-600">log in or create an account</span> to access the itinerary generation feature. This will help us personalize your experience.
            </p>
          </div>
          <div className="bg-gray-100 shadow-md rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-4 text-teal-700">Step 2: Enter Your Details</h3>
            <p className="text-gray-700">
              Once you're logged in, head over to the <span className="font-semibold text-teal-600">Generate Itinerary</span> section. Here, you'll be prompted to provide your preferences and interests to create a customized plan for your adventure.
            </p>
          </div>
          <div className="bg-gray-100 shadow-md rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-4 text-teal-700">Step 3: View Your Itineraries</h3>
            <p className="text-gray-700">
              After generating your itinerary, you can view it at any time by navigating to the <span className="font-semibold text-teal-600">My Itineraries</span> tab. Easily access all your saved plans in one place.
            </p>
          </div>
          <div className="bg-gray-100 shadow-md rounded-lg p-8">
            <h3 className="text-2xl font-semibold mb-4 text-teal-700">Step 4: Let Us Know Your Thoughts</h3>
            <p className="text-gray-700">
              Once you've reviewed your itinerary, please let us know if you plan to use it and <span className="font-semibold text-teal-600">share your feedback</span>. Your input helps us improve and provide better experiences for you and other adventurers!
            </p>
          </div>
        </div>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="mt-12 bg-teal-500 text-gray-900 py-3 px-8 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 transform hover:scale-105 transition-transform duration-300 ease-in-out"
        >
          Start Your Journey Now
        </button>
      </div>
    </section>
  );
};

export default ItinerarySteps;
