// src/frontend/components/Photo.jsx

import React, { useRef } from 'react';
import '../assets/styles/components/CarouselItemimage.scss';

const Photo = ({ image }) => {
  const imgRef = useRef(null);
  const lensRef = useRef(null);
  const resultRef = useRef(null);
  const rafId = useRef(null);

  const handleMouseEnter = () => {
    const img = imgRef.current;
    const result = resultRef.current;
    if (!img || !result) return;

    // Mostrar la ventana de zoom
    result.style.display = 'block';

    // Crear el lente solo una vez
    if (!lensRef.current) {
      const lens = document.createElement('div');
      lens.className = 'img-zoom-lens';
      // mantenlo oculto hasta el primer movimiento
      lens.style.display = 'none';
      lensRef.current = lens;
      img.parentElement.insertBefore(lens, img);

      // Prepara background del resultado
      const cx = result.offsetWidth / lens.offsetWidth;
      const cy = result.offsetHeight / lens.offsetHeight;
      result.style.backgroundImage = `url(${img.src})`;
      result.style.backgroundSize = `${img.width * cx}px ${img.height * cy}px`;
    }
  };

  // Función que realmente mueve el lente y muestra el mismo
  const moveLens = e => {
    const img = imgRef.current;
    const lens = lensRef.current;
    const result = resultRef.current;
    if (!img || !lens || !result) return;

    // Mostrar el lente en cuanto empiece a moverse
    lens.style.display = 'block';

    const rect = img.getBoundingClientRect();
    let x = e.pageX - rect.left - window.pageXOffset - lens.offsetWidth / 2;
    let y = e.pageY - rect.top - window.pageYOffset - lens.offsetHeight / 2;

    // límites
    x = Math.max(0, Math.min(x, img.width - lens.offsetWidth));
    y = Math.max(0, Math.min(y, img.height - lens.offsetHeight));

    lens.style.left = `${x}px`;
    lens.style.top = `${y}px`;

    // mueve la ventana de zoom
    const cx = result.offsetWidth / lens.offsetWidth;
    const cy = result.offsetHeight / lens.offsetHeight;
    result.style.backgroundPosition = `-${x * cx}px -${y * cy}px`;
  };

  // Throttle con rAF para suavidad
  const handleMouseMove = e => {
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      moveLens(e);
      rafId.current = null;
    });
  };

  const handleMouseLeave = () => {
    // ocultar todo y limpiar
    if (resultRef.current) {
      resultRef.current.style.display = 'none';
      resultRef.current.style.backgroundImage = 'none';
    }
    if (lensRef.current) {
      lensRef.current.remove();
      lensRef.current = null;
    }
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  };

  return (
    <div className="photo-container">
      <img
        ref={imgRef}
        src={image}
        alt="product"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <div
        ref={resultRef}
        className="img-zoom-result"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default Photo;
