"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import FloatingSMSButton from "@/app/components/FloatingSMSButton";

const ImageLightbox = dynamic(() => import("@/app/components/ImageLightbox"), {
  ssr: false,
});

// ─── Image data ───────────────────────────────────────────────────────────────

type GalleryImage = { src: string; alt: string; week: number };

const WEEK_ONE: GalleryImage[] = [
  "0D75EB5E-FE8D-405E-AF5D-6457DDF7473A.JPG",
  "1A5F716C-6189-450B-8F8C-61E71621C2B9.JPG",
  "1D2BF4A6-5081-4D51-B1E8-F6E0E3D820B3.JPG",
  "2B9964FA-0047-4590-880C-095C315B7DE8.JPG",
  "2DE620A5-86E3-4A0D-8579-721D97615159.JPG",
  "341400BF-486B-43A0-912E-84623B6299D6.JPG",
  "37F2A2AD-33E5-4FC8-A423-6CE04787FC4C.JPG",
  "412BC6B4-B894-46FF-A09D-318C09C1251A.JPG",
  "48A7CEB7-3F5C-422A-9C1B-8BBFDE5CCF4D 2.JPG",
  "58982292-CDE7-4E77-B528-0F01DB604DF7 2.JPG",
  "66719803-D874-46B5-9B16-C4F79A865A85 2.JPG",
  "715F7B95-10E1-456B-864E-20E2E0C20569.JPG",
  "79C28EF4-D1A6-4874-AA73-CCA66F04BDEF.JPG",
  "8018F647-AC55-4EE0-9D25-0F326D805ED8 4.jpg",
  "9E82F217-AF40-48F7-8860-906092304251.JPG",
  "A932DC39-8100-43C7-A2AE-45C2DC8AC9EA.JPG",
  "AB176A40-3DE2-4856-8E87-2D169FB3F41A.JPG",
  "B10368B0-5344-4D70-8C0C-C091A086D6B2 2.JPG",
  "B10368B0-5344-4D70-8C0C-C091A086D6B2.JPG",
  "B3645828-BB39-41B0-A309-E9D7DBBFFEAF.JPG",
  "C7665CCD-EB43-429C-AB7F-BA19FF9AE4A6.JPG",
  "C8EAD2FA-0FB2-4D59-A079-493C09298ABF.JPG",
  "DDDA3AA2-CDF9-42CF-B8FF-AD61CED60065 2.JPG",
  "E96A3688-D421-43A9-B8CA-93D6B881E555.JPG",
  "FullSizeRender 4.jpg",
  "FullSizeRender 5.jpg",
  "IMG_8915.jpg",
].map((f) => ({ src: `/assets/highlights/summer_week_one/${f}`, alt: `Week 1 — ${f}`, week: 1 }));

