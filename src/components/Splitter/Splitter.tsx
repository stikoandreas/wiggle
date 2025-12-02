import { memo, useEffect, useRef, useState } from 'react';
import PrismaZoom from 'react-prismazoom';
import { Box, NumberInput, SimpleGrid, Slider, Space, Text, Title } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { WiggleImage } from '../ImageInput/ImageInput';

function getThresholdForCoord(
  data: ImageDataArray,
  x: number,
  y: number,
  width: number,
  threshold: number
) {
  const red = y * (width * 4) + x * 4;
  return [data[red], data[red + 1], data[red + 2]].some((pixel) => pixel > threshold);
}

function getThresholdForLine(
  data: ImageDataArray,
  x: number,
  width: number,
  height: number,
  threshold: number
) {
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    if (getThresholdForCoord(data, x, y, width, threshold)) count += 1;
  }
  return count / height > 0.05;
}

function binarize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, threshold: number) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data.slice(i, i + 3).some((pixel) => pixel > threshold)) {
      data[i] = 255; // red
      data[i + 1] = 255; // green
      data[i + 2] = 0; // blue
    } else {
      data[i] = 0; // red
      data[i + 1] = 0; // green
      data[i + 2] = 0; // blue
      data[i + 3] = 0; // alpha
    }
  }
  ctx.globalAlpha = 0.5;
  ctx.putImageData(imageData, 0, 0);
}

function bitMap(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, threshold: number) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  return new Array(canvas.width)
    .fill(undefined)
    .map((_, index) => getThresholdForLine(data, index, canvas.width, canvas.height, threshold));
}

function verticalLine(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  spacing: number,
  color = 'red'
) {
  ctx.beginPath(); // Start a new path
  ctx.moveTo(spacing, 0); // Move the pen to (30, 50)
  ctx.lineTo(spacing, canvas.height); // Draw a line to (150, 100)
  ctx.strokeStyle = color;
  ctx.lineWidth = 20;
  ctx.stroke(); // Render the path
}

function linearScan(line: boolean[], from: number, to: number) {
  let min_x = to;
  let max_x = from;

  const slice = line.slice(from, to);

  let found_something = false;

  for (let i = 0; i < slice.length - 1; i += 1) {
    if (!slice[i - 1] && !slice[i] && !slice[i + 1]) {
      found_something = true;
      min_x = Math.min(min_x, from + i);
      max_x = Math.max(max_x, from + i);
    }
  }

  return found_something ? Math.round((min_x + max_x) / 2) : undefined;
}

export function Splitter({ image }: { image: WiggleImage }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [threshold, setThreshold] = useState<number>(25);

  const [breakPoints, setBreakPoints] = useState<[number, number][]>([]);

  const [debounced] = useDebouncedValue(threshold, 200);

  const [splits, setSplits] = useState<number>(4);

  return (
    <>
      <NumberInput
        label="Number of frames"
        value={splits}
        min={2}
        onChange={(value: number | string) => setSplits(Number(value))}
      />
      <Space h="md" />
      <Box style={{ overflow: 'hidden' }}>
        <PrismaZoom>
          <SplitPreview
            image={image}
            threshold={debounced}
            onChange={setBreakPoints}
            splits={Math.max(splits, 2)}
          />
        </PrismaZoom>
      </Box>
      <Text size="sm">Tolerance</Text>
      <Slider min={1} max={255 / 2} value={threshold} onChange={setThreshold} />
      <Text size="sm">Adjust until all frames are cleanly separated.</Text>
      <Space h="md" />
      <Title order={3}>Detected frames</Title>
      <SimpleGrid cols={4}>
        {breakPoints.map((breakPoint) => (
          <Preview image={image} breakPoint={breakPoint} />
        ))}
      </SimpleGrid>
    </>
  );
}

export const SplitPreview = memo(
  ({
    image,
    threshold,
    onChange,
    splits,
  }: {
    image: WiggleImage;
    threshold: number;
    onChange: (breakPoint: [number, number][]) => void;
    splits: number;
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (!canvasRef.current) {
        return;
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      const scale_factor = 0.5;

      const width = image.w * scale_factor;
      const height = image.h * scale_factor;

      canvas.width = width;
      canvas.height = height;

      // Clear the canvas
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);

      // Draw each image at its specified coordinates
      ctx.drawImage(image.image, 0, 0, canvas.width, canvas.height);
      const line = bitMap(canvas, ctx, threshold);

      const borders = new Array(splits - 1)
        .fill(undefined)
        .map((_, index) =>
          linearScan(
            line,
            (width / splits) * (index + 1) - width / (splits * 2),
            (width / splits) * (index + 1) + width / (splits * 2)
          )
        );

      borders.map((value) => value && verticalLine(canvas, ctx, value, 'yellow'));

      if (borders.every((value) => value !== undefined)) {
        onChange(
          new Array(splits)
            .fill(undefined)
            .map((_, index) => [
              index === 0 ? 0 : borders[index - 1] / scale_factor,
              index === splits - 1 ? width / scale_factor : borders[index] / scale_factor,
            ])
        );
      } else {
        onChange([]);
      }

      //binarize(canvas, ctx, threshold);
    }, [image, threshold, splits]);

    return <canvas ref={canvasRef} style={{ width: '100%', maxHeight: '80dvh' }} />;
  }
);

export function Preview({
  image,
  breakPoint,
}: {
  image: WiggleImage;
  breakPoint: [number, number];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const width = breakPoint[1] - breakPoint[0];
    const height = image.h;

    canvas.width = width;
    canvas.height = height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Draw each image at its specified coordinates
    ctx.drawImage(image.image, breakPoint[0], 0, width, height, 0, 0, width, height);
  }, [image, breakPoint]);

  return <canvas ref={canvasRef} style={{ width: '100%', maxHeight: '80dvh' }} />;
}
