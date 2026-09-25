export default function Loading() {
  return (
    <div className="shop-pdp shop-pdp--loading" data-testid="pdp.loading" aria-busy="true">
      <div className="shop-skeleton shop-skeleton--line" />
      <div className="shop-pdp__layout">
        <div className="shop-pdp__primary">
          <div className="shop-skeleton shop-skeleton--title" />
          <div className="shop-skeleton shop-skeleton--card" />
          <div className="shop-skeleton shop-skeleton--line" />
        </div>
      </div>
    </div>
  );
}
