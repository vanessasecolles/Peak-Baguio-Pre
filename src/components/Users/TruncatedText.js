// TruncatedText.js
import React, { useRef, useState, useEffect } from "react";

const TruncatedText = ({ htmlContent, maxHeight = "max-h-32" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current && !isExpanded) {
      // Check if content is taller than the container
      setIsTruncated(
        contentRef.current.scrollHeight > contentRef.current.clientHeight
      );
    } else {
      setIsTruncated(false);
    }
  }, [htmlContent, isExpanded]);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div>
      {/* The text container with a max height when collapsed */}
      <div
        ref={contentRef}
        className={`transition-all duration-300 ease-in-out ${
          !isExpanded ? `${maxHeight} overflow-hidden` : ""
        }`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Show toggle button only if content is truncated */}
      {isTruncated && (
        <button onClick={toggleExpanded} className="text-blue-500 underline mt-1">
          {isExpanded ? "Read Less" : "Read More"}
        </button>
      )}
    </div>
  );
};

export default TruncatedText;
