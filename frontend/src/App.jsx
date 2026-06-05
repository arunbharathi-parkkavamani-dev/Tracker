import BaseLayout from './layouts/baseLayouts'
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <BaseLayout />
    </>
  );
}

export default App
