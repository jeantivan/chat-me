import { useEffect, useState, useRef } from "react";

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions()
  );
  function handleResize() {
    setWindowDimensions(getWindowDimensions());
  }

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [windowDimensions]);

  return windowDimensions;
};

// Custom Hook.
//
// Obtiene las dimensiones totales de un contenedor
export const useContainerDimensions = () => {
  const ref = useRef(null);
  const [containerDimensions, setContainerDimensions] = useState(
    getWindowDimensions()
  );

  function getContainerDimensions() {
    // Si el container no se ha renderizado width = 0 y height = 0
    if (!ref.current) return { width: 0, height: 0 };

    // Dimensiones totales del contenedor;
    const { offsetHeight: height, offsetWidth: width } = ref.current;

    return { width, height };
  }

  useEffect(() => {
    function handleResize() {
      setContainerDimensions(getContainerDimensions());
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [ref, containerDimensions]);

  return [ref, containerDimensions];
};