const WEEK_TWO: GalleryImage[] = [
  "08BB87B0-E53E-4981-9741-8F0AC0C32238.JPG",
  "0E23519F-0846-4BB8-9795-BC26B412E702 2.JPG",
  "17C0053A-E948-49DC-8D32-58D6D753C37D.JPG",
  "24E4F2AF-5C30-4C23-9B09-8EA71093A1FD.JPG",
  "2B58FEC3-CD58-40D9-93C5-A83D7DBB5A21.JPG",
  "2CDB3506-F666-4787-ACCB-97B3A945C6EE.JPG",
  "2D39D0C0-64E9-4355-A719-248000AD4077.JPG",
  "2F8E12CF-285F-4629-A621-7DA20ED68F65.JPG",
  "3B7A8137-E253-4E45-B71D-AD5325A5460A.JPG",
  "3E22E13E-859C-427A-9FA3-73F11B989B65.JPG",
  "4D005FA0-C22C-4DE9-B589-8130BBB7723A.JPG",
  "510F5647-307C-447A-95AE-8713B309CA94.JPG",
  "5490D879-F69D-40E0-B2E7-FAD64DE100D9.JPG",
  "570FEA28-D009-4038-B966-EAF9E0C9EE73.JPG",
  "572C0FD1-F9A7-4058-B77A-B2544F8ABF04.JPG",
  "5B961697-D097-476C-9D47-09F547042841.JPG",
  "6B95C9E4-E145-49CA-8818-7AFC9B3B8353.JPG",
  "703B0F21-5D8C-4862-9E8C-4B22981768EC 2.JPG",
  "71493760-06B5-4E8A-9340-8DD3B32571CD.JPG",
  "84E07202-6127-4142-9312-22A8665F8333 2.JPG",
  "8DC65D50-316D-44DA-88AA-128F72DF019B.JPG",
  "9511C4BC-5E44-4FCF-9DC6-EE386F2060DA.JPG",
  "9AF86705-559C-4F6C-ADC9-4F144413EC9C.JPG",
  "9CFCA632-25EE-4EAF-89B4-CCC1F01E215D.JPG",
  "A0AA3C22-7657-4E63-A3FD-7AB6CD3B85E0.JPG",
  "A36A20F2-7144-4BA4-AF29-70965A386A1A.JPG",
  "A6B134A3-5B8E-4A1F-AF66-5AC22A504C9E.JPG",
  "B8D13E63-C11A-4934-A926-6921DC948109.JPG",
  "BF26943C-5BF7-40CD-9686-D57805D57453.JPG",
  "C25BBF44-8B2C-436E-9432-F742D840A201.JPG",
  "CA435D3C-71BD-433F-A75E-E4CA02BC3897 2.JPG",
  "CB84AC72-2A28-4712-B2E9-C9DF08E4D7CD.JPG",
  "D3319D8D-EE61-43C4-93E5-54AEB0A5B58C.JPG",
  "D9F6F89E-CFCA-4738-B3D6-78A3DACF9636.JPG",
  "DC1D10EF-768E-48E1-AFA9-B935172FA14B.JPG",
  "E3AE964D-CC01-41A0-B040-35DCCB27CD4C.JPG",
  "E9BB9AFF-C176-409F-ADF7-226F63526D77.JPG",
  "EE67A184-15E0-425D-BBFB-26891F754F4C.JPG",
  "IMG_8889.JPG",
].map((f) => ({ src: `/assets/highlights/summer_week_two/${f}`, alt: `Week 2 — ${f}`, week: 2 }));

const WEEK_THREE: GalleryImage[] = [
  "059D446B-28E2-404A-AA9E-1C31ECA397C2.JPG",
  "270406F4-D0DB-49C7-B0FD-893838BC93D6 2.JPG",
  "2B11FA2F-F6BE-4184-B354-7B592E1FD313 2.JPG",
  "2E90C4B5-CECC-4774-B9F9-65F11DF9A6D7 2.JPG",
  "3F03181F-5761-416B-8C7D-003DA143D804.JPG",
  "4591E194-779B-46AC-A893-B9E75B6D64A7.JPG",
  "4C53798C-920D-4497-B46C-1037E6FF21E4.JPG",
  "5B9A16B7-70BE-464B-9D57-20639BE6E55D 2.JPG",
  "5DD49FD0-D35F-4411-8171-65D816CA4934.JPG",
  "77048964-333A-426F-9E8C-69F51FB987D7.JPG",
  "8CE3DD93-63A1-4FD4-A81C-B4949CA60664.JPG",
  "9AE171D2-072A-4BB0-9578-F4407CB2B26C 2.JPG",
  "AFD7C6F5-A4E0-4EB6-9A81-931C53C1C814.JPG",
  "B6F3BF45-573E-4C9E-90C7-DF0802E13E0E.JPG",
  "BC68CF40-220C-48CE-8C63-D14F22100AAA.JPG",
  "BCC6DAA3-53B7-4343-8734-E38512D99959 2.JPG",
  "CEADADE6-E43C-4A6D-8AB5-E8E2734423A9.JPG",
  "ED35AB4E-8E56-43C6-ADA7-A7D9CDE3C95C.jpeg",
  "FE28F7EF-5568-4F11-9C62-E44AC6209D53.JPG",
  "FF4C9AB2-63DC-4FBC-BDDA-99D15C197948 2.JPG",
  "IMG_9138.jpg",
  "IMG_9275.jpg",
  "IMG_9313.JPG",
].map((f) => ({ src: `/assets/highlights/summer_week_three/${f}`, alt: `Week 3 — ${f}`, week: 3 }));

