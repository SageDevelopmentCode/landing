"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingSMSButton from "../components/FloatingSMSButton";
import WeekRecapPreview from "../components/WeekRecapPreview";
import { formatPhone } from "../utils/formatPhone";
import { FUN_FRIDAY_DROPIN_CENTS } from "@/shared/billing/school-year";
import StartLineHero from "./components/race/StartLineHero";
import PhotoFinishStrip from "./components/race/PhotoFinishStrip";
import RoadBend from "./components/race/RoadBend";
import StationsCircuit from "./components/race/StationsCircuit";
import RaceDayBoard from "./components/race/RaceDayBoard";
import PitStopForm, {
  type ChildEntry,
  type FridayFormData,
  type PaymentMethod,
} from "./components/race/PitStopForm";
import ParticipantAgreementDrawer from "./components/race/ParticipantAgreementDrawer";
import PitBag from "./components/race/PitBag";
import FinishLine, { MobileReserveBar } from "./components/race/FinishLine";
import { saveCarChoice, type CarChoice } from "./components/race/data";
import { kanit } from "./components/race/fonts";
import "./race.css";

const FRIDAY_DROPIN_DOLLARS = FUN_FRIDAY_DROPIN_CENTS / 100;

const INK = "#1C1F2B";
const CHALK = "#FFFDF5";
const SUN = "#FFF3C4";
const RED = "#E3241B";
const BLUE = "#1456F0";
const FLAG = "#FFC800";

export default function FieldDayFridayPage() {
  const [car, setCar] = useState<CarChoice>({ liveryIndex: 0, number: 7 });

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
  const removeChild = (id: number) =>
    setChildren((prev) => prev.filter((child) => child.id !== id));
  const updateChild = (id: number, field: "name" | "age", value: string) =>
    setChildren((prev) =>
      prev.map((child) => (child.id === id ? { ...child, [field]: value } : child)),
    );

  const formRef = useRef<HTMLDivElement>(null);
  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name.toLowerCase().includes("phone")
            ? formatPhone(value)
            : value,
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
    saveCarChoice(car);
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
    <div className={`${kanit.variable} race-page min-h-screen`}>
      <Navbar darkStyle />

      <StartLineHero
        car={car}
        onCarChange={setCar}
        onReserve={scrollToForm}
        price={FRIDAY_DROPIN_DOLLARS}
      />
      <PhotoFinishStrip />

      <RoadBend from={INK} to={CHALK} dir="rtl" car={car} />
      <StationsCircuit car={car} onReserve={scrollToForm}>
        <RaceDayBoard price={FRIDAY_DROPIN_DOLLARS} />
      </StationsCircuit>

      <RoadBend from={CHALK} to={SUN} dir="ltr" car={car} />
      <div className="rc-recap-wrap">
        <WeekRecapPreview />
      </div>

      <RoadBend from={SUN} to={RED} dir="rtl" car={car} />
      <section id="reserve" className="rc-signup">
        <div ref={formRef} className="rc-signup-inner">
          <div className="rc-signup-head">
            <h2 className="rc-h2">Reserve Your Spot</h2>
            <p className="rc-signup-facts">
              <b>{`$${FRIDAY_DROPIN_DOLLARS} per child`}</b>
              <span>No enrollment required</span>
              <span>Limited spots</span>
            </p>
          </div>
          <PitStopForm
            car={car}
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

      <RoadBend from={RED} to={BLUE} dir="ltr" car={car} />
      <PitBag car={car} />

      <RoadBend from={BLUE} to={FLAG} dir="rtl" car={car} />
      <FinishLine car={car} price={FRIDAY_DROPIN_DOLLARS} onReserve={scrollToForm} />

      <Footer />

      <MobileReserveBar
        price={FRIDAY_DROPIN_DOLLARS}
        onReserve={scrollToForm}
        formRef={formRef}
      />
      <div className="hidden lg:block">
        <FloatingSMSButton />
      </div>

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
    </div>
  );
}
