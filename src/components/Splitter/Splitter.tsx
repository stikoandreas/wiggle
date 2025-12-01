import { useEffect, useRef, useState } from 'react';
import { Slider } from '@mantine/core';
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
  for (let y = 0; y < height; y += 1) {
    if (getThresholdForCoord(data, x, y, width, threshold)) return true;
  }
  return false;
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

function getLine(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, threshold: number) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const newImageData = ctx.createImageData(canvas.width, 1);
  for (let x = 0; x < canvas.width; x += 1) {
    const value = getThresholdForLine(data, x, canvas.width, canvas.height, threshold) ? 255 : 0;
    newImageData.data[x * 4] = value;
    newImageData.data[x * 4 + 1] = value;
    newImageData.data[x * 4 + 2] = value;
    newImageData.data[x * 4 + 3] = 255;
  }
  ctx.putImageData(newImageData, 0, 0);
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

function linearScan(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  from: number,
  to: number
) {
  const diff = to - from;

  const imageData = ctx.getImageData(from, 0, diff, 1);
  const data = imageData.data;

  let min_x = to;
  let max_x = from;

  let found_something = false;

  for (let i = 0; i < diff; i += 1) {
    if (data[i * 4] === 0) {
      found_something = true;
      min_x = Math.min(min_x, from + i);
      max_x = Math.max(max_x, from + i);
    }
  }

  return found_something ? (min_x + max_x) / 2 : undefined;
}

export function Splitter({ image }: { image: WiggleImage }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [threshold, setThreshold] = useState<number>(20);

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
    getLine(canvas, ctx, threshold);

    const first_border = linearScan(canvas, ctx, width / 4 - width / 8, width / 4 + width / 8);
    const second_border = linearScan(
      canvas,
      ctx,
      (width / 4) * 2 - width / 8,
      (width / 4) * 2 + width / 8
    );
    const third_border = linearScan(
      canvas,
      ctx,
      (width / 4) * 3 - width / 8,
      (width / 4) * 3 + width / 8
    );

    first_border && verticalLine(canvas, ctx, first_border, 'green');
    second_border && verticalLine(canvas, ctx, second_border, 'green');
    third_border && verticalLine(canvas, ctx, third_border, 'green');

    //binarize(canvas, ctx, threshold);
  }, [image, threshold]);

  return (
    <>
      <canvas ref={canvasRef} style={{ width: '100%', maxHeight: '80dvh' }} />
      <Slider min={1} max={255} value={threshold} onChange={setThreshold} />
    </>
  );
}
