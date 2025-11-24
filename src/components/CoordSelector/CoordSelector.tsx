import { memo, useMemo, useRef, useState } from 'react';
import PrismaZoom from 'react-prismazoom';
import { AspectRatio, Box, Center, Group, Image, UnstyledButton } from '@mantine/core';
import { renderImage, renderThumbnail } from '@/components/ImageInput/ImageInput';

export const CoordSelectorGrid = memo(
  ({
    images,
    coords,
    onChange,
  }: {
    images: HTMLImageElement[];
    coords: { x: number; y: number; w: number; h: number }[];
    onChange: (index: number, coord: { x: number; y: number; w: number; h: number }) => void;
  }) => {
    const [currentImage, setCurrentImage] = useState<number>(0);
    return (
      <Box style={{ overflow: 'hidden' }}>
        <AspectRatio ratio={Math.min(...coords.map((coord) => coord.w / coord.h))} mah="80dvh">
          <CoordSelector
            image={images[currentImage]}
            coords={coords[currentImage]}
            onSelect={(newCoords) => onChange(currentImage, newCoords)}
          />
        </AspectRatio>
        <Group justify="center" mt="xs">
          {images.map((_, index) => (
            <UnstyledButton key={index} style={{ zIndex: 1000 }}>
              <Image
                src={
                  coords[index].x && coords[index].y
                    ? renderThumbnail(images[index], 120, coords[index].x, coords[index].y)
                    : renderImage(images[index], 0.2)
                }
                style={{
                  border:
                    index === currentImage
                      ? '2px solid white'
                      : coords[index].x && coords[index].y
                        ? '2px solid var(--mantine-primary-color-6)'
                        : '2px solid transparent',
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                }}
                onClick={() => setCurrentImage(index)}
              />
            </UnstyledButton>
          ))}
        </Group>
      </Box>
    );
  }
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

  const mouseCoords = useRef<{ x: number; y: number } | null>(null);

  const imageSrc = useMemo(() => renderImage(image), [image]);

  const invertedCursor = true;

  return (
    <Center mah="80dvh">
      <PrismaZoom allowTouchEvents>
        <UnstyledButton
          style={{ position: 'relative', display: 'inline-block' }}
          onMouseDown={(e) => (mouseCoords.current = { x: e.clientX, y: e.clientY })}
          onClick={(e) => {
            if (mouseCoords.current) {
              const deltaX = e.clientX - mouseCoords.current.x;
              const deltaY = e.clientY - mouseCoords.current.y;
              if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) > 5) {
                return;
              }
            }
            const rect = (e.target as HTMLImageElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * image.width;
            const y = ((e.clientY - rect.top) / rect.height) * image.height;
            onSelect({ x, y, w: image.width, h: image.height });
            mouseCoords.current = null;
          }}
        >
          <Image
            src={imageSrc}
            mah="80dvh"
            style={{
              //cursor: `url(${renderCursor(image)}) 20 20, pointer`,
              cursor: 'crosshair',
            }}
          />
          {coords.x > 0 &&
            coords.y > 0 &&
            (invertedCursor ? (
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
            ))}
        </UnstyledButton>
      </PrismaZoom>
    </Center>
  );
}
