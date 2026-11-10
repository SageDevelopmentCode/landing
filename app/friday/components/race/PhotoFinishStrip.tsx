import Image from "next/image";
import { PHOTOS } from "./data";

export default function PhotoFinishStrip() {
  return (
    <section className="rc-photo rc-on-dark" aria-label="Photos of students at Sage Field">
      <div className="rc-photo-window">
        <div className="rc-photo-track">
          {[...PHOTOS, ...PHOTOS].map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={`rc-photo-frame${i >= PHOTOS.length ? " rc-photo-copy" : ""}`}
              aria-hidden={i >= PHOTOS.length || undefined}
            >
              <Image
                src={src}
                alt={i >= PHOTOS.length ? "" : "Students at Sage Field"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 224px, 288px"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
