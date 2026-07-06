// Animation utilities for enhanced user experience

export const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

export const fadeInRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: "easeOut" }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
};

// CSS classes for animations
export const animationClasses = {
  fadeInUp: 'animate-fade-in-up',
  fadeInLeft: 'animate-fade-in-left',
  fadeInRight: 'animate-fade-in-right',
  scaleIn: 'animate-scale-in',
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  ping: 'animate-ping'
};

// Intersection Observer for scroll animations
export const useIntersectionObserver = (callback, options = {}) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);
  const ref = React.useRef();

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
          callback?.(entry);
        }
      },
      {
        threshold: 0.1,
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
  }, [callback, hasIntersected, options]);

  return [ref, isIntersecting, hasIntersected];
};

// Hover animations
export const hoverAnimations = {
  lift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-300',
  scale: 'hover:scale-105 transition-transform duration-300',
  glow: 'hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300',
  slide: 'hover:translate-x-2 transition-transform duration-300',
  rotate: 'hover:rotate-3 transition-transform duration-300'
};

// Loading animations
export const loadingAnimations = {
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  ping: 'animate-ping',
  wave: 'animate-wave'
};

// Stagger animations for lists
export const getStaggerDelay = (index, baseDelay = 0.1) => ({
  animationDelay: `${index * baseDelay}s`
});

// Parallax effect
export const useParallax = (speed = 0.5) => {
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => setOffset(window.pageYOffset * speed);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return offset;
};

export default {
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  staggerContainer,
  staggerItem,
  animationClasses,
  useIntersectionObserver,
  hoverAnimations,
  loadingAnimations,
  getStaggerDelay,
  useParallax
};