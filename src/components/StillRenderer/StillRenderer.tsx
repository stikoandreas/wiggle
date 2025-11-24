import { useEffect, useRef } from 'react';

export function roundToEven(value: number): number {
  return 2 * Math.round(value / 2);
}

export function useImagePlacer(
  imageCoords: { x: number; y: number; w: number; h: number }[],
  scale_factor: number = 0.1,
  padding = 0
) {
  const x_origin = Math.max(...imageCoords.map((coord) => coord.x));
  const y_origin = Math.max(...imageCoords.map((coord) => coord.y));

  const natural_width = Math.max(...imageCoords.map((coord) => coord.w + x_origin - coord.x));
  const natural_height = Math.max(...imageCoords.map((coord) => coord.h + y_origin - coord.y));

  const padding_width = natural_width * padding;
  const padding_height = natural_height * padding;

  const width = roundToEven((natural_width + padding_width * 2) * scale_factor);
  const height = roundToEven((natural_height + padding_height * 2) * scale_factor);

  function position(coordIndex: number): [number, number, number, number] {
    return [
      (x_origin - imageCoords[coordIndex].x + padding_width) * scale_factor,
      (y_origin - imageCoords[coordIndex].y + padding_height) * scale_factor,
      imageCoords[coordIndex].w * scale_factor,
      imageCoords[coordIndex].h * scale_factor,
    ];
  }

  return {
    width,
    height,
    position,
  };
}

export function StillRenderer({
  images,
  imageCoords,
}: {
  images: HTMLImageElement[];
  imageCoords: { x: number; y: number; w: number; h: number }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { width, height, position } = useImagePlacer(imageCoords, 0.5, 0.1);
  useEffect(() => {
    if (images.length === 0) {
      return;
    }
    if (!canvasRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    canvas.width = width;
    canvas.height = height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = 0.5;

    // Draw each image at its specified coordinates
    images.forEach((image, index) => {
      ctx.drawImage(image, ...position(index));
    });
  }, [images, imageCoords]);

  return <canvas ref={canvasRef} style={{ border: '1px solid black', width: '50%' }} />;
}
