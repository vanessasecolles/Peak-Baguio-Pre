import React, { useState } from "react";
import { getFirestore, setDoc, doc } from "firebase/firestore";

const AdminGenerateItineraryForm = () => {
  const [fields, setFields] = useState({
    budgets: ["Low Range", "Mid Range", "Luxury Range"],
    durations: ["Day Trips", "Weekend", "Extended Stay"],
    interests: ["Nature Lover", "Culture Enthusiast", "Adventure Seeker", "Foodie", "History Buff", "Family-friendly"],
  });
  const db = getFirestore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "itineraryFields", "fields"), fields);
      alert("Fields updated successfully!");
    } catch (error) {
      console.error("Error updating fields: ", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={fields.budgets.join(", ")}
        onChange={(e) =>
          setFields((prev) => ({ ...prev, budgets: e.target.value.split(",").map((item) => item.trim()) }))
        }
        className="w-full p-3 border border-gray-300 rounded-md"
        placeholder="Budgets (comma-separated)"
        rows="2"
      ></textarea>
      <textarea
        value={fields.durations.join(", ")}
        onChange={(e) =>
          setFields((prev) => ({ ...prev, durations: e.target.value.split(",").map((item) => item.trim()) }))
        }
        className="w-full p-3 border border-gray-300 rounded-md"
        placeholder="Durations (comma-separated)"
        rows="2"
      ></textarea>
      <textarea
        value={fields.interests.join(", ")}
        onChange={(e) =>
          setFields((prev) => ({ ...prev, interests: e.target.value.split(",").map((item) => item.trim()) }))
        }
        className="w-full p-3 border border-gray-300 rounded-md"
        placeholder="Interests (comma-separated)"
        rows="3"
      ></textarea>
      <button
        type="submit"
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Update Fields
      </button>
    </form>
  );
};

export default AdminGenerateItineraryForm;
