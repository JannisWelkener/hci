"use client";
import React, { useState } from "react";

interface EditableDottedRatingProps {
  value: number;
  leftLabel: string;
  onChange: (newValue: number) => void;
  className?: string;
}

export default function EditableDottedRating({
  value,
  leftLabel,
  onChange,
  className,
}: EditableDottedRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const totalDots = 10;

  const displayedValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className={className}>
      <div className="w-full mb-2 font-sans">
        <div className="flex justify-between text-xs font-medium mb-2">
          <span>{leftLabel}</span>
        </div>

        <div className="flex justify-between gap-5 w-full">
  {Array.from({ length: totalDots }).map((_, index) => {
    const dotValue = index + 1;
    const isFilled = dotValue <= displayedValue;

    return (
      <div
        key={index}
        className={`
        flex-1 aspect-square rounded-full cursor-pointer transition-colors
          ${isFilled ? "bg-[#DC3C05]" : "bg-[#D8D7D7]"}
        `}
        onMouseEnter={() => setHoverValue(dotValue)}
        onMouseLeave={() => setHoverValue(null)}
        onClick={() => onChange(dotValue)}
      />
    );
  })}
</div>

      </div>
    </div>
  );
}
