import { ChangeEvent, useRef } from "react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Camera } from "lucide-react";
import { UserImage } from "./UserImage";
import { Icon } from "./ui/Icon";
import useStore from "@/lib/store";

const toMB = 1048576;

export function ChangeUserImage() {
  const changePicture = useStore((state) => state.changePicture);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const file = e.target.files[0];

    if (file) {
      // Peso máximo del archivo es 2 Mb
      if (file.size / toMB > 2) {
        alert(
          "El archivo seleccionado es demasiado grande. Valor máximo es 2 Mb"
        );
        return;
      }
      let reader = new FileReader();

      reader.onloadend = (e) => {
        if (
          e.target &&
          e.target.result &&
          typeof e.target.result === "string"
        ) {
          changePicture(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="group w-[200px] h-[200px] cursor-pointer relative rounded-full text-gray-400 overflow-hidden">
      <UserImage />
      <div className="hidden group-hover:flex select-none items-center justify-center absolute w-full h-full inset-0 bg-neutral-900/80">
        <button
          onClick={() => {
            if (!fileInputRef.current) {
              return;
            }

            fileInputRef.current.click();
          }}
          className="w-3/4 flex flex-col items-center justify-center mt-5"
        >
          <Icon
            label="Cámara"
            icon={Camera}
            className="w-6 h-6 mb-1 text-neutral-50"
          />
          <span className="uppercase text-center text-sm text-neutral-50 w-4/5">
            Elegir foto de perfil
          </span>
        </button>
      </div>
      <VisuallyHidden.Root>
        <label htmlFor="profile-picture">Seleccionar imagen de perfil:</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          name="profile-picture"
          id="profile-picture"
          onChange={handleChange}
        />
      </VisuallyHidden.Root>
    </div>
  );
}
