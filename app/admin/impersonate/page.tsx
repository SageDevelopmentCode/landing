import { Eye } from "lucide-react";
import { cssColors as colors } from "../design-system";

export default function ImpersonatePage() {
  return (
    <div
      className="flex items-center justify-center h-full"
      style={{ minHeight: "60vh" }}
    >
      <div className="text-center">
        <Eye
          className="w-10 h-10 mx-auto mb-4"
          style={{ color: colors.textQuaternary }}
        />
        <p className="text-sm" style={{ color: colors.textTertiary }}>
          Select a parent from the list to preview their dashboard
        </p>
      </div>
    </div>
  );
}
