"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import GardenShell from "@/app/_garden/GardenShell";
import LatestRecap from "@/app/highlights/_shared/LatestRecap";
import { formatPhone } from "../utils/formatPhone";
import { FUN_FRIDAY_DROPIN_CENTS } from "@/shared/billing/school-year";
import type { ChildEntry, FridayFormData, PaymentMethod } from "./components/race/PitStopForm";
import ParticipantAgreementDrawer from "./components/race/ParticipantAgreementDrawer";
import TurkeyHero from "./components/thankful/TurkeyHero";
import PolaroidMarquee from "./components/thankful/PolaroidMarquee";
import CraftTable from "./components/thankful/CraftTable";
import GratitudeTree from "./components/thankful/GratitudeTree";
import HarvestForm from "./components/thankful/HarvestForm";
import PieBasket from "./components/thankful/PieBasket";
import FinaleTable, { MobileReserveBar } from "./components/thankful/FinaleTable";
import { PieCrust } from "./components/thankful/Dividers";
import { AutumnPill } from "./components/thankful/ui";
import { BG, DEFAULT_TURKEY, EVENT, saveTurkeyChoice, type TurkeyChoice } from "./components/thankful/data";
import "./thankful.css";

const FRIDAY_DROPIN_DOLLARS = FUN_FRIDAY_DROPIN_CENTS / 100;

