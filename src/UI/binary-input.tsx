import React, { FunctionComponent, useCallback, useState } from 'react';
import { Box, Text, Image, Meter, Stack } from 'grommet';
import { useDropzone } from 'react-dropzone';
import { loadAsCanvas } from '../utils/image';
import { CAMERA_JPEG_QUALITY, CAMERA_MAX_SIZE } from '../constants';
import { generateId } from '../utils/id';
import { toHex } from '../utils/buffer';
import { DocumentPdf } from 'grommet-icons';
import { Tile } from '../model/Sheet/Tile';
import { Image as ImageIcon } from 'grommet-icons';
import { Checkmark } from 'grommet-icons';

export const ImageInput: FunctionComponent<{
  onChange: (result: { value: string | null }) => void;
  value: string | null;
}> = ({ onChange, value: hash }) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    const canvas = await loadAsCanvas(file, {
      maxWidth: CAMERA_MAX_SIZE,
      maxHeight: CAMERA_MAX_SIZE,
    });

    canvas.toBlob(
      async blob => {
        const response = new Response(blob);
        const arrayBuffer = await response.clone().arrayBuffer();
        const hash = toHex(
          await window.crypto.subtle.digest('SHA-256', arrayBuffer)
        );
        const cdnCache = await window.caches.open('cdn');
        await cdnCache.put(`/cdn/${hash}`, response);

        onChange({ value: hash });
      },
      'image/jpeg',
      CAMERA_JPEG_QUALITY
    );
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ['image/jpeg', 'image/png'],
    multiple: false,
    onDrop,
  });
  return (
    <Box {...getRootProps()} border={isDragActive}>
      {hash ? (
        <Box height="xsmall" width="xsmall" border>
          <Image src={`/cdn/${hash}`} fit="cover" />
        </Box>
      ) : (
        <ImageIcon size="xlarge" />
      )}
      <input {...getInputProps()} />
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

export const PDFInput: FunctionComponent<{
  onChange: (data: PSheet | null) => void;
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

    const identifier = generateId();

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
            uuid: identifier,
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

          const sheet: PSheet = {
            '@type': 'PSheet',
            identifier,
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
              sheet.images[`$${zyx}`] = hash;
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
    <Box
      {...getRootProps()}
      align="center"
      margin={{ top: 'large' }}
      border={isDragActive}
    >
      <input {...getInputProps()} />
      <Stack anchor="center" guidingChild={1}>
        {thumbSrc ? (
          <Box height="small" width="medium">
            <Image src={thumbSrc} fit="contain" />
          </Box>
        ) : (
          <Box
            height="small"
            width="medium"
            align="center"
            justify="center"
            border
          >
            <DocumentPdf size="xlarge" />
            <Text>Klik om een PDF te uploaden</Text>
            <Text>(hierop slepen kan ook)</Text>
          </Box>
        )}
        {progress >= 0 &&
          (progress < 100 ? (
            <>
              <Meter
                type="circle"
                size="xsmall"
                thickness="small"
                values={[{ label: `${progress}%`, value: progress }]}
              />
              <Box direction="row" align="center" justify="center">
                <Text size="xlarge" weight="bold">
                  {progress}
                </Text>
                <Text size="small">%</Text>
              </Box>
            </>
          ) : (
            <Checkmark size="xlarge" color="status-ok" />
          ))}
      </Stack>
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
