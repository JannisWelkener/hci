import { RotateCcw } from "lucide-react";
import { useState } from "react";

interface BuzzwordEditProps {
  buzzwords: string[];
  persona: any;
  editablePersona: any;
  handleChange: (key: string, value: any) => void;
}

export default function BuzzwordEdit({ buzzwords, handleChange, persona, editablePersona }: BuzzwordEditProps) {
  const [input, setInput] = useState("");

  const addBuzzword = () => {
    const trimmed = input.trim();
    if (trimmed && !buzzwords.includes(trimmed)) {
      handleChange("buzzwords", [...buzzwords, trimmed]);
      setInput("");
    }
  };

  const removeBuzzword = (word: string) => {
    handleChange("buzzwords", buzzwords.filter((b) => b !== word));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addBuzzword();
    }
  };

  const buzzwordsEqual =
    JSON.stringify(editablePersona.buzzwords) ===
    JSON.stringify(persona?.buzzwords);

  return (
    <div className="mb-4">
      {/* Input + Add button */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border p-2 rounded w-full"
          placeholder="Add a buzzword"
        />
        <button
          type="button"
          onClick={addBuzzword}
          className="bg-orange-600 text-white px-4 rounded hover:bg-orange-700"
        >
          Add
        </button>
      </div>

      {/* Buzzwords list */}
      <div className="flex flex-wrap">
        {buzzwords.map((word) => (
          <div
            key={word}
            className="bg-[#eeeeee] rounded-full px-3 py-1 mr-2 mb-2 flex items-center gap-2 text-gray-600"
          >
            <span>{word}</span>
            <button
              type="button"
              onClick={() => removeBuzzword(word)}
              className="text-gray-600 hover:text-red-600 font-bold"
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => handleChange("buzzwords", persona?.buzzwords)}
          disabled={editablePersona.buzzwords === persona?.buzzwords}
          className={`rounded-full px-2 py-2 mb-2 flex items-center justify-center transition border ${buzzwordsEqual ? "hidden" : "bg-transparent hover:bg-gray-700"
            }`}
          title="Reset"
        >
          <RotateCcw size={14} />
        </button>


      </div>
    </div>
  );
}