const WEEK_FOUR: GalleryImage[] = [
  "1276FB1A-AEEB-43D0-8028-E2419B2679AF.JPG",
  "1B8DAE7D-4D49-4865-97C8-593B4F74D996.JPG",
  "1FEDBFAC-0CD4-4D95-8718-9F10D5531E71 2.JPG",
  "27B3519F-6BEB-4620-83AC-99F82ACEA5C2.JPG",
  "3F2A4707-D076-4AFE-9216-BD8EB3CAF5D9.JPG",
  "4E560267-530C-43BF-BC4A-C586C9DBE40D.JPG",
  "5D534B24-3173-420E-9800-FEB0454E3B43 2.JPG",
  "5E38B790-B4AF-405D-BC71-0C6A367E4E57.JPG",
  "6B6E75A3-57F1-4675-A79C-27A91E3CA8AE 2.JPG",
  "77A3BBA5-C885-4179-A944-6F9B005A6B0E.JPG",
  "896A997D-C5D1-4443-9FAA-807FE4D6E7C4.JPG",
  "8B8A8CAF-47F1-415E-B12D-0C1E2B5942FC.JPG",
  "A4107889-4FC8-4F4F-BE2E-5F49868F3AA4 2.JPG",
  "C3E15299-9AB4-420A-BB46-2C998A4B1C38 2.JPG",
  "C4EB78AE-3AE3-4DB4-BAF4-DA09B3A7E941 2.JPG",
  "DFDDC9CF-2547-4219-9893-C3EB68F84E88 2.JPG",
  "EAFF91EE-8496-4132-AA3B-3587816CB2B8.JPG",
  "EC369A3C-19C6-4263-BA9A-6586154D0990.JPG",
  "FD2FCA61-D903-4059-B681-20AF2027754F.JPG",
  "FF7095AC-1AFC-4011-9C27-8B2C0573121B 2.JPG",
  "IMG_9531.JPG",
  "IMG_9586.JPG",
].map((f) => ({ src: `/assets/highlights/summer_week_four/${f}`, alt: `Week 4 — ${f}`, week: 4 }));

const WEEK_FIVE: GalleryImage[] = [
  "077864BA-405A-4468-8A16-0FB0AFBC8CB0.JPG",
  "09A31054-3A12-400F-90C1-316B224BD046.JPG",
  "0C6AE07E-0553-4A7F-A9F8-9D8B02C3803C.JPG",
  "1802C959-7467-4519-9957-B9AE5C7F1393.JPG",
  "39A6CEAD-799A-4EC3-8F59-D95B4C419D9B.JPG",
  "3D4BE2DA-47EB-4EF3-9AF7-660E7EE9A6ED.JPG",
  "415DFBAE-BF6A-4FB1-89B5-A5434B03AE05.JPG",
  "46641FC5-401F-462C-9179-CAE23ED1E2E8.JPG",
  "4A2A8F4A-28FE-40A0-BD40-738475BBE89D.JPG",
  "52339132-588B-4874-B472-7D82FADB4A80.JPG",
  "526B75DD-0F8A-4738-BB05-D515A10954E0.JPG",
  "5699D771-70BC-4817-9D18-0919CD9103AA.JPG",
  "5B271E59-1953-4AD5-B99A-C43078B1D231.JPG",
  "61997CDB-20A1-4835-BE41-3ABB4BF37DEA.JPG",
  "69BAEEC0-7C4B-4821-8595-02152DC7E7FB.JPG",
  "7849AC4D-E6E4-4F8C-BEDC-56401FBAB1A7.JPG",
  "791F7E88-7FFD-4260-A2A4-0EB1FF5ECDB8.JPG",
  "7C6EB16F-E2C4-4E57-AD15-CCE8220ADEA6.JPG",
  "7FA9F18E-93B8-4DE4-A2F8-E60DA49CDE61.JPG",
  "9190B0AA-8EB6-409D-ABC2-737B7BD129B0.JPG",
  "94206628-3DF5-459F-A2F8-B7B2CE156BE7.JPG",
  "C07B0F61-E120-4F97-8370-7696ECFD136F.JPG",
  "C6728619-0B0A-4A7A-9F06-13A385B9B473.JPG",
  "CE853D29-EB16-4882-9C4D-2E19781DA71F.JPG",
  "D08CDD06-DF61-4D1B-B1F4-CF3D9FB4D665.JPG",
  "D5C814F8-8BBF-48B5-8A7D-9C7C53512FAB.JPG",
  "E3BD0EC6-88F5-48F2-B510-591805C426F8.JPG",
  "E9B6974E-3BB2-48F9-A4C3-D68892E40092.JPG",
  "E9CE7FD1-BA8F-440C-AB2E-37DF8EF56D0F.JPG",
  "F262D857-0D3E-47F6-A8C2-4A0A0CC3529C.JPG",
].map((f) => ({ src: `/assets/highlights/summer_week_five/${f}`, alt: `Week 5 — ${f}`, week: 5 }));

