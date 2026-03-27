"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import VolunteerDialog from "./VolunteerDialog";

export default function VolunteerButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-6 py-3 bg-[#4a7c59] text-white
                   font-semibold rounded-lg hover:bg-[#3d6b4a] transition-all
                   duration-200 font-body cursor-pointer mt-6"
      >
        <Heart className="w-4 h-4" />
        Express Interest in Volunteering
      </button>
      <VolunteerDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
