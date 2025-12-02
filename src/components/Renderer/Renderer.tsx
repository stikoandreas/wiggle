import { useCallback, useEffect, useRef, useState } from 'react';
import { IconDownload } from '@tabler/icons-react';
import {
  BufferTarget,
  CanvasSource,
  getEncodableVideoCodecs,
  getFirstEncodableVideoCodec,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  VideoCodec,
} from 'mediabunny';
import { PercentCrop } from 'react-image-crop';
import {
  Button,
  Center,
  Loader,
  Modal,
  Progress,
  SegmentedControl,
  Stack,
  Text,
} from '@mantine/core';
import { WiggleImage } from '../ImageInput/ImageInput';
import { useImagePlacer } from '../StillRenderer/StillRenderer';

export function getImageNumber(images: number, frame: number) {
  const cycle_length = (images - 1) * 2;
  const cycle_frame = frame % cycle_length;
  return cycle_frame < images ? cycle_frame : cycle_length - cycle_frame;
}

export function Renderer({
  duration = 5,
  frameRate = 60,
  images,
  onComplete,
  crop,
  scale,
}: {
  duration?: number;
  frameRate?: number;
  images: WiggleImage[];
  onComplete?: (videoBlob: Blob) => void;
  crop?: PercentCrop;
  scale: number;
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

  const { width, height, position } = useImagePlacer(images, scale, 0.1, crop);

  const videoRef = useRef<HTMLVideoElement>(null);

  const [codec, setCodec] = useState<VideoCodec | undefined>(undefined);
  const [codecs, setCodecs] = useState<VideoCodec[]>([]);

  useEffect(() => {
    async function getCodecs() {
      output.current = new Output({
        target: new BufferTarget(), // Stored in memory
        format: new Mp4OutputFormat(),
      });
      const videoCodecs = await getEncodableVideoCodecs(
        output.current.format.getSupportedVideoCodecs(),
        {
          width,
          height,
        }
      );
      const firstCodec = await getFirstEncodableVideoCodec(
        output.current.format.getSupportedVideoCodecs(),
        {
          width,
          height,
        }
      );
      if (!videoCodecs || !firstCodec) {
        throw new Error("Your browser doesn't support video encoding.");
      }
      setCodec(firstCodec);
      setCodecs(videoCodecs);
    }
    getCodecs();
  }, []);

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
        context.drawImage(image.image, ...position(imageIndex, crop));
      };

      const cycle_length = (images.length - 1) * 2;
      const totalFramesBase = duration * frameRate;

      const totalFrames = totalFramesBase + cycle_length - (totalFramesBase % cycle_length);

      // Create a new output file
      output.current = new Output({
        target: new BufferTarget(), // Stored in memory
        format: new Mp4OutputFormat(),
      });

      if (!codec) {
        throw new Error("Your browser doesn't support video encoding.");
      }

      // For video, we use a CanvasSource for convenience, as we're rendering to a canvas
      const canvasSource = new CanvasSource(canvas, {
        codec,
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
      <Stack mx="xl" gap={0} mt="md">
        <Text size="sm">Codec</Text>
        <SegmentedControl
          value={codec}
          data={codecs}
          onChange={(value: string) => setCodec(value as VideoCodec)}
        />
      </Stack>
      <Button
        onClick={() => void generateVideo()}
        disabled={isRendering}
        rightSection={<Loader size="sm" style={{ display: isRendering ? 'block' : 'none' }} />}
      >
        Generate Video
      </Button>
      <Progress mt="sm" value={progress * 100} transitionDuration={0} />
      <Modal opened={!!videoSrc} onClose={() => setVideoSrc(null)} title="Wigglegram!" size="lg">
        <Center>
          <video
            id="result-video"
            ref={videoRef}
            style={{ width: '100%', maxWidth: '640px', marginTop: '20px', maxHeight: '50dvh' }}
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
            mb="sm"
          >
            Share / Save to Camera Roll
          </Button>
        )}
        <Button
          component="a"
          leftSection={<IconDownload size={16} />}
          fullWidth
          href={videoSrc || undefined}
          download
        >
          Download
        </Button>
      </Modal>
    </>
  );
}
