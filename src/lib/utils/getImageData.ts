export const getImageData = (
  image: File
): Promise<{ src: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    if (!image.type.startsWith("image")) {
      reject("Invalid file type!");
    }
    let src: string;
    const img = new Image();

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        img.src = reader.result;
        src = reader.result;
      }
    };

    reader.readAsDataURL(image);

    img.onload = () => {
      resolve({ src: src, width: img.width, height: img.height });
    };
  });
};
