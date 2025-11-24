import { useCallback, useEffect, useRef, useState } from 'react';
import { IconDownload } from '@tabler/icons-react';
import {
  BufferTarget,
  CanvasSource,
  getFirstEncodableVideoCodec,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
} from 'mediabunny';
import { PercentCrop } from 'react-image-crop';
import { Button, Center, Loader, Modal, Progress } from '@mantine/core';
import { useImagePlacer } from '../StillRenderer/StillRenderer';

export function getImageNumber(images: number, frame: number) {
  const cycle_length = (images - 1) * 2;
  const cycle_frame = frame % cycle_length;
  return cycle_frame < images ? cycle_frame : cycle_length - cycle_frame;
}

export function Renderer({
  duration = 5,
  frameRate = 60,
  coords,
  images,
  onComplete,
  crop,
}: {
  duration?: number;
  frameRate?: number;
  coords: { x: number; y: number; w: number; h: number }[];
  images: HTMLImageElement[];
  onComplete?: (videoBlob: Blob) => void;
  crop?: PercentCrop;
}) {
  const output = useRef<Output | null>(null);
  const renderCanvas = useRef<OffscreenCanvas>(new OffscreenCanvas(1280, 720));
  const renderCtx = useRef<OffscreenCanvasRenderingContext2D>(
    renderCanvas.current.getContext('2d') as OffscreenCanvasRenderingContext2D
  );

  const renderProgress = useRef<number>(0);

  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  const [progress, setProgress] = useState<number>(0);

  const [isRendering, setIsRendering] = useState<boolean>(false);

  const [description, setDescription] = useState<string>('');

  const { width, height, position } = useImagePlacer(coords, 0.5, 0.1, crop);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let renderTick: NodeJS.Timeout | undefined = undefined;
    if (isRendering) {
      renderTick = setInterval(() => {
        setProgress(renderProgress.current);
      }, 10);
    }

    return () => {
      clearInterval(renderTick);
    };
  }, [isRendering]);

  const generateVideo = async () => {
    const canvas = renderCanvas.current;
    const context = renderCtx.current;

    canvas.width = width;
    canvas.height = height;
    try {
      setIsRendering(true);

      // Function to update the scene based on the current time
      const updateScene = (frame: number) => {
        const width = canvas.width;
        const height = canvas.height;

        // Clear the canvas
        context.fillStyle = 'black';
        context.fillRect(0, 0, width, height);

        const imageIndex = getImageNumber(images.length, frame);

        // Draw the right image
        const image = images[imageIndex];
        context.drawImage(image, ...position(imageIndex, crop));
      };

      const totalFrames = duration * frameRate;

      // Create a new output file
      output.current = new Output({
        target: new BufferTarget(), // Stored in memory
        format: new Mp4OutputFormat(),
      });

      // Retrieve the first video codec supported by this browser that can be contained in the output format
      const videoCodec = await getFirstEncodableVideoCodec(
        output.current.format.getSupportedVideoCodecs(),
        {
          width: canvas.width,
          height: canvas.height,
        }
      );
      if (!videoCodec) {
        throw new Error("Your browser doesn't support video encoding.");
      }

      // For video, we use a CanvasSource for convenience, as we're rendering to a canvas
      const canvasSource = new CanvasSource(canvas, {
        codec: videoCodec,
        bitrate: QUALITY_HIGH,
      });
      output.current.addVideoTrack(canvasSource, { frameRate });

      await output.current.start();

      let currentFrame = 0;

      // Start an interval that updates the progress bar

      // Now, let's crank through all frames in a tight loop and render them as fast as possible
      for (currentFrame; currentFrame < totalFrames; currentFrame++) {
        const currentTime = currentFrame / frameRate;

        // Update the scene
        updateScene(currentFrame);

        renderProgress.current = currentFrame / totalFrames;

        // Add the current state of the canvas as a frame to the video. Using `await` here is crucial to
        // automatically slow down the rendering loop when the encoder can't keep up.
        await canvasSource.add(currentTime, 1 / frameRate);
      }

      // Signal to the output that no more video frames are coming (not necessary, but recommended)
      canvasSource.close();

      // Finalize the file
      await output.current.finalize();

      // The file is now ready!

      // Display and play the resulting media file
      const videoBlob = new Blob([(output.current.target as BufferTarget).buffer!], {
        type: output.current.format.mimeType,
      });

      //resultVideo.src = URL.createObjectURL(videoBlob);
      setVideoSrc(URL.createObjectURL(videoBlob));
      onComplete && onComplete(videoBlob);
      //void resultVideo.play();

      const fileSizeMiB = (videoBlob.size / (1024 * 1024)).toPrecision(3);
      setDescription(`File size: ${fileSizeMiB} MiB.`);
      renderProgress.current = 1;
    } catch (error) {
      console.error(error);

      await output.current?.cancel();

      setProgress(0);
    } finally {
      setIsRendering(false);
      setProgress(0);
    }
  };

  const shareData = useCallback(async () => {
    if (!videoSrc) {
      return;
    }
    const blob = await (await fetch(videoSrc)).blob();

    return {
      files: [new File([blob], `wigglegram.mp4`, { type: 'video/mp4' })],
    };
  }, [videoSrc]);

  return (
    <>
      <Button
        mt="md"
        onClick={() => void generateVideo()}
        disabled={isRendering}
        rightSection={<Loader size="sm" style={{ display: isRendering ? 'block' : 'none' }} />}
      >
        Generate Video
      </Button>
      <Progress mt="md" value={progress * 100} transitionDuration={0} />
      <Modal opened={!!videoSrc} onClose={() => setVideoSrc(null)} title="Wigglegram!" size="lg">
        <Center>
          <video
            id="result-video"
            ref={videoRef}
            style={{ width: '100%', maxWidth: '640px', marginTop: '20px' }}
            controls
            muted
            loop
            src={videoSrc || undefined}
          />
        </Center>
        {description && <p>{description}</p>}
        {'canShare' in navigator && images.length > 0 && (
          <Button
            leftSection={<IconDownload size={16} />}
            fullWidth
            onClick={async () => navigator.share(await shareData())}
          >
            Share / Save to Camera Roll
          </Button>
        )}
      </Modal>
    </>
  );
}
