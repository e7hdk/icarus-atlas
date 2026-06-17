import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/** Monotonic scene time in seconds — avoids THREE.Clock in app code. */
export function useElapsedRef() {
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    elapsed.current += delta;
  });
  return elapsed;
}
