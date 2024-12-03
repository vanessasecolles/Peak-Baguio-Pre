import React from "react";
import { useParams } from "react-router-dom";
import ReusuableCategoryAdmin from "./ReusuableCategoryAdmin"; // Your reusable admin component

const AdminCategory = () => {
  const { categoryName } = useParams();

  // Define a mapping from the URL-friendly version to the Firestore document ID
  const categoryMapping = {
    "adventures-activities": "Adventures & Activities",
    "art-creativity": "Art & Creativity",
    "culture-history": "Culture & History",
    "events-festivals": "Events & Festivals",
    "family-friendly": "Family-Friendly",
    "food-gastronomy": "Food & Gastronomy",
    "nature-outdoors": "Nature & Outdoors",
    "seasonal-attractions": "Seasonal Attractions",
    "shopping-souvenirs": "Shopping & Souvenirs",
  };

  // Use the mapping to get the correct Firestore document ID
  const formattedCategoryName = categoryMapping[categoryName];

  if (!formattedCategoryName) {
    return <div>Category not found</div>; // Handle case where the category is invalid
  }

  return <ReusuableCategoryAdmin categoryName={formattedCategoryName} />;
};

export default AdminCategory;
