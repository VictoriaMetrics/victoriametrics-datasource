import { useEffect, useState } from 'react';

/**
 * When flash is switched on makes sure it is switched of right away, so we just flash the highlight and then fade
 * out.
 * @param flash
 */

function useFlash(flash?: boolean) {
  const [keepFlash, setKeepFlash] = useState(true);
  useEffect(() => {
    let t: any;
    if (flash) {
      t = setTimeout(() => {
        setKeepFlash(false);
      }, 1000);
    } else {
      setKeepFlash(true);
    }

    return () => clearTimeout(t);
  }, [flash]);

  return keepFlash && flash;
}

export default useFlash;
