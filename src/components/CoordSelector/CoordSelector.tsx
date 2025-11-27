import { memo, useRef, useState } from 'react';
import PrismaZoom from 'react-prismazoom';
import { AspectRatio, Box, Center, Group, Image, Text, UnstyledButton } from '@mantine/core';
import { renderThumbnail, WiggleImage } from '@/components/ImageInput/ImageInput';

export const CoordSelectorGrid = memo(
  ({
    images,
    onChange,
  }: {
    images: WiggleImage[];
    onChange: (index: number, newImage: WiggleImage) => void;
  }) => {
    const [currentImage, setCurrentImage] = useState<number>(0);
    const selectedImages = images.filter((image) => image.x && image.y);
    return (
      <Box style={{ overflow: 'hidden', position: 'relative' }}>
        {selectedImages.length < images.length && (
          <Box
            style={{
              position: 'absolute',
              zIndex: 2,
              top: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              width: '100%',
              textAlign: 'center',
            }}
            p={4}
          >
            <Text size="sm">Zoom and select the same point on all {images.length} images.</Text>
            <Text size="sm">
              ({selectedImages.length}/{images.length} selected)
            </Text>
          </Box>
        )}
        <AspectRatio ratio={Math.min(...images.map((image) => image.w / image.h))} mah="80dvh">
          <CoordSelector
            image={images[currentImage]}
            onSelect={(newImage) => onChange(currentImage, newImage)}
          />
        </AspectRatio>
        <Group justify="center" mt="xs" gap={4}>
          {images.map((image, index) => (
            <UnstyledButton key={index} style={{ zIndex: 1 }}>
              <Image
                src={
                  image.x && image.y
                    ? renderThumbnail(image.image, 120, image.x, image.y)
                    : image.src
                }
                style={{
                  border:
                    index === currentImage
                      ? '2px solid white'
                      : image.x && image.y
                        ? '2px solid var(--mantine-primary-color-6)'
                        : '2px solid transparent',
                  height: `min(120px, calc(100vw / ${images.length} - ${images.length + 1} * 0.25rem * var(--mantine-scale)))`,
                  objectFit: 'cover',
                  width: `min(120px, calc(100vw / ${images.length} - ${images.length + 1} * 0.25rem * var(--mantine-scale)))`,
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
  onSelect,
}: {
  image: WiggleImage;
  onSelect: (newImage: WiggleImage) => void;
}) {
  // Click on image to select image pixel coordinates, based on the image itself

  const mouseCoords = useRef<{ x: number; y: number } | null>(null);

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
            const x = ((e.clientX - rect.left) / rect.width) * image.w;
            const y = ((e.clientY - rect.top) / rect.height) * image.h;
            onSelect({ ...image, x, y });
            mouseCoords.current = null;
          }}
        >
          <Image
            src={image.src}
            mah="80dvh"
            style={{
              //cursor: `url(${renderCursor(image)}) 20 20, pointer`,
              cursor: 'crosshair',
            }}
          />
          {image.x &&
            image.y &&
            (invertedCursor ? (
              <Image
                src={image.src}
                onClick={(e) => {
                  e.preventDefault();
                }}
                style={{
                  filter: 'invert(1)',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none',
                  maskImage: `radial-gradient(circle 4px at ${(image.x / image.w) * 100}%  ${(image.y / image.h) * 100}%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)`,
                }}
              />
            ) : (
              <svg
                width="8"
                height="8"
                style={{
                  position: 'absolute',
                  left: `calc(${(image.x / image.w) * 100}%)`,
                  top: `calc(${(image.y / image.h) * 100}%)`,
                  transform: 'translate(-50%,-50%)',
                  pointerEvents: 'none',
                }}
              >
                <path d="M 0 4 H 9" stroke="white" strokeWidth={0.5} />
                <path d="M 4 0 V 9" stroke="white" strokeWidth={0.5} />
              </svg>
            ))}
        </UnstyledButton>
      </PrismaZoom>
    </Center>
  );
}
