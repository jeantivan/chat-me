import { useState, useRef } from "react";
import { BsPencilFill, BsCheck, BsX } from "react-icons/bs";
import { CustomIcon } from "./CustomIcon";

interface EditableInputProps {
  label: string;
  value: string;
  onSave: (newValue: string) => void;
}

export function EditableInput({
  label,
  value,
  onSave,
  ...rest
}: EditableInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState(value);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (newValue === "" && inputRef.current) {
      inputRef.current.focus();
      setError(`El ${label} no puedes estar vacío.`);

      return;
    }

    onSave(newValue);
    setIsEditing(false);
  };

  return (
    <div className="mb-5">
      <div className="text-emerald-600 text-sm mb-2">{label}</div>
      <div
        className={`flex items-stretch border-b ${
          error
            ? "border-red-500"
            : isEditing
            ? "border-emerald-500"
            : "border-transparent"
        }`}
      >
        {isEditing ? (
          <>
            <input
              className="p-2 pb-1 flex-1 focus:outline-none bg-transparent text-neutral-900 dark:text-neutral-50"
              name={label}
              defaultValue={value}
              onChange={(e) => {
                setNewValue(e.target.value);
              }}
              autoFocus
              ref={inputRef}
            />
            <div className="self-center">
              <button
                className="w-6 h-6 inline-flex items-center justify-center rounded-sm mr-2 border border-emerald-500  text-emerald-500"
                title="Cancelar"
                onClick={() => {
                  setError("");
                  setIsEditing(false);
                }}
              >
                <CustomIcon Icon={BsX} label="Cancelar" />
              </button>
              <button
                className="w-6 h-6 inline-flex items-center justify-center rounded-sm text-white border border-emerald-500 bg-emerald-500"
                title="Guardar cambios"
                onClick={handleSave}
              >
                <CustomIcon Icon={BsCheck} label="Guardar cambios" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 p-2 pb-1 text-neutral-900 dark:text-neutral-50">
              {value}
            </div>
            <button
              className="w-4 h-4 text-gray-500 self-center"
              title={`Editar ${label}.`}
              onClick={() => {
                setIsEditing(true);
              }}
            >
              <CustomIcon Icon={BsPencilFill} label="Edit Icon" />
            </button>
          </>
        )}
      </div>
      {error && <span className="mt-2 text-xs text-red-500">{error}</span>}
    </div>
  );
}
