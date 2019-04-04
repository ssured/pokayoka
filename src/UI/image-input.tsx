import React, {
  FunctionComponent,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { Box, Text, Image } from 'grommet';
import { useDropzone } from 'react-dropzone';
import { loadAsCanvas } from '../utils/image';
import { CAMERA_JPEG_QUALITY, CAMERA_MAX_SIZE } from '../constants';

export const ImageInput: FunctionComponent<{
  onChange: (image: File | Blob | null) => void;
  value: string | null;
}> = ({ onChange, value: hash }) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    const canvas = await loadAsCanvas(file, {
      maxWidth: CAMERA_MAX_SIZE,
      maxHeight: CAMERA_MAX_SIZE,
    });

    canvas.toBlob(onChange, 'image/jpeg', CAMERA_JPEG_QUALITY);
  }, []);

  // // make an object url for the passed in blob
  // const [url, setUrl] = useState<string | null>(null);
  // useEffect(() => {
  //   const url =
  //     typeof hash === 'string' ? hash : hash && URL.createObjectURL(hash);
  //   setUrl(url);

  //   return () => {
  //     url && URL.revokeObjectURL(url);
  //   };
  // }, [hash, setUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ['image/jpeg', 'image/png'],
    multiple: false,
    onDrop,
  });
  return (
    <Box {...getRootProps()} border={isDragActive}>
      {hash && (
        <Box height="small" width="small" border>
          <Image src={`/cdn/${hash}`} fit="cover" />
        </Box>
      )}
      <input {...getInputProps()} />
      {isDragActive ? (
        <Text>Laat los om te updaten</Text>
      ) : hash == null ? (
        <Text>
          Klik hier of sleep <code>.jpg</code>/<code>.png</code> op dit vlak
        </Text>
      ) : (
        undefined
      )}
    </Box>
  );
};
