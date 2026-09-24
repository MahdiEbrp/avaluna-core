import { UI } from "../../../config/constants";

export default function Loading() {
  const cards = Array.from({ length: UI.PLP.SKELETON_COUNT }, (_, index) => index);
  return (
    <div className="shop-plp shop-plp--loading" data-testid="plp.loading" aria-busy="true">
      <div className="shop-plp__side" aria-hidden />
      <div className="shop-plp__main">
        <div className="shop-plp__head">
          <div className="shop-skeleton shop-skeleton--title" />
          <div className="shop-skeleton shop-skeleton--line" />
        </div>
        <div className="shop-grid">
          {cards.map((index) => (
            <div key={index} className="shop-skeleton shop-skeleton--card" />
          ))}
        </div>
      </div>
    </div>
  );
}
