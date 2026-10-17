export default function Backdrop({ path, detail = false }) {
  if (!path) return null;
  return (
    <div
      className={`cl-backdrop-art ${detail ? 'detail' : ''}`}
      aria-hidden='true'
    >
      <img
        alt=''
        src={`https://image.tmdb.org/t/p/w1280${path}`}
        srcSet={`https://image.tmdb.org/t/p/w780${path} 780w, https://image.tmdb.org/t/p/w1280${path} 1280w`}
        sizes='100vw'
        loading='eager'
        decoding='async'
      />
    </div>
  );
}
