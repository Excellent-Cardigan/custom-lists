import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import p5 from 'p5';
import { seedFromPrompt } from '../art/seed.js';
import { paletteFromSeed } from '../art/palette.js';
import { createPosterSketch } from '../art/poster.js';

// Mounts the seeded p5 poster. Everything is derived from the prompt, so the same
// prompt (and therefore the same shared link) always renders the same artwork.
const PosterCanvas = forwardRef(function PosterCanvas({ prompt, meta, size }, ref) {
  const holder = useRef(null);
  const instance = useRef(null);

  useEffect(() => {
    if (!holder.current) return undefined;
    const seed = seedFromPrompt(prompt);
    const palette = paletteFromSeed(seed);
    const sketch = createPosterSketch({ seed, palette, meta, size });
    instance.current = new p5(sketch, holder.current);
    return () => {
      instance.current?.remove();
      instance.current = null;
    };
    // Re-render only when the inputs that change the art change.
  }, [prompt, meta?.bookCount, size?.w, size?.h]);

  useImperativeHandle(ref, () => ({
    download(name = 'read-down-poster') {
      instance.current?.saveCanvas(name, 'png');
    },
  }));

  return <div className="poster-canvas" ref={holder} aria-hidden="true" />;
});

export default PosterCanvas;
