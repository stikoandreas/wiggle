import { memo, useMemo } from 'react';
import { Center, Image, SimpleGrid } from '@mantine/core';
import { renderImage } from '@/components/ImageInput/ImageInput';

export const CoordSelectorGrid = memo(
  ({
    images,
    coords,
    onChange,
  }: {
    images: HTMLImageElement[];
    coords: { x: number; y: number; w: number; h: number }[];
    onChange: (index: number, coord: { x: number; y: number; w: number; h: number }) => void;
  }) => (
    <SimpleGrid cols={3}>
      {images.map((image, index) => (
        <CoordSelector
          key={index}
          coords={coords[index]}
          image={image}
          onSelect={(newCoords) => onChange(index, newCoords)}
        />
      ))}
    </SimpleGrid>
  )
);

function CoordSelector({
  image,
  coords,
  onSelect,
}: {
  image: HTMLImageElement;
  coords: { x: number; y: number; w: number; h: number };
  onSelect: (coords: { x: number; y: number; w: number; h: number }) => void;
}) {
  // Click on image to select image pixel coordinates, based on the image itself

  const imageSrc = useMemo(() => renderImage(image), [image]);

  const invertedCursor = true;

  return (
    <Center>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <Image
          src={imageSrc}
          onClick={(e) => {
            const rect = (e.target as HTMLImageElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * image.width;
            const y = ((e.clientY - rect.top) / rect.height) * image.height;
            onSelect({ x, y, w: image.width, h: image.height });
          }}
          style={{
            //cursor: `url(${renderCursor(image)}) 20 20, pointer`,
            cursor: 'crosshair',
          }}
        />
        {invertedCursor ? (
          <Image
            src={imageSrc}
            onClick={(e) => {
              e.preventDefault();
            }}
            style={{
              filter: 'invert(1)',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              maskImage: `radial-gradient(circle 4px at ${(coords.x / coords.w) * 100}%  ${(coords.y / coords.h) * 100}%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)`,
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              left: `calc(${(coords.x / coords.w) * 100}%)`,
              top: `calc(${(coords.y / coords.h) * 100}%)`,
              width: '8px',
              height: '8px',
              backgroundColor: 'red',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </Center>
  );
}
