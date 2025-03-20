import React, { useRef, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import Highlights from '../components/Users/Highlights';
import PopularSpots from '../components/Users/PopularSpots';
import Featured from '../components/Users/Featured';
import Categories from '../components/Users/Categories';
import ExploreBaguio from '../components/Users/ExploreBaguio';
import GenerateItinerary from '../components/Users/GenerateItinerary';
import backgroundImage from '../img/backgroundHS.png';
import ItinerarySteps from '../components/Users/ItinerarySteps';

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // New loading state
  const navigate = useNavigate();
  const itineraryRef = useRef(null);

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Set loading to false once auth state is determined
    });

    return () => unsubscribe();
  }, []);

  const scrollToItinerary = () => {
    itineraryRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  // Render a loading indicator until Firebase is done loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-gray-100">
      {/* Hero Section */}
      <section
        className="flex items-center justify-center h-[60vh] text-white font-extrabold"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative text-center">
          <h1 className="text-6xl font-bold mb-4 text-teal-400 drop-shadow-2xl">
            Welcome to Peak Baguio
          </h1>
          <p className="text-2xl mb-6 text-gray-200 drop-shadow-lg">
            Discover the best places to visit and plan your adventure in the City of Pines.
          </p>
          <button
            onClick={scrollToItinerary}
            className="mt-6 bg-teal-500 text-gray-900 py-3 px-8 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 transform hover:scale-105 transition-transform duration-300 ease-in-out"
          >
            Plan Your Itinerary
          </button>
        </div>
      </section>

      {/* Generate Itinerary Section */}
      <div ref={itineraryRef}>
        {user ? (
          <GenerateItinerary />
        ) : (
          <div className="text-center py-16">
            <h2 className="text-3xl font-bold text-teal-700">
              Please{' '}
              <button
                onClick={() => navigate('/user-auth')}
                className="text-teal-600 underline hover:text-teal-800"
              >
                log in
              </button>{' '}
              to generate an itinerary.
            </h2>
          </div>
        )}
      </div>

      <ItinerarySteps />
      <ExploreBaguio />

      <footer className="bg-teal-800 text-white py-8 mt-16">
        <div className="text-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} Peak Baguio. All rights reserved.</p>
          <p className="text-sm mt-2">
            Partner with us:{' '}
            <a href="mailto:peakbaguio@gmail.com" className="text-teal-400 hover:underline">
              peakbaguio@gmail.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
