"use client";

import React from "react";
import { toggleFavorite } from "@/data/favorites";
import { FaHeart, FaRegHeart } from "react-icons/fa";

interface FavoriteBtnProps {
  cid: number;
  author?: string;
  favorite: boolean;
  size?: number;
  className?: string;
}

export default function FavoriteBtn({
  cid,
  author,
  favorite,
  size = 24,
  className = "",
}: FavoriteBtnProps) {
  // Local optimistic state
  const [loved, setLoved] = React.useState(favorite);
  const [loading, setLoading] = React.useState(false);

  if (!author) return null;

  const handleToggle = async () => {
    if (loading) return;

    // Optimistic update
    setLoved((prev) => !prev);
    setLoading(true);

    try {
      // Backend toggle
      const result = await toggleFavorite(author, cid);

      // Ensure local state matches backend
      setLoved(result);
    } catch (err) {
      // Rollback on failure
      setLoved((prev) => !prev);
      console.error("Failed to toggle favorite:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`cursor-pointer text-red-500 flex items-center justify-center ${className}`}
      onClick={handleToggle}
    >
      {loved ? <FaHeart size={size} /> : <FaRegHeart size={size} />}
    </div>
  );
}
