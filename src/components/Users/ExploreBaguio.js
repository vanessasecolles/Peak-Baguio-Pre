// src/components/ExploreBaguio/ExploreBaguio.jsx
import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";

const PAGE_SIZE = 8;

const ExploreBaguio = ({ showSuggestions = true }) => {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Fetch spots
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "spots"),
      (snap) => {
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSpots(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, []);

  // Filter by search only
  const filtered = useMemo(() => {
    return spots.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [spots, searchQuery]);

  // Handlers
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };
  const loadMore = () => setVisibleCount((c) => c + PAGE_SIZE);

  // Dynamic container width when few items
  const maxWidthClass = spots.length <= 6 ? "max-w-4xl" : "max-w-6xl";

  // Pick 2 dynamic suggested spots from existing ones
  const suggested = useMemo(() => {
    if (!spots || spots.length === 0) return [];
    const pool = [...spots];
    // Simple shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // Prefer items not at the very top to feel fresh
    return pool.slice(0, Math.min(2, pool.length));
  }, [spots]);

  // Suggestions are shown at the bottom when at least two spots exist

  return (
    <section
      aria-labelledby="explore-heading"
      className="py-16 bg-gradient-to-r from-teal-100 via-blue-100 to-teal-50"
    >
      <h2
        id="explore-heading"
        className="text-4xl font-bold mb-8 text-center text-teal-700"
      >
        Explore Baguio
      </h2>

      {/* Search only */}
  <div className="max-w-4xl mx-auto mb-12 px-4">
        <input
          type="search"
          aria-label="Search spots"
          placeholder="Search spots..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="w-full px-4 py-2 border rounded-lg shadow focus:outline-none"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div
          className={`${maxWidthClass} mx-auto px-4 grid gap-6`}
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
        >
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white rounded-lg h-64 shadow"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-lg text-gray-700">
          No spots found.
        </p>
      ) : (
        <>
          <div
            className={`${maxWidthClass} mx-auto px-4 grid gap-6`}
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
          >
            {filtered.slice(0, visibleCount).map((spot) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                expanded={expandedIds.has(spot.id)}
                onToggleExpand={() => toggleExpand(spot.id)}
              />
            ))}
          </div>
          {visibleCount < filtered.length && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                className="px-6 py-3 bg-teal-600 text-white rounded-full shadow hover:bg-teal-700 transition"
              >
                Load more
              </button>
            </div>
          )}

          {/* Suggested Spots Section */}
          {showSuggestions && suggested.length >= 2 && (
            <section aria-labelledby="suggested-heading" className="mt-12">
              <div className={`${maxWidthClass} mx-auto px-4`}>
                <h3 id="suggested-heading" className="text-2xl font-bold text-teal-700 mb-6">Suggested Spots</h3>
                <SuggestedCarousel items={suggested.slice(0, 2)} />
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
};

// Simple carousel for Suggested Spots
const SuggestedCarousel = ({ items }) => {
  const [idx, setIdx] = React.useState(0);

  // Auto-advance every 5s
  React.useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(id);
  }, [items.length]);

  const prev = () => setIdx((i) => (i - 1 + items.length) % items.length);
  const next = () => setIdx((i) => (i + 1) % items.length);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {items.map((spot) => (
            <div key={`slide-${spot.id}`} className="min-w-full px-1">
              <SpotCard spot={spot} expanded={false} onToggleExpand={() => {}} />
            </div>
          ))}
        </div>
      </div>
      {/* Controls */}
      <button
        type="button"
        aria-label="Previous suggestion"
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-teal-700 border border-teal-600 rounded-full w-9 h-9 flex items-center justify-center shadow"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next suggestion"
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-teal-700 border border-teal-600 rounded-full w-9 h-9 flex items-center justify-center shadow"
      >
        ›
      </button>
      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {items.map((_, i) => (
          <span
            key={`dot-${i}`}
            className={`h-2 w-2 rounded-full ${i === idx ? 'bg-teal-600' : 'bg-teal-300'}`}
          />
        ))}
      </div>
    </div>
  );
};

const SpotCard = ({ spot, expanded, onToggleExpand }) => {
  const { id, name, description, image } = spot;
  const isLong = description.length > 150;

  return (
    <Link
      to={`/spots/${id}`}
      className="group block rounded-lg shadow-lg overflow-hidden bg-white transform transition-transform duration-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400"
      aria-labelledby={`spot-${id}-title`}
    >
      {/* Media */}
      {image ? (
        <div className="relative w-full h-48 overflow-hidden">
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
        </div>
      ) : (
        <div className="flex items-center justify-center bg-gray-200 w-full h-48">
          <span className="text-gray-500">No image</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col">
        <h3
          id={`spot-${id}-title`}
          className="text-2xl font-semibold mb-1 text-teal-800 group-hover:text-teal-600 transition-colors duration-300"
        >
          {name}
        </h3>
        <p
          className={`text-gray-700 flex-grow ${
            !expanded && isLong ? "line-clamp-2" : ""
          }`}
          dangerouslySetInnerHTML={{ __html: description }}
        />
        {isLong && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleExpand();
            }}
            className="mt-2 text-sm text-teal-600 hover:underline focus:outline-none"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
        <div className="mt-4">
          <span className="inline-block px-3 py-1 text-sm font-medium border border-teal-600 rounded-full text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition">
            Learn more →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ExploreBaguio;
