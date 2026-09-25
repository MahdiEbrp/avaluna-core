export default function Loading() {
  return (
    <div className="shop-cart shop-cart--loading" data-testid="cart.loading" aria-busy="true">
      <div className="shop-skeleton shop-skeleton--title" />
      <div className="shop-cart__skeleton-lines">
        <div className="shop-skeleton shop-skeleton--line" />
        <div className="shop-skeleton shop-skeleton--line" />
        <div className="shop-skeleton shop-skeleton--line" />
      </div>
      <div className="shop-skeleton shop-skeleton--card" />
    </div>
  );
}
