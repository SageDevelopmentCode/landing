"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Instagram, Facebook } from "lucide-react";
import Image from "next/image";

const HIGHLIGHT_IMAGES = [
  "/assets/highlights/summer_week_one/0D75EB5E-FE8D-405E-AF5D-6457DDF7473A.JPG",
  "/assets/highlights/summer_week_one/1A5F716C-6189-450B-8F8C-61E71621C2B9.JPG",
  "/assets/highlights/summer_week_one/1D2BF4A6-5081-4D51-B1E8-F6E0E3D820B3.JPG",
  "/assets/highlights/summer_week_one/2B9964FA-0047-4590-880C-095C315B7DE8.JPG",
  "/assets/highlights/summer_week_one/2DE620A5-86E3-4A0D-8579-721D97615159.JPG",
  "/assets/highlights/summer_week_one/341400BF-486B-43A0-912E-84623B6299D6.JPG",
  "/assets/highlights/summer_week_one/37F2A2AD-33E5-4FC8-A423-6CE04787FC4C.JPG",
  "/assets/highlights/summer_week_one/412BC6B4-B894-46FF-A09D-318C09C1251A.JPG",
  "/assets/highlights/summer_week_one/48A7CEB7-3F5C-422A-9C1B-8BBFDE5CCF4D%202.JPG",
  "/assets/highlights/summer_week_one/58982292-CDE7-4E77-B528-0F01DB604DF7%202.JPG",
  "/assets/highlights/summer_week_one/66719803-D874-46B5-9B16-C4F79A865A85%202.JPG",
  "/assets/highlights/summer_week_one/715F7B95-10E1-456B-864E-20E2E0C20569.JPG",
  "/assets/highlights/summer_week_one/79C28EF4-D1A6-4874-AA73-CCA66F04BDEF.JPG",
  "/assets/highlights/summer_week_one/8018F647-AC55-4EE0-9D25-0F326D805ED8%204.jpg",
  "/assets/highlights/summer_week_one/9E82F217-AF40-48F7-8860-906092304251.JPG",
  "/assets/highlights/summer_week_one/A932DC39-8100-43C7-A2AE-45C2DC8AC9EA.JPG",
  "/assets/highlights/summer_week_one/AB176A40-3DE2-4856-8E87-2D169FB3F41A.JPG",
  "/assets/highlights/summer_week_one/B10368B0-5344-4D70-8C0C-C091A086D6B2%202.JPG",
  "/assets/highlights/summer_week_one/B10368B0-5344-4D70-8C0C-C091A086D6B2.JPG",
  "/assets/highlights/summer_week_one/B3645828-BB39-41B0-A309-E9D7DBBFFEAF.JPG",
  "/assets/highlights/summer_week_one/C7665CCD-EB43-429C-AB7F-BA19FF9AE4A6.JPG",
  "/assets/highlights/summer_week_one/C8EAD2FA-0FB2-4D59-A079-493C09298ABF.JPG",
  "/assets/highlights/summer_week_one/DDDA3AA2-CDF9-42CF-B8FF-AD61CED60065%202.JPG",
  "/assets/highlights/summer_week_one/E96A3688-D421-43A9-B8CA-93D6B881E555.JPG",
  "/assets/highlights/summer_week_one/FullSizeRender%204.jpg",
  "/assets/highlights/summer_week_one/FullSizeRender%205.jpg",
  "/assets/highlights/summer_week_one/IMG_8915.jpg",
  "/assets/highlights/summer_week_two/08BB87B0-E53E-4981-9741-8F0AC0C32238.JPG",
  "/assets/highlights/summer_week_two/0E23519F-0846-4BB8-9795-BC26B412E702%202.JPG",
  "/assets/highlights/summer_week_two/17C0053A-E948-49DC-8D32-58D6D753C37D.JPG",
  "/assets/highlights/summer_week_two/24E4F2AF-5C30-4C23-9B09-8EA71093A1FD.JPG",
  "/assets/highlights/summer_week_two/2B58FEC3-CD58-40D9-93C5-A83D7DBB5A21.JPG",
  "/assets/highlights/summer_week_two/2CDB3506-F666-4787-ACCB-97B3A945C6EE.JPG",
  "/assets/highlights/summer_week_two/2D39D0C0-64E9-4355-A719-248000AD4077.JPG",
  "/assets/highlights/summer_week_two/2F8E12CF-285F-4629-A621-7DA20ED68F65.JPG",
  "/assets/highlights/summer_week_two/3B7A8137-E253-4E45-B71D-AD5325A5460A.JPG",
  "/assets/highlights/summer_week_two/3E22E13E-859C-427A-9FA3-73F11B989B65.JPG",
  "/assets/highlights/summer_week_two/4D005FA0-C22C-4DE9-B589-8130BBB7723A.JPG",
  "/assets/highlights/summer_week_two/510F5647-307C-447A-95AE-8713B309CA94.JPG",
  "/assets/highlights/summer_week_two/5490D879-F69D-40E0-B2E7-FAD64DE100D9.JPG",
  "/assets/highlights/summer_week_two/570FEA28-D009-4038-B966-EAF9E0C9EE73.JPG",
  "/assets/highlights/summer_week_two/572C0FD1-F9A7-4058-B77A-B2544F8ABF04.JPG",
  "/assets/highlights/summer_week_two/5B961697-D097-476C-9D47-09F547042841.JPG",
  "/assets/highlights/summer_week_two/6B95C9E4-E145-49CA-8818-7AFC9B3B8353.JPG",
  "/assets/highlights/summer_week_two/703B0F21-5D8C-4862-9E8C-4B22981768EC%202.JPG",
  "/assets/highlights/summer_week_two/71493760-06B5-4E8A-9340-8DD3B32571CD.JPG",
  "/assets/highlights/summer_week_two/84E07202-6127-4142-9312-22A8665F8333%202.JPG",
  "/assets/highlights/summer_week_two/8DC65D50-316D-44DA-88AA-128F72DF019B.JPG",
  "/assets/highlights/summer_week_two/9511C4BC-5E44-4FCF-9DC6-EE386F2060DA.JPG",
  "/assets/highlights/summer_week_two/9AF86705-559C-4F6C-ADC9-4F144413EC9C.JPG",
  "/assets/highlights/summer_week_two/9CFCA632-25EE-4EAF-89B4-CCC1F01E215D.JPG",
  "/assets/highlights/summer_week_two/A0AA3C22-7657-4E63-A3FD-7AB6CD3B85E0.JPG",
  "/assets/highlights/summer_week_two/A36A20F2-7144-4BA4-AF29-70965A386A1A.JPG",
  "/assets/highlights/summer_week_two/A6B134A3-5B8E-4A1F-AF66-5AC22A504C9E.JPG",
  "/assets/highlights/summer_week_two/B8D13E63-C11A-4934-A926-6921DC948109.JPG",
  "/assets/highlights/summer_week_two/BF26943C-5BF7-40CD-9686-D57805D57453.JPG",
  "/assets/highlights/summer_week_two/C25BBF44-8B2C-436E-9432-F742D840A201.JPG",
  "/assets/highlights/summer_week_two/CA435D3C-71BD-433F-A75E-E4CA02BC3897%202.JPG",
  "/assets/highlights/summer_week_two/CB84AC72-2A28-4712-B2E9-C9DF08E4D7CD.JPG",
  "/assets/highlights/summer_week_two/D3319D8D-EE61-43C4-93E5-54AEB0A5B58C.JPG",
  "/assets/highlights/summer_week_two/D9F6F89E-CFCA-4738-B3D6-78A3DACF9636.JPG",
  "/assets/highlights/summer_week_two/DC1D10EF-768E-48E1-AFA9-B935172FA14B.JPG",
  "/assets/highlights/summer_week_two/E3AE964D-CC01-41A0-B040-35DCCB27CD4C.JPG",
  "/assets/highlights/summer_week_two/E9BB9AFF-C176-409F-ADF7-226F63526D77.JPG",
  "/assets/highlights/summer_week_two/EE67A184-15E0-425D-BBFB-26891F754F4C.JPG",
  "/assets/highlights/summer_week_two/IMG_8889.JPG",
  "/assets/highlights/summer_week_three/059D446B-28E2-404A-AA9E-1C31ECA397C2.JPG",
  "/assets/highlights/summer_week_three/270406F4-D0DB-49C7-B0FD-893838BC93D6%202.JPG",
  "/assets/highlights/summer_week_three/2B11FA2F-F6BE-4184-B354-7B592E1FD313%202.JPG",
  "/assets/highlights/summer_week_three/2E90C4B5-CECC-4774-B9F9-65F11DF9A6D7%202.JPG",
  "/assets/highlights/summer_week_three/3F03181F-5761-416B-8C7D-003DA143D804.JPG",
  "/assets/highlights/summer_week_three/4591E194-779B-46AC-A893-B9E75B6D64A7.JPG",
  "/assets/highlights/summer_week_three/4C53798C-920D-4497-B46C-1037E6FF21E4.JPG",
  "/assets/highlights/summer_week_three/5B9A16B7-70BE-464B-9D57-20639BE6E55D%202.JPG",
  "/assets/highlights/summer_week_three/5DD49FD0-D35F-4411-8171-65D816CA4934.JPG",
  "/assets/highlights/summer_week_three/77048964-333A-426F-9E8C-69F51FB987D7.JPG",
  "/assets/highlights/summer_week_three/8CE3DD93-63A1-4FD4-A81C-B4949CA60664.JPG",
  "/assets/highlights/summer_week_three/9AE171D2-072A-4BB0-9578-F4407CB2B26C%202.JPG",
  "/assets/highlights/summer_week_three/AFD7C6F5-A4E0-4EB6-9A81-931C53C1C814.JPG",
  "/assets/highlights/summer_week_three/B6F3BF45-573E-4C9E-90C7-DF0802E13E0E.JPG",
  "/assets/highlights/summer_week_three/BC68CF40-220C-48CE-8C63-D14F22100AAA.JPG",
  "/assets/highlights/summer_week_three/BCC6DAA3-53B7-4343-8734-E38512D99959%202.JPG",
  "/assets/highlights/summer_week_three/CEADADE6-E43C-4A6D-8AB5-E8E2734423A9.JPG",
  "/assets/highlights/summer_week_three/ED35AB4E-8E56-43C6-ADA7-A7D9CDE3C95C.jpeg",
  "/assets/highlights/summer_week_three/FE28F7EF-5568-4F11-9C62-E44AC6209D53.JPG",
  "/assets/highlights/summer_week_three/FF4C9AB2-63DC-4FBC-BDDA-99D15C197948%202.JPG",
  "/assets/highlights/summer_week_three/IMG_9138.jpg",
  "/assets/highlights/summer_week_three/IMG_9275.jpg",
  "/assets/highlights/summer_week_three/IMG_9313.JPG",
];

