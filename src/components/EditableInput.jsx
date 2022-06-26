import * as AccessibleIcon from "@radix-ui/react-accessible-icon";
import { useState } from "react";
import { BsPencilFill, BsCheck, BsX } from "react-icons/bs";
import { useDarkMode } from "./DarkMode";

export function EditableInput({ label, value, onSave, ...rest }) {
  const { mode } = useDarkMode();
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState(value);

  return (
    <div>
      <div className="text-emerald-600 text-sm mb-2">{label}</div>
      <div
        className={`flex items-stretch border-b mb-5 ${
          isEditing ? "border-emerald-500" : "border-transparent"
        }`}
      >
        {isEditing ? (
          <>
            <input
              className={`p-2 pb-1 flex-1 focus:outline-none bg-transparent ${
                mode === "light" ? "text-black" : "text-white"
              }`}
              name={label}
              defaultValue={value}
              onChange={(e) => {
                setNewValue(e.target.value);
              }}
              autoFocus
            />
            <div className="self-center">
              <button
                className="w-6 h-6 inline-flex items-center justify-center rounded-sm mr-2 border border-emerald-500  text-emerald-500"
                title="Cancelar"
                onClick={() => {
                  setIsEditing(false);
                }}
              >
                <AccessibleIcon.Root label="Cancel Icon">
                  <BsX className="w-full h-full" />
                </AccessibleIcon.Root>
              </button>
              <button
                className="w-6 h-6 inline-flex items-center justify-center rounded-sm text-white border border-emerald-500 bg-emerald-500"
                title="Guardar cambios"
              >
                <AccessibleIcon.Root label="Save Icon">
                  <BsCheck className="w-full h-full" />
                </AccessibleIcon.Root>
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              className={`flex-1 p-2 pb-1  ${
                mode === "light" ? "text-black" : "text-white"
              }`}
            >
              {value}
            </div>
            <button
              className="w-4 h-4 text-gray-500 self-center"
              title={`Editar ${label}.`}
              onClick={() => {
                setIsEditing(true);
              }}
            >
              <AccessibleIcon.Root label="Edit Icon">
                <BsPencilFill className="w-full h-full" />
              </AccessibleIcon.Root>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
