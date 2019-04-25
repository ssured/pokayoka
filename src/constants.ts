/**
 * Milliseconds between websocket heartbeats
 */
export const WEBSOCKET_HEARTBEAT_INTERVAL_MS = 60 * 1000;
/**
 * Conservative latency of websockets for heartbeats
 */
export const WEBSOCKET_HEARTBEAT_LATENCY_MS = 1 * 1000;

export const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';

export const CAMERA_MAX_SIZE = 1024;
export const CAMERA_JPEG_QUALITY = 0.5;

export const UI_EMPTY_STRING = '-';

export const CSS_SPREAD_ABSOLUTE = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 0,
};
