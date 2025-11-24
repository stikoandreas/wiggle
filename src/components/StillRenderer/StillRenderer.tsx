import { memo, useEffect, useRef } from 'react';
import { Crop, PercentCrop } from 'react-image-crop';
import { WiggleImage } from '../ImageInput/ImageInput';

export function roundToEven(value: number): number {
  return 2 * Math.round(value / 2);
}

function zeroIfUndefined(value: number | undefined) {
  return value || 0;
}

export function useImagePlacer(
  images: WiggleImage[],
  scale_factor: number = 0.1,
  padding = 0,
  crop?: PercentCrop
) {
  const x_origin = Math.max(...images.map((coord) => zeroIfUndefined(coord.x)));
  const y_origin = Math.max(...images.map((coord) => zeroIfUndefined(coord.y)));

  // Determine the natural width and height needed to fit all images
  const natural_width = Math.max(
    ...images.map((coord) => coord.w + x_origin - zeroIfUndefined(coord.x))
  );
  const natural_height = Math.max(
    ...images.map((coord) => coord.h + y_origin - zeroIfUndefined(coord.y))
  );

  // Determine padding in pixels
  const x_padding = natural_width * padding;
  const y_padding = natural_height * padding;

  // Determine padded canvas size
  const padded_width = natural_width + x_padding * 2;
  const padded_height = natural_height + y_padding * 2;

  // Determine cropped size
  const cropped_width = (padded_width * (crop?.width || 100)) / 100;
  const cropped_height = (padded_height * (crop?.height || 100)) / 100;

  // Round to even numbers for mp4 encoding
  const width = roundToEven(cropped_width * scale_factor);
  const height = roundToEven(cropped_height * scale_factor);

  function position(coordIndex: number, crop?: Crop): [number, number, number, number] {
    const x_crop_offset = (padded_width * (crop?.x || 0)) / 100;
    const y_crop_offset = (padded_height * (crop?.y || 0)) / 100;

    return [
      (x_origin - zeroIfUndefined(images[coordIndex].x) + x_padding - x_crop_offset) * scale_factor,
      (y_origin - zeroIfUndefined(images[coordIndex].y) + y_padding - y_crop_offset) * scale_factor,
      images[coordIndex].w * scale_factor,
      images[coordIndex].h * scale_factor,
    ];
  }

  return {
    width,
    height,
    position,
  };
}

export const StillRenderer = memo(({ images }: { images: WiggleImage[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { width, height, position } = useImagePlacer(images, 0.5, 0.1);
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

    ctx.globalAlpha = 1 / images.length;

    // Draw each image at its specified coordinates
    images.forEach((image, index) => {
      ctx.drawImage(image.image, ...position(index));
    });
  }, [images]);

  return <canvas ref={canvasRef} style={{ width: '100%', maxHeight: '80dvh' }} />;
});
