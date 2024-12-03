import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";

const Categories = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const categoriesCollection = collection(db, "categories");
    const unsubscribe = onSnapshot(categoriesCollection, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className="py-16 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50">
      <h2 className="text-4xl font-bold mb-12 text-center text-teal-700">Categories of Activities</h2>
      {categories.length === 0 ? (
        <p className="text-center text-lg text-gray-700">No categories available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto px-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group relative bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-500 hover:scale-105"
            >
              <div className="p-8">
                <h3 className="text-3xl font-semibold mb-4 text-teal-800 group-hover:text-teal-600 transition-colors duration-300">
                  {category.name}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">{category.description}</p>
                <button className="bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500 transition-transform transform hover:scale-105 duration-300 ease-in-out">
                  Explore More
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Categories;
