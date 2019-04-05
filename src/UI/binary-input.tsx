import React, { FunctionComponent, useCallback, useState } from 'react';
import { Box, Text, Image, Meter } from 'grommet';
import { useDropzone } from 'react-dropzone';
import { loadAsCanvas } from '../utils/image';
import { CAMERA_JPEG_QUALITY, CAMERA_MAX_SIZE } from '../constants';
import { generateId } from '../utils/id';
import { toHex } from '../utils/buffer';
import { DocumentPdf } from 'grommet-icons';
import { Tile } from '../model/Sheet/Tile';

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

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onerror = rej;
    reader.onload = function(evt) {
      res((evt as any).target.result as string);
    };
    reader.readAsDataURL(blob);
  });
}

export type PDFData = {
  name: string;
  width: number;
  height: number;
  $thumb: string;
  images: {
    [key: string]: Tile;
  };
  $source: string;
};

export const PDFInput: FunctionComponent<{
  onChange: (data: PDFData | null) => void;
  value: string | null;
}> = ({ onChange, value: hash }) => {
  const [progress, setProgress] = useState(-1);
  const [thumbSrc, setThumbSrc] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setProgress(0);
    setThumbSrc(null);

    const file = acceptedFiles[0];

    const response = new Response(file);
    const arrayBuffer = await response.clone().arrayBuffer();
    const $source = toHex(
      await window.crypto.subtle.digest('SHA-256', arrayBuffer)
    );
    const cdnCache = await window.caches.open('cdn');
    await cdnCache.put(`/cdn/${$source}`, response);

    const ws = new WebSocket('wss://app.snagtracker.com/wstiler');
    try {
      const dataURL = await blobToDataURL(file);
      ws.addEventListener('open', () => {
        console.log('opened socket');
        ws.send(
          JSON.stringify({
            dataURL,
            name: file.name,
            contentType: 'application/pdf',
            size: Math.floor((dataURL.length / 4) * 3),
            uuid: generateId(),
          })
        );
      });

      ws.addEventListener('message', async raw => {
        const [, info] = JSON.parse(raw.data);

        setProgress(Math.round(100 * (info.progress || 0)));
        if (info.thumb) {
          setThumbSrc(
            `data:${info.thumb.content_type};base64,${info.thumb.data}`
          );
        }

        if (info.progress === 1) {
          ws.close();

          const sheet: PDFData = {
            name: info.pdfInfo.name.replace(/\.pdf$/i, ''),
            width: info.pdfInfo._width as number,
            height: info.pdfInfo._height as number,
            $thumb: '',
            images: {},
            $source,
          };

          for (const [name, { content_type, data }] of Object.entries(
            info._attachments as {
              [key: string]: { content_type: string; data: string };
            }
          )) {
            const response = await fetch(`data:${content_type};base64,${data}`);
            const arrayBuffer = await response.clone().arrayBuffer();

            const hash = toHex(
              await window.crypto.subtle.digest('SHA-256', arrayBuffer)
            );

            const cdnCache = await window.caches.open('cdn');
            await cdnCache.put(`/cdn/${hash}`, response);

            if (name === 'thumb.png') {
              sheet.$thumb = hash;
            } else {
              const [zyx] = name.split('.');
              const [z, y, x] = zyx.split('/').map(n => parseInt(n, 10));
              sheet.images[zyx] = { x, y, z, $hash: hash };
            }
          }

          onChange(sheet);
        }
      });
    } catch (e) {
      console.error('tiling error', e);
      ws.close();
    }
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
    accept: ['application/pdf'],
    multiple: false,
    onDrop,
  });
  return (
    <Box {...getRootProps()} border={isDragActive}>
      {thumbSrc ? (
        <Box height="small" width="small" border>
          <Image src={thumbSrc} fit="cover" />
        </Box>
      ) : (
        <Box
          height="small"
          width="small"
          align="center"
          justify="center"
          border
        >
          <DocumentPdf size="xlarge" />
        </Box>
      )}
      <input {...getInputProps()} />
      {progress >= 0 && (
        <Meter
          alignSelf="stretch"
          type="bar"
          values={[{ label: `${progress}%`, value: progress }]}
        />
      )}
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
