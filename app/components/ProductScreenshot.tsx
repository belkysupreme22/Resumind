const ProductScreenshot = ({
  view,
  alt,
  priority = false,
}: {
  view: "dashboard" | "review";
  alt: string;
  priority?: boolean;
}) => (
  <div className="product-screenshot">
    {(["light", "dark"] as const).map((theme) => (
      <img
        key={theme}
        className={`product-shot-${theme}`}
        src={`/images/product/${view}-${theme}.jpg`}
        alt={alt}
        width={1440}
        height={1080}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
    ))}
  </div>
);

export default ProductScreenshot;
