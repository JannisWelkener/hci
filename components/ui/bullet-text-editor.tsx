import { X } from "lucide-react";
import { useState } from "react";

interface BulletListEditorProps {
  items: string[];
  fieldKey: string;
  placeholder: string;
  handleChange: (key: string, value: any) => void;
}

export default function BulletListEditor({ items, fieldKey, placeholder, handleChange }: BulletListEditorProps) {
  const [input, setInput] = useState("");

  const addItem = () => {
    const trimmed = input.trim();
    if (trimmed && !items.includes(trimmed)) {
      handleChange(fieldKey, [...items, trimmed]);
      setInput("");
    }
  };

  const removeItem = (item: string) => {
    handleChange(fieldKey, items.filter((i) => i !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="mb-4">
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border p-2 rounded w-full"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={addItem}
          className="bg-[#DC3C05] text-white px-4 rounded hover:bg-[#DC3C05]"
        >
          Add
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2"
          >
            
            <button
            type="button"
            onClick={() => removeItem(item)}
            className="flex items-center justify-center w-5 h-5 bg-[#DC3C05] text-white rounded-full shrink-0 hover:bg-[#DC3C05]"
            >
            <X className="w-3 h-3" />
            </button>

            <span className="leading-6">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
