const LoadingVisual = ({ src }: { src: string }) => (
  <picture className="loading-visual">
    <source media="(prefers-reduced-motion: reduce)" srcSet="/images/pdf.png" />
    <img src={src} alt="" className="loading-image" />
  </picture>
);

export default LoadingVisual;
