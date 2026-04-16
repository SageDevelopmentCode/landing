import { Eye } from "lucide-react";
import Link from "next/link";

export default function AdminPreviewBanner({
  parentName,
  parentEmail,
}: {
  parentName: string | null;
  parentEmail: string;
}) {
  return (
    <div
      className="sticky top-0 z-50 flex items-center justify-between px-5 py-2.5 text-sm font-medium"
      style={{
        backgroundColor: "#1C3A22",
        borderBottom: "1px solid #2C5F2E",
        color: "#A3D9A5",
      }}
    >
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        <span>
          Admin Preview — Read Only &nbsp;|&nbsp;{" "}
          <span className="font-semibold text-white">
            {parentName ?? parentEmail}
          </span>
        </span>
      </div>
      <Link
        href="/admin/impersonate"
        className="text-xs underline"
        style={{ color: "#A3D9A5" }}
      >
        Back to list
      </Link>
    </div>
  );
}
