declare module 'monotonic-lexicographic-timestamp' {
  export default function mlts(timestamp?: number): () => string;
}
