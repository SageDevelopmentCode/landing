"use client";

import Link from "next/link";
import { FUN_FRIDAY_DROPIN_CENTS } from "@/shared/billing/school-year";
import RoadBend from "./RoadBend";
import StationGlyph from "./StationGlyph";
import { STATIONS, type CarChoice } from "./data";
import { kanit } from "./fonts";
import "../../race.css";

const PRICE = FUN_FRIDAY_DROPIN_CENTS / 100;
const DEFAULT_CAR: CarChoice = { liveryIndex: 0, number: 7 };
const FLAG = "#FFC800";
const HOME_CREAM = "#FFF9F5";

/** Homepage teaser for the current Friday event, in the /friday race style. */
export default function FridayRacePreview() {
  return (
    <div className={`${kanit.variable} race-page`}>
      <section className="rc-promo" aria-labelledby="rc-promo-title">
        <div className="rc-finish-band rc-promo-band" aria-hidden />
        <div className="rc-promo-inner">
          <div>
            <p className="rc-eyebrow rc-promo-eyebrow">This Friday · Nov 13 · Limited Spots</p>
            <h2 id="rc-promo-title" className="rc-promo-title">
              Race Cars and Speedsters
              <span className="rc-title-tag">Field Day</span>
            </h2>
            <p className="rc-promo-lede">
              Paint little race cars, checkered flags, and car-themed puzzles at Sage Field.
            </p>
            <dl className="rc-specs">
              {[
                { term: "Race day", value: "Nov 13, 2026" },
                { term: "Time", value: "8:30 AM – 1:30 PM" },
                { term: "Entry", value: `$${PRICE} / child` },
                { term: "Ages", value: "4–11" },
              ].map((spec) => (
                <div key={spec.term} className="rc-spec">
                  <dt>{spec.term}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
            <div className="rc-promo-cta">
              <Link href="/friday" className="rc-btn rc-btn-red">
                Join the Race →
              </Link>
              <p className="rc-promo-note">No enrollment required · One-time drop-in</p>
            </div>
          </div>

          <div className="rc-promo-tiles">
            {STATIONS.map((station) => (
              <Link
                key={station.id}
                href="/friday#what-we-do"
                className="rc-promo-tile"
                style={{ ["--station" as string]: station.color }}
              >
                <span className="rc-promo-icon" aria-hidden>
                  <svg viewBox="0 0 64 64">
                    <StationGlyph id={station.id} />
                  </svg>
                </span>
                <span className="rc-station-way">{station.waypoint}</span>
                <span className="rc-promo-tile-title">{station.title}</span>
              </Link>
            ))}
            <p className="rc-promo-caption">All activities included · Paint, puzzle, and wave your flag home!</p>
          </div>
        </div>
      </section>
      <RoadBend from={FLAG} to={HOME_CREAM} dir="ltr" car={DEFAULT_CAR} />
    </div>
  );
}
