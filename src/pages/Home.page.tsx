import { useState } from 'react';
import { Image, SimpleGrid } from '@mantine/core';
import { ImageInput, renderImage } from '@/components/ImageInput/ImageInput';
import { Renderer } from '@/components/Renderer/Renderer';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Welcome } from '../components/Welcome/Welcome';

export function HomePage() {
  const [images, setImages] = useState<HTMLImageElement[]>([]);

  return (
    <>
      <Welcome />
      <ImageInput onChange={setImages} />
      <SimpleGrid cols={3}>
        {images.map((image, index) => (
          <Image key={index} src={renderImage(image)} />
        ))}
      </SimpleGrid>
      <Renderer images={images} frameRate={2}></Renderer>
      <ColorSchemeToggle />
    </>
  );
}
