import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import LoadingSpinner from '../Components/UI/LoadingSpinner';

// WebP support detection
const supportsWebP = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

// Image optimization utilities
const getOptimizedImageUrl = (src, options = {}) => {
  if (!src) return '';
  
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    fit = 'cover'
  } = options;

  // If it's a Cloudinary URL, optimize it
  if (src.includes('cloudinary.com')) {
    const baseUrl = src.split('/upload/')[0];
    const path = src.split('/upload/')[1];
    
    let transformations = [];
    
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (quality) transformations.push(`q_${quality}`);
    if (fit) transformations.push(`c_${fit}`);
    
    // Add WebP format if supported
    if (format === 'auto' && supportsWebP()) {
      transformations.push('f_webp');
    } else if (format !== 'auto') {
      transformations.push(`f_${format}`);
    }
    
    // Add auto-optimization
    transformations.push('f_auto', 'q_auto');
    
    return `${baseUrl}/upload/${transformations.join(',')}/${path}`;
  }
  
  // For other URLs, return as-is
  return src;
};

// Intersection Observer hook for lazy loading
const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasIntersected) {
          setIsIntersecting(true);
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [hasIntersected, options]);

  return [ref, isIntersecting];
};

// Optimized Image Component
const OptimizedImage = memo(({
  src,
  alt = '',
  width,
  height,
  quality = 80,
  format = 'auto',
  fit = 'cover',
  className = '',
  style = {},
  placeholder = null,
  loading = 'lazy',
  onLoad = null,
  onError = null,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver();

  // Generate optimized image URL
  const optimizedSrc = useCallback(() => {
    if (!src) return '';
    return getOptimizedImageUrl(src, { width, height, quality, format, fit });
  }, [src, width, height, quality, format, fit]);

  // Handle image load
  const handleLoad = useCallback((e) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(e);
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback((e) => {
    setHasError(true);
    setIsLoaded(false);
    onError?.(e);
  }, [onError]);

  // Don't load if not intersecting and lazy loading is enabled
  const shouldLoad = loading === 'lazy' ? isIntersecting : true;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width || 'auto',
        height: height || 'auto',
        ...style
      }}
      {...props}
    >
      {/* Placeholder/Loading State */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
          {placeholder || <LoadingSpinner size="md" />}
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Actual Image */}
      {shouldLoad && (
        <img
          src={optimizedSrc()}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
          style={{
            width: '100%',
            height: '100%',
            objectFit: fit
          }}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Responsive Image Component
export const ResponsiveImage = memo(({
  src,
  alt = '',
  sizes = '100vw',
  className = '',
  style = {},
  ...props
}) => {
  const [ref, isIntersecting] = useIntersectionObserver();

  return (
    <div ref={ref} className={className} style={style}>
      {isIntersecting && (
        <picture>
          {/* WebP source for modern browsers */}
          <source
            srcSet={getOptimizedImageUrl(src, { ...props, format: 'webp' })}
            type="image/webp"
          />
          {/* Fallback for older browsers */}
          <OptimizedImage
            src={src}
            alt={alt}
            {...props}
          />
        </picture>
      )}
    </div>
  );
});

ResponsiveImage.displayName = 'ResponsiveImage';

// Avatar Image Component
export const AvatarImage = memo(({
  src,
  alt = '',
  size = 40,
  className = '',
  ...props
}) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      quality={90}
      fit="cover"
      className={`rounded-full ${className}`}
      placeholder={
        <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center">
          <svg className="w-1/2 h-1/2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      }
      {...props}
    />
  );
});

AvatarImage.displayName = 'AvatarImage';

// Card Image Component
export const CardImage = memo(({
  src,
  alt = '',
  className = '',
  ...props
}) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={400}
      height={250}
      quality={85}
      fit="cover"
      className={`w-full h-48 object-cover ${className}`}
      {...props}
    />
  );
});

CardImage.displayName = 'CardImage';

export default OptimizedImage;