export default function FridayPage() {
  const [turkey, setTurkey] = useState<TurkeyChoice>(DEFAULT_TURKEY);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [coverFees, setCoverFees] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [sigPrintedName, setSigPrintedName] = useState("");
  const [sigValue, setSigValue] = useState("");

  const [formData, setFormData] = useState<FridayFormData>({
    parentName: "",
    email: "",
    phone: "",
    referralSource: "",
    notes: "",
    emergencyName: "",
    emergencyPhone: "",
    consentOutdoor: false,
    consentPhoto: false,
  });

  const nextChildId = useRef(1);
  const [children, setChildren] = useState<ChildEntry[]>([{ id: 0, name: "", age: "" }]);

  const addChild = () => {
    const id = nextChildId.current++;
    setChildren((prev) => [...prev, { id, name: "", age: "" }]);
  };
  const removeChild = (id: number) => setChildren((prev) => prev.filter((child) => child.id !== id));
  const updateChild = (id: number, field: "name" | "age", value: string) =>
    setChildren((prev) => prev.map((child) => (child.id === id ? { ...child, [field]: value } : child)));

  const formRef = useRef<HTMLDivElement>(null);
  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    if (!agreementOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [agreementOpen]);

  const openAgreement = () => {
    if (formData.parentName && !sigPrintedName) setSigPrintedName(formData.parentName);
    setAgreementOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name.toLowerCase().includes("phone") ? formatPhone(value) : value,
    }));
  };

  // Mirrors the charge calculated in app/api/friday-register/route.ts.
  const baseCents = children.length * FUN_FRIDAY_DROPIN_CENTS;
  const cardTotalCents = Math.round((baseCents + 30) / (1 - 0.029));
  const achFeeCents = Math.min(Math.round(baseCents * 0.008), 500);
  const cardFee = (cardTotalCents - baseCents) / 100;
  const achFee = achFeeCents / 100;
  const totalBase = baseCents / 100;
  const payTotal = totalBase + (paymentMethod === "card" ? cardFee : achFee);

  const isFormValid =
    !!formData.parentName.trim() &&
    !!formData.email.trim() &&
    children.length > 0 &&
    children.every((c) => !!c.name.trim() && !!c.age) &&
    formData.consentOutdoor &&
    coverFees;

  const handleSaveSignature = () => {
    if (!sigPrintedName.trim() || !sigValue.trim()) return;
    setAgreementSigned(true);
    setAgreementOpen(false);
  };

  const handleSubmit = async () => {
    if (!isFormValid || !agreementSigned || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    saveTurkeyChoice(turkey);
    try {
      const res = await fetch("/api/friday-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: formData.parentName,
          email: formData.email,
          phone: formData.phone,
          children: children.map((c) => ({ name: c.name, age: Number(c.age) })),
          referralSource: formData.referralSource,
          notes: formData.notes,
          emergencyName: formData.emergencyName,
          emergencyPhone: formData.emergencyPhone,
          consentOutdoor: formData.consentOutdoor,
          consentPhoto: formData.consentPhoto,
          signatureName: sigPrintedName,
          paymentMethod,
          coverFees,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      setSubmitError("Unexpected response. Please try again.");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GardenShell navbar={<Navbar darkStyle />} announcement={false} smsDesktopOnly className="tg-page">
      <TurkeyHero turkey={turkey} onTurkeyChange={setTurkey} onReserve={scrollToForm} price={FRIDAY_DROPIN_DOLLARS} />

      <PieCrust top={BG.cream} bottom={BG.wheat} />
      <PolaroidMarquee />
      <PieCrust top={BG.wheat} bottom={BG.cream} leaves={false} flip />

      <CraftTable price={FRIDAY_DROPIN_DOLLARS} onReserve={scrollToForm} />

      <PieCrust top={BG.cream} bottom={BG.forest} />
      <GratitudeTree />
      <PieCrust top={BG.forest} bottom={BG.sage} leaves={false} flip />

      <LatestRecap className="bg-[#E8F3E3]" />

      <PieCrust top={BG.sage} bottom={BG.peach} />
      <section id="reserve" className="scroll-mt-20 py-24 lg:py-32" style={{ backgroundColor: BG.peach }}>
        <div ref={formRef} className="mx-auto max-w-3xl scroll-mt-32 px-4 sm:px-10">
          <div className="mb-10 text-center">
            <AutumnPill>🍁 Save Your Seat</AutumnPill>
            <h2 className="sf-display mt-5 text-5xl text-[var(--sf-ink)] md:text-7xl">Reserve Your Spot</h2>
            <p className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm font-extrabold">
              <span className="rounded-full bg-[var(--sf-ink)] px-4 py-1.5 text-white">{`$${FRIDAY_DROPIN_DOLLARS} per child`}</span>
              <span className="rounded-full bg-white px-4 py-1.5 text-[var(--sf-ink)]">No enrollment required</span>
              <span className="rounded-full bg-white px-4 py-1.5 text-[var(--sf-ink)]">Limited spots</span>
              <span className="rounded-full bg-white px-4 py-1.5 text-[var(--sf-ink)]">{EVENT.weekdayDate}</span>
            </p>
          </div>
          <HarvestForm
            turkey={turkey}
            price={FRIDAY_DROPIN_DOLLARS}
            formData={formData}
            onChange={handleChange}
            entries={children}
            onAddChild={addChild}
            onRemoveChild={removeChild}
            onUpdateChild={updateChild}
            paymentMethod={paymentMethod}
            onPaymentMethod={setPaymentMethod}
            cardFee={cardFee}
            achFee={achFee}
            payTotal={payTotal}
            totalBase={totalBase}
            coverFees={coverFees}
            onCoverFees={setCoverFees}
            agreementSigned={agreementSigned}
            onOpenAgreement={openAgreement}
            isFormValid={isFormValid}
            submitting={submitting}
            submitError={submitError}
            onSubmit={handleSubmit}
          />
        </div>
      </section>
      <PieCrust top={BG.peach} bottom={BG.cream} leaves={false} flip />

      <PieBasket />

      <PieCrust top={BG.cream} bottom={BG.butter} />
      <FinaleTable turkey={turkey} price={FRIDAY_DROPIN_DOLLARS} onReserve={scrollToForm} />

      <MobileReserveBar price={FRIDAY_DROPIN_DOLLARS} onReserve={scrollToForm} formRef={formRef} />

      <ParticipantAgreementDrawer
        agreementOpen={agreementOpen}
        setAgreementOpen={setAgreementOpen}
        formData={formData}
        entries={children}
        agreementSigned={agreementSigned}
        setAgreementSigned={setAgreementSigned}
        sigPrintedName={sigPrintedName}
        setSigPrintedName={setSigPrintedName}
        sigValue={sigValue}
        setSigValue={setSigValue}
        handleSaveSignature={handleSaveSignature}
      />
    </GardenShell>
  );
}
