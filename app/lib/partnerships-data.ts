export const ENCLAVE_HREF =
  "https://spectrumretirement.com/enclaveatroundrock-senior-living-tx-roundrock/";

export type Partner = {
  name: string;
  logo: string;
  href: string;
  logoClassName?: string;
  previewLogoClassName?: string;
  fbEmbed: string;
  fbHeight: number;
  pullQuote: string;
  ctaLabel: string;
};

export const PARTNERS: Partner[] = [
  {
    name: "The Enclave at Round Rock Senior Living",
    logo: "/assets/Enclavelogo.svg",
    href: ENCLAVE_HREF,
    fbEmbed:
      "https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fsagefield.co%2Fposts%2Fpfbid0AQPRBejT5H92mAP63vLCKphetUsi8nGAtyy714AACrkMpcG8pmRQ3YEcPC5mdWYnl&show_text=true&width=500",
    fbHeight: 699,
    pullQuote:
      "We're excited to bring our students and Enclave residents together for shared activities, conversation, and connections across generations.",
    ctaLabel: "Visit The Enclave at Round Rock",
    logoClassName: "relative h-14 w-64 mb-6",
    previewLogoClassName: "relative h-12 w-full max-w-[220px] mx-auto",
  },
  {
    name: "Ally Medical ER",
    logo: "/assets/AllyLogo.jpg",
    href: "https://www.allymedical.com/locations/round-rock-emergency-room/",
    fbEmbed:
      "https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fsagefield.co%2Fposts%2Fpfbid0kU7sghZ3iWpHtxsbvcvP2ZMBwmWrkdSQ3nx1GfM4T3mwiwpvuCGzX7nrdJaxEwx2l&show_text=true&width=500",
    fbHeight: 776,
    pullQuote:
      'Sending your children to an outdoor-focused school where they are encouraged to try "dangerous things safely" — climbing trees, testing their balance, building confidence, and racing down slip n\' slides — comes with a big responsibility: keeping them safe while they explore.',
    ctaLabel: "Visit Ally Medical ER",
    previewLogoClassName: "relative h-12 w-36 mx-auto",
  },
  {
    name: "VELA Education Fund",
    logo: "/assets/VelaLogo.png",
    href: "https://vela.org/",
    fbEmbed:
      "https://www.facebook.com/plugins/post.php?href=https%3A%2F%2Fwww.facebook.com%2Fsagefield.co%2Fposts%2Fpfbid06oUp4XqQcFjcEgoWoxaUXczcRnxdtpFDNHAd5C1g3Ehnx9eHEpPgCMRa4RQXWpu3l&show_text=true&width=500",
    fbHeight: 737,
    pullQuote:
      "Proud to be part of the VELA Founder Network — a national community of education entrepreneurs building small, human-centered learning environments outside the traditional school system.",
    ctaLabel: "Visit VELA Education Fund",
    previewLogoClassName: "relative h-12 w-36 mx-auto",
  },
];
