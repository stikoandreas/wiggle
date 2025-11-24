import { useState } from 'react';
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react';
import { Box, Group, LoadingOverlay, Text } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { useOs } from '@mantine/hooks';

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = URL.createObjectURL(file);
    image.onload = () => {
      resolve(image);
    };
    image.onerror = (err) => {
      reject(err);
    };
  });
}

export function renderImage(image: HTMLImageElement, scale = 0.5): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = image.width * scale;
  canvas.height = image.height * scale;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/png');
}

export function renderThumbnail(
  image: HTMLImageElement,
  size: number,
  x: number,
  y: number
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = size;
  canvas.height = size;
  ctx.globalAlpha = 1.0;
  ctx.drawImage(image, x - size / 2, y - size / 2, size, size, 0, 0, size, size);

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size / 2 - 10, size / 2);
  ctx.lineTo(size / 2 + 10, size / 2);
  ctx.moveTo(size / 2, size / 2 - 10);
  ctx.lineTo(size / 2, size / 2 + 10);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

export function ImageInput({ onChange }: { onChange: (images: HTMLImageElement[]) => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const os = useOs();
  const isMobile = ['android', 'ios'].includes(os);

  const handleFileChange = (files: File[]) => {
    setIsLoading(true);
    Promise.all(files.map((file) => loadImage(file))).then((loaded) => {
      onChange(loaded);
      setIsLoading(false);
    });
  };

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
      <Dropzone onDrop={handleFileChange} accept={IMAGE_MIME_TYPE}>
        <Group justify="center" gap="xl" mih={130} style={{ pointerEvents: 'none' }} wrap="nowrap">
          <Dropzone.Accept>
            <IconUpload size={52} color="var(--mantine-color-blue-6)" stroke={1.5} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconPhoto size={52} color="var(--mantine-color-dimmed)" stroke={1.5} />
          </Dropzone.Idle>
          <div>
            <Text size="xl" inline>
              {!isMobile ? 'Drag images here or click to select files' : 'Click to select photos'}
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              Attach as many files as you like. The files never leave your device.
            </Text>
          </div>
        </Group>
      </Dropzone>
    </Box>
  );
}
