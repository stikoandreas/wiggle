import { useCallback, useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import ReactCrop, { PercentCrop } from 'react-image-crop';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Box, Center, Container, Slider, Stack, Text } from '@mantine/core';
import { useListState } from '@mantine/hooks';
import { CoordSelectorGrid } from '@/components/CoordSelector/CoordSelector';
import { ImageInput, WiggleImage } from '@/components/ImageInput/ImageInput';
import { Renderer } from '@/components/Renderer/Renderer';
import { Splitter } from '@/components/Splitter/Splitter';
import { StillRenderer } from '@/components/StillRenderer/StillRenderer';
import { Welcome } from '../components/Welcome/Welcome';

export function HomePage() {
  const [images, { setItem, setState }] = useListState<WiggleImage>([]);
  const defaultCrop = { unit: '%', x: 10, y: 10, width: 80, height: 80 } as PercentCrop;

  const [scale, setScale] = useState<number>(0.5);

  function handleSetImages(newImages: WiggleImage[]) {
    setState(newImages);
    setCrop(defaultCrop);
  }

  const [crop, setCrop] = useState<PercentCrop>(defaultCrop);

  function validateCrop(crop: PercentCrop) {
    if (crop.width > 0 && crop.height > 1) {
      return crop;
    }
    return undefined;
  }

  const selectedImages = images.filter((image) => image.x && image.y);

  const setItemMemoized = useCallback(setItem, []);

  return (
    <>
      <Welcome />
      {images.length === 0 ? (
        <Container mt="lg">
          <ImageInput onChange={handleSetImages} />
        </Container>
      ) : images.length === 1 ? (
        <Container mt="lg">
          <Splitter image={images[0]} />
        </Container>
      ) : (
        <>
          <Box mt="lg" visibleFrom="md">
            <PanelGroup direction="horizontal">
              <Panel defaultSize={50}>
                <CoordSelectorGrid images={images} onChange={setItemMemoized} />
              </Panel>
              <PanelResizeHandle>
                <Center h="100%" c="dimmed">
                  <IconDotsVertical size={16} />
                </Center>
              </PanelResizeHandle>
              <Panel defaultSize={50}>
                <Stack gap="md" justify="space-between">
                  <Center mah="80vh" style={{ position: 'relative' }}>
                    {selectedImages.length === images.length && (
                      <Box
                        style={{
                          position: 'absolute',
                          zIndex: 1,
                          top: 0,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          width: '100%',
                          textAlign: 'center',
                        }}
                        p={4}
                      >
                        <Text size="sm">Crop your image to size.</Text>
                      </Box>
                    )}
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      minHeight={10}
                      minWidth={10}
                    >
                      <StillRenderer images={images} scale={0.5} />
                    </ReactCrop>
                  </Center>
                  <Box mx="xl">
                    <Text size="sm">Scale</Text>
                    <Slider
                      min={0.25}
                      max={1}
                      step={0.25}
                      value={scale}
                      onChange={setScale}
                      marks={[
                        { value: 0.25, label: 'x0.25' },
                        { value: 0.5, label: 'x0.5' },
                        { value: 0.75, label: 'x0.75' },
                        { value: 1, label: 'x1' },
                      ]}
                    />
                  </Box>
                  <Renderer
                    images={images}
                    frameRate={10}
                    crop={validateCrop(crop)}
                    scale={scale}
                  />
                </Stack>
              </Panel>
            </PanelGroup>
          </Box>
          <Box m="lg" hiddenFrom="md">
            <CoordSelectorGrid images={images} onChange={setItemMemoized} />
            <Stack gap="md" justify="space-between" mt="lg">
              <Center mah="80vh" style={{ position: 'relative' }}>
                {selectedImages.length === images.length && (
                  <Box
                    style={{
                      position: 'absolute',
                      zIndex: 1,
                      top: 0,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      width: '100%',
                      textAlign: 'center',
                    }}
                    p={4}
                  >
                    <Text size="sm">Crop your image to size.</Text>
                  </Box>
                )}
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  minHeight={50}
                  minWidth={50}
                >
                  <StillRenderer images={images} scale={0.5} />
                </ReactCrop>
              </Center>
              <Box mx="xl">
                <Text size="sm">Scale</Text>
                <Slider
                  min={0.25}
                  max={1}
                  step={0.25}
                  value={scale}
                  onChange={setScale}
                  marks={[
                    { value: 0.25, label: 'x0.25' },
                    { value: 0.5, label: 'x0.5' },
                    { value: 0.75, label: 'x0.75' },
                    { value: 1, label: 'x1' },
                  ]}
                />
              </Box>
              <Renderer images={images} frameRate={10} crop={validateCrop(crop)} scale={scale} />
            </Stack>
          </Box>
        </>
      )}
    </>
  );
}
