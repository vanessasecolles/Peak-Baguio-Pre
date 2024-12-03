import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-800 text-white text-center py-4">
      <p>&copy; {year} Peak Baguio. All Rights Reserved.</p>
    </footer>
  );
};

export default Footer;