const INSTAGRAM_URL = "https://www.instagram.com/sagefield.co";

export default function SocialMediaSection() {
  const galleryRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    let pos = 0;
    const tick = () => {
      if (el) {
        pos += 0.6;
        el.scrollLeft = Math.round(pos);
        if (el.scrollLeft >= el.scrollWidth / 2) {
          pos = 0;
          el.scrollLeft = 0;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section className="bg-welcome-bg py-16 px-8 sm:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <span className="inline-block px-6 py-2 bg-badge-bg text-black text-sm font-semibold rounded-full font-body">
            Follow Us
          </span>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold text-black font-heading mb-6 text-center"
        >
          Follow Us on Social Media
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base md:text-lg text-text-gray leading-relaxed font-body mb-8 text-center max-w-3xl mx-auto"
        >
          Join our community and stay connected! Follow us to see behind-the-scenes moments,
          educational insights, and the joyful learning experiences at Sage Field.
        </motion.p>

        {/* Auto-scroll photo strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div
            ref={galleryRef}
            className="overflow-x-auto flex gap-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] mb-8"
          >
            {[...HIGHLIGHT_IMAGES, ...HIGHLIGHT_IMAGES].map((src, i) => (
              <a
                key={i}
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-64 flex-shrink-0 aspect-[4/3] rounded-xl overflow-hidden shadow-md block"
              >
                <Image
                  src={src}
                  alt="Sage Field highlight"
                  fill
                  className="object-cover hover:scale-[1.03] transition-transform duration-500"
                  sizes="256px"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </motion.div>

        {/* Social Media Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center gap-4"
        >
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-body"
            style={{ backgroundColor: "#E4405F" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D62D4F")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E4405F")}
          >
            <Instagram className="w-5 h-5" />
            <span>Instagram</span>
          </a>
          <a
            href="https://www.facebook.com/sagefield.co"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-body"
            style={{ backgroundColor: "#1877F2" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0E63D6")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1877F2")}
          >
            <Facebook className="w-5 h-5" />
            <span>Facebook</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
