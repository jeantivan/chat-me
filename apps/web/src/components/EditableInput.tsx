import { useState, useRef } from "react";
import { X, Check, Pencil } from "lucide-react";
import { Icon } from "./ui/Icon";

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
      <div className="text-primary-9 text-sm mb-2">{label}</div>
      <div
        className={`flex items-stretch border-b ${
          error
            ? "border-red-500"
            : isEditing
            ? "border-primary-7"
            : "border-transparent"
        }`}
      >
        {isEditing ? (
          <>
            <input
              className="p-2 pb-1 flex-1 focus:outline-none bg-transparent text-background-12"
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
                className="w-6 h-6 inline-flex items-center justify-center rounded-sm mr-2 border border-primary-7  text-primary-9"
                title="Cancelar"
                onClick={() => {
                  setError("");
                  setIsEditing(false);
                }}
              >
                <Icon icon={X} label="Cancelar" />
              </button>
              <button
                className="w-6 h-6 inline-flex items-center justify-center rounded-sm text-primary-12 border border-primary-7 bg-primary-9"
                title="Guardar cambios"
                onClick={handleSave}
              >
                <Icon icon={Check} label="Guardar cambios" />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 p-2 pb-1 text-background-12">{value}</div>
            <button
              className="w-4 h-4 text-background-9 self-center"
              title={`Editar ${label}.`}
              onClick={() => {
                setIsEditing(true);
              }}
            >
              <Icon icon={Pencil} label="Edit Icon" />
            </button>
          </>
        )}
      </div>
      {error && <span className="mt-2 text-xs text-red-500">{error}</span>}
    </div>
  );
}
