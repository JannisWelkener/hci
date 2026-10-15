import { Persona } from "@/lib/types/database";
import { RotateCcw } from "lucide-react";
import React from "react";

interface EditableFieldProps {
  label: string;
  icon: React.ElementType;
  field: keyof Persona;
  type?: string;
  editablePersona: Partial<Persona>;
  persona?: Persona | null;
  handleChange: (key: string, value: any) => void;
}

export default function EditableField({
  label,
  icon: Icon,
  field,
  type = "text",
  editablePersona,
  persona,
  handleChange,
}: EditableFieldProps) {
  const value = editablePersona[field];
  const originalValue = persona?.[field];
  const isUnchanged = value === originalValue;

  const inputValue =
    typeof value === "string" || typeof value === "number" ? value : "";

  return (
    <div className="w-full">
      <label className="block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <div className="rounded-full p-2 m-2 bg-[#DC3C05]">
          <Icon color="white"/>
        </div>
        <input
          type={type}
          value={inputValue}
          onChange={(e) => {
            const newValue = type === "number" && e.target.value !== ""
              ? Number(e.target.value)
              : e.target.value === "" && type === "number"
              ? null
              : e.target.value;
            handleChange(field as string, newValue);
          }}
          className="border p-1 w-full rounded"
        />
        <button
          type="button"
          onClick={() => handleChange(field as string, originalValue)}
          className={`border rounded-full p-2 transition ${
            isUnchanged ? "hidden" : "bg-transparent hover:bg-gray-700"
          }`}
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
