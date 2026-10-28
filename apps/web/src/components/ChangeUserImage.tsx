import { ChangeEvent, useRef, useState } from "react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Camera, Eye, Upload, Trash2, X } from "lucide-react";
import { UserImage } from "./UserImage";
import { Icon } from "./ui/Icon";
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from "./ui/Menu";
import { DialogRoot, DialogContent } from "./ui/Dialog";
import useStore from "@/lib/store";
import { useUpdateProfile, uploadAvatar } from "@/lib/api/profileQueries";

export function ChangeUserImage() {
  const picture = useStore((state) => state.user.picture);
  const updateProfile = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      setIsUploading(true);
      const publicUrl = await uploadAvatar(file);
      await updateProfile.mutateAsync({ pictureUrl: publicUrl });
    } catch (err: any) {
      alert(err?.message || "Error al subir la imagen de perfil");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePicture = async () => {
    try {
      await updateProfile.mutateAsync({ pictureUrl: "" });
    } catch (err: any) {
      alert(err?.message || "Error al eliminar la foto de perfil");
    }
  };

  return (
    <>
      <div className="group w-[200px] h-[200px] cursor-pointer relative rounded-full text-gray-400 overflow-hidden">
        <UserImage />
        <div className="hidden group-hover:flex select-none items-center justify-center absolute w-full h-full inset-0 bg-neutral-900/80">
          <MenuRoot>
            <MenuTrigger asChild>
              <button
                type="button"
                aria-label="Elegir foto de perfil"
                disabled={isUploading}
                className="w-3/4 flex flex-col items-center justify-center mt-5 outline-none cursor-pointer"
              >
                <Icon
                  label="Cámara"
                  icon={Camera}
                  className="w-6 h-6 mb-1 text-neutral-50"
                />
                <span className="uppercase text-center text-sm text-neutral-50 w-4/5">
                  {isUploading ? "Subiendo..." : "Elegir foto de perfil"}
                </span>
              </button>
            </MenuTrigger>

            <MenuContent align="center" className="min-w-[180px]">
              <MenuItem
                icon={Eye}
                disabled={!picture}
                onClick={() => setLightboxOpen(true)}
              >
                Ver foto
              </MenuItem>
              <MenuItem
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
              >
                Subir foto
              </MenuItem>
              <MenuItem
                icon={Trash2}
                disabled={!picture}
                onClick={handleRemovePicture}
                className="text-red-500 hover:text-red-600 data-[disabled]:text-background-11"
              >
                Eliminar foto
              </MenuItem>
            </MenuContent>
          </MenuRoot>
        </div>

        <VisuallyHidden.Root>
          <label htmlFor="profile-picture">Seleccionar imagen de perfil:</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            name="profile-picture"
            id="profile-picture"
            onChange={handleChange}
          />
        </VisuallyHidden.Root>
      </div>

      <DialogRoot open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent open={lightboxOpen} overlayClassName="bg-background-1/80">
          <div
            data-testid="avatar-lightbox"
            className="relative max-w-lg max-h-[85vh] p-4 flex flex-col items-center justify-center"
          >
            {picture ? (
              <img
                src={picture}
                alt="Foto de perfil"
                className="max-w-full max-h-[70vh] rounded-lg object-contain shadow-2xl"
              />
            ) : null}
            <button
              onClick={() => setLightboxOpen(false)}
              className="mt-4 px-4 py-2 bg-background-5 hover:bg-background-6 text-background-12 rounded-md font-medium text-sm flex items-center gap-2 cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          </div>
        </DialogContent>
      </DialogRoot>
    </>
  );
}
