import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faPencilAlt,
  faClipboardList,
  faCommentDots,
} from '@fortawesome/free-solid-svg-icons';

const steps = [
  { id: 1, icon: faUser, title: 'Login / Register', desc: 'Log in or create an account to personalize your experience.' },
  { id: 2, icon: faPencilAlt, title: 'Enter Details', desc: 'Provide your preferences in the "Generate Itinerary" section.' },
  { id: 3, icon: faClipboardList, title: 'View Itineraries', desc: 'Access all your saved plans under the "My Itineraries" tab.' },
  { id: 4, icon: faCommentDots, title: 'Share Feedback', desc: 'Let us know if you plan to use it and share your thoughts!' },
];

const ItinerarySteps = () => (
  <section className="relative bg-white py-16">
    <div className="max-w-6xl mx-auto px-4">
      <h2 className="text-center text-4xl font-bold mb-12 text-teal-700">
        How to Generate Your Perfect Itinerary
      </h2>

      {/* Desktop horizontal stepper */}
      <div className="hidden md:flex items-center">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex-1 flex flex-col items-center text-center">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 text-2xl">
                <FontAwesomeIcon icon={step.icon} />
              </div>
              <div className="mt-4 font-semibold text-lg">{step.title}</div>
              <p className="mt-2 text-gray-600 px-4">{step.desc}</p>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 border-t-2 border-teal-300"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-8">
        {steps.map(step => (
          <div key={step.id} className="bg-gray-100 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xl">
                <FontAwesomeIcon icon={step.icon} />
              </div>
              <h3 className="ml-4 text-xl font-semibold text-teal-700">
                {step.title}
              </h3>
            </div>
            <p className="mt-3 text-gray-600 pl-16">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Call-to-action button */}
      <div className="mt-12 text-center">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-block bg-teal-500 text-white py-3 px-8 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-300 transform hover:scale-105 transition-transform duration-300"
        >
          Start Your Journey Now
        </button>
      </div>
    </div>
  </section>
);

export default ItinerarySteps;
