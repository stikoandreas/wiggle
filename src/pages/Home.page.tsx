import { useCallback, useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import ReactCrop, { PercentCrop } from 'react-image-crop';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Box, Center, Container, Stack } from '@mantine/core';
import { useListState } from '@mantine/hooks';
import { CoordSelectorGrid } from '@/components/CoordSelector/CoordSelector';
import { ImageInput } from '@/components/ImageInput/ImageInput';
import { Renderer } from '@/components/Renderer/Renderer';
import { StillRenderer } from '@/components/StillRenderer/StillRenderer';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Welcome } from '../components/Welcome/Welcome';

export function HomePage() {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const defaultCrop = { unit: '%', x: 10, y: 10, width: 80, height: 80 } as PercentCrop;

  const [coords, { setItem, setState }] = useListState<{
    x: number;
    y: number;
    w: number;
    h: number;
  }>([]);

  function handleSetImages(newImages: HTMLImageElement[]) {
    setImages(newImages);
    setState(newImages.map((image) => ({ x: 0, y: 0, w: image.width, h: image.height })));
    setCrop(defaultCrop);
  }

  const [crop, setCrop] = useState<PercentCrop>(defaultCrop);

  function validateCrop(crop: PercentCrop) {
    if (crop.width > 0 && crop.height > 1) {
      return crop;
    }
    return undefined;
  }

  const setItemMemoized = useCallback(setItem, []);

  return (
    <>
      <Welcome />
      {images.length === 0 ? (
        <Container mt="lg">
          <ImageInput onChange={handleSetImages} />
        </Container>
      ) : (
        <Box mt="lg">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={50}>
              <CoordSelectorGrid images={images} coords={coords} onChange={setItemMemoized} />
            </Panel>
            <PanelResizeHandle>
              <Center h="100%" c="dimmed">
                <IconDotsVertical size={16} />
              </Center>
            </PanelResizeHandle>
            <Panel defaultSize={50}>
              <Stack gap="md" justify="space-between">
                <Center mah="80vh">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    minHeight={10}
                    minWidth={10}
                  >
                    <StillRenderer images={images} imageCoords={coords} />
                  </ReactCrop>
                </Center>
                <Renderer
                  images={images}
                  frameRate={10}
                  coords={coords}
                  crop={validateCrop(crop)}
                />
              </Stack>
            </Panel>
          </PanelGroup>
        </Box>
      )}
      <ColorSchemeToggle />
    </>
  );
}
