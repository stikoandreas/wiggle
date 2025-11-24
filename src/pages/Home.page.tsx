import { useCallback, useMemo, useState } from 'react';
import ReactCrop, { PercentCrop } from 'react-image-crop';
import { Center, Image } from '@mantine/core';
import { useListState } from '@mantine/hooks';
import { CoordSelectorGrid } from '@/components/CoordSelector/CoordSelector';
import { ImageInput, renderImage } from '@/components/ImageInput/ImageInput';
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
      <ImageInput onChange={handleSetImages} />
      <CoordSelectorGrid images={images} coords={coords} onChange={setItemMemoized} />
      {images.length > 0 && (
        <>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            style={{ width: '50%' }}
            minHeight={10}
            minWidth={10}
          >
            <StillRenderer images={images} imageCoords={coords} />
          </ReactCrop>
          <Renderer images={images} frameRate={10} coords={coords} crop={validateCrop(crop)} />
        </>
      )}
      <ColorSchemeToggle />
    </>
  );
}
