import { ADDRESS, MAPS_URL } from "./data";

export default function RaceDayBoard({ price }: { price: number }) {
  return (
    <div className="rc-board rc-on-dark">
      <p className="rc-board-title rc-eyebrow">Race day · Nov 13</p>
      <dl className="rc-board-rows">
        {[
          { term: "Drop-off", value: "8:30 AM" },
          { term: "Pick-up", value: "1:30 PM" },
          { term: "Entry", value: `$${price} per child` },
          { term: "Ages", value: "4–11" },
        ].map((row) => (
          <div key={row.term} className="rc-board-row">
            <dt>{row.term}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
        <div className="rc-board-row">
          <dt>Where</dt>
          <dd>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">
              {ADDRESS}
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}
