import { use, useEffect, useRef, useState } from 'react';
import {
  BufferTarget,
  CanvasSource,
  getFirstEncodableVideoCodec,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
} from 'mediabunny';
import { Button, Loader, Progress } from '@mantine/core';

export function Renderer({
  duration = 5,
  frameRate = 60,
}: {
  duration?: number;
  frameRate?: number;
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
    try {
      setIsRendering(true);

      // Function to update the scene based on the current time
      const updateScene = (time: number) => {
        const width = canvas.width;
        const height = canvas.height;

        // Clear the canvas
        context.fillStyle = 'black';
        context.fillRect(0, 0, width, height);

        // Draw a moving rectangle
        const rectWidth = 100;
        const rectHeight = 100;
        const x = ((time * 100) % (width + rectWidth)) - rectWidth;
        const y = height / 2 - rectHeight / 2;

        context.fillStyle = 'red';
        context.fillRect(x, y, rectWidth, rectHeight);
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

        console.log(`Rendering frame ${currentFrame + 1} / ${totalFrames}`);

        // Update the scene
        updateScene(currentTime);

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
      //void resultVideo.play();

      const fileSizeMiB = (videoBlob.size / (1024 * 1024)).toPrecision(3);
      setDescription(`File size: ${fileSizeMiB} MiB`);
    } catch (error) {
      console.error(error);

      await output.current?.cancel();

      setProgress(0);
    } finally {
      setIsRendering(false);
      setProgress(0);
    }
  };
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
      {videoSrc && (
        <video
          id="result-video"
          style={{ width: '100%', maxWidth: '640px', marginTop: '20px' }}
          controls
          muted
          src={videoSrc || undefined}
        ></video>
      )}
      {description && <p>{description}</p>}
    </>
  );
}
