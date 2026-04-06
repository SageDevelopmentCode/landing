import HelpWidget from "@/app/parent/components/HelpWidget";

export default function StepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <HelpWidget />
    </>
  );
}
