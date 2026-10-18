import {
  HTMLAttributes,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import { useDropzone } from "react-dropzone";

const DragActive = () => (
  <div className="w-full border-2 border-background-6 flex items-center justify-center">
    <h2 className="text-background-11 text-2xl">Arrastra tus imágenes aquí</h2>
  </div>
);

type TFilesToSend = {
  open: () => void;
  files: File[];
  deleteFile: (file: File) => void;
};

export const FilesToSendContext = createContext<TFilesToSend>(
  {} as TFilesToSend
);
export const useFilesToSend = () => useContext(FilesToSendContext);

export function FilesToSend({
  children,
  ...rest
}: { children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  const [filesToSend, setFilesToSend] = useState<File[]>([]);

  const deleteFile = (file: File) => {
    const newFiles = filesToSend.filter((f) => f.name !== file.name);

    setFilesToSend(newFiles);
  };

  const { getInputProps, getRootProps, isDragActive, open } = useDropzone({
    maxFiles: 5,
    noClick: true,
    noKeyboard: true,
    accept: {
      "image/*": []
    },
    onDrop(acceptedFiles) {
      console.log({ acceptedFiles });

      setFilesToSend([...filesToSend, ...acceptedFiles]);
    }
  });

  useEffect(() => {
    console.log({ filesToSend });
  }, [filesToSend]);
  return (
    <FilesToSendContext.Provider
      value={{
        open,
        deleteFile,
        files: filesToSend
      }}
    >
      <div {...getRootProps(rest)}>
        {children}
        {isDragActive && (
          <div className="col-start-1 col-end-2 row-start-2 row-end-4 flex bg-background-1 z-20 p-5">
            <DragActive />
          </div>
        )}
        <input {...getInputProps()} />
      </div>
    </FilesToSendContext.Provider>
  );
}