const WEEK_SIX: GalleryImage[] = [
  "1A73BC70-CEC1-4979-8576-39585C31DB07.JPG",
  "1D47ADF7-BFF8-4E74-8A51-E0444E1E5AB2.JPG",
  "229F0F64-45E0-44C9-8EDE-E7F39D948130.JPG",
  "337A7F28-CB3D-47AD-9B02-76706D3EC299.JPG",
  "5065B50D-86EC-4CD1-92CD-C4327D38CA14.JPG",
  "6015040C-CE16-4977-A8FF-8243A4968654.JPG",
  "6A828A98-5226-4767-BDD7-6FC3133E19D8.JPG",
  "6ED6BA87-AB2C-42FA-97F4-57719463AB1A.JPG",
  "C40F5D0B-D238-425F-B29C-ABB8F47F8FC8.JPG",
  "D9C252D3-D1B9-43D5-8B1A-6F161765E253 2.JPG",
  "IMG_9916.JPG",
  "IMG_9918.JPG",
  "IMG_9919.JPG",
  "sagefield_1783398462180.jpg",
].map((f) => ({ src: `/assets/highlights/summer_week_six/${f}`, alt: `Week 6 — ${f}`, week: 6 }));

const ALL_IMAGES: GalleryImage[] = [...WEEK_SIX, ...WEEK_FIVE, ...WEEK_FOUR, ...WEEK_THREE, ...WEEK_TWO, ...WEEK_ONE];

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function GalleryCard({
  image,
  index,
  onClick,
}: {
  image: GalleryImage;
  index: number;
  onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      className="relative w-full aspect-square overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index % 12, 11) * 0.04 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Skeleton placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {/* Real image */}
      <img
        src={image.src}
        alt={image.alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </motion.button>
  );
}

const BATCH_SIZE = 12;
const INITIAL_COUNT = 24;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GalleryPage() {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const visibleImages = ALL_IMAGES.slice(0, visibleCount);
  const hasMore = visibleCount < ALL_IMAGES.length;

  // IntersectionObserver to load more on scroll
  const loadMore = useCallback(() => {
    setVisibleCount((c) => c + BATCH_SIZE);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div className="min-h-screen bg-welcome-bg">
      <Navbar darkStyle />

      {/* Hero */}
      <section className="pt-32 pb-10 px-6 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-5 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full mb-4 font-body">
              Summer 2026
            </span>
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-800 mb-3">
              Gallery
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px">
          {visibleImages.map((image, i) => (
            <GalleryCard
              key={image.src}
              image={image}
              index={i}
              onClick={() => setLightboxIndex(i)}
            />
          ))}
        </div>

        <div className="px-6 sm:px-12 lg:px-16">
          {/* Lazy-load sentinel */}
          {hasMore && (
            <div ref={sentinelRef} className="py-8 flex justify-center">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gray-300 animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {!hasMore && ALL_IMAGES.length > INITIAL_COUNT && (
            <p className="text-center text-xs text-gray-400 font-body mt-8">
              All {ALL_IMAGES.length} photos loaded
            </p>
          )}
        </div>
      </section>

      <Footer />

      <div className="hidden lg:block">
        <FloatingSMSButton />
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={visibleImages.map((img) => ({ src: img.src, alt: img.alt }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
