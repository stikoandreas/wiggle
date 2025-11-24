import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import 'react-image-crop/dist/ReactCrop.css';
import '@gfazioli/mantine-split-pane/styles.css';

import { MantineProvider } from '@mantine/core';
import { Router } from './Router';
import { theme } from './theme';

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Router />
    </MantineProvider>
  );
}
