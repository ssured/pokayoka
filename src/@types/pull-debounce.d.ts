declare module 'pull-debounce' {
  import { Through } from 'pull-stream';

  export default function debounce<T>(delayMs: number): Through<T, T>;
}
