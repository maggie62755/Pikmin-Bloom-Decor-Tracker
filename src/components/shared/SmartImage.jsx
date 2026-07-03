import React from 'react';
import { isImageCached, markImageCached } from '../../utils/imagePrefetch';

const SmartImage = React.memo(
  ({ src, alt, className, onError, rootMargin = '240px', decoding = 'async' }) => {
    const imgRef = React.useRef(null);
    const [shouldLoad, setShouldLoad] = React.useState(() => isImageCached(src));

    React.useEffect(() => {
      setShouldLoad(isImageCached(src));
    }, [src]);

    React.useEffect(() => {
      const node = imgRef.current;
      if (!node) return undefined;

      if (typeof IntersectionObserver === 'undefined') {
        setShouldLoad(true);
        return undefined;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setShouldLoad(true);
            observer.disconnect();
          }
        },
        { rootMargin },
      );

      observer.observe(node);
      return () => observer.disconnect();
    }, [rootMargin]);

    return (
      <img
        ref={imgRef}
        src={shouldLoad ? src : undefined}
        alt={alt}
        className={className}
        decoding={decoding}
        fetchPriority={shouldLoad ? 'high' : 'low'}
        onLoad={() => markImageCached(src)}
        onError={onError}
      />
    );
  },
);

export default SmartImage;
