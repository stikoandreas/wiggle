import { useEffect, useRef, useState } from 'react';
import PrismaZoom from 'react-prismazoom';
import { Box, SimpleGrid, Slider } from '@mantine/core';
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
  return count / height > 0.1;
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

  for (let i = 0; i < slice.length; i += 1) {
    if (!slice[i]) {
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

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const width = image.w;
    const height = image.h;

    canvas.width = image.w;
    canvas.height = image.h;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Draw each image at its specified coordinates
    ctx.drawImage(image.image, 0, 0);
    const line = bitMap(canvas, ctx, threshold);

    const first_border = linearScan(line, width / 4 - width / 8, width / 4 + width / 8);
    const second_border = linearScan(
      line,
      (width / 4) * 2 - width / 8,
      (width / 4) * 2 + width / 8
    );
    const third_border = linearScan(line, (width / 4) * 3 - width / 8, (width / 4) * 3 + width / 8);

    first_border && verticalLine(canvas, ctx, first_border, 'yellow');
    second_border && verticalLine(canvas, ctx, second_border, 'yellow');
    third_border && verticalLine(canvas, ctx, third_border, 'yellow');

    if (first_border && second_border && third_border) {
      setBreakPoints([
        [0, first_border],
        [first_border, second_border],
        [second_border, third_border],
        [third_border, canvas.width],
      ]);
    }

    //binarize(canvas, ctx, threshold);
  }, [image, threshold]);

  return (
    <>
      <Box style={{ overflow: 'hidden' }}>
        <PrismaZoom>
          <canvas ref={canvasRef} style={{ width: '100%', maxHeight: '80dvh' }} />
        </PrismaZoom>
      </Box>
      <Slider min={1} max={255} value={threshold} onChange={setThreshold} />
      <SimpleGrid cols={4} bg="white">
        {breakPoints.map((breakPoint) => (
          <Preview image={image} breakPoint={breakPoint} />
        ))}
      </SimpleGrid>
    </>
  );
}

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
