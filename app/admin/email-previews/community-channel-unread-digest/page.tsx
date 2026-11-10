import { buildCommunityChannelUnreadDigestEmail } from "@/app/lib/zoho";
import { sampleCommunityChannelDigestPayload } from "../../../../emails/community-channel-unread-digest/sample-payload";

export default async function CommunityChannelDigestPreviewPage() {
  const { subject, content } = await buildCommunityChannelUnreadDigestEmail(
    sampleCommunityChannelDigestPayload,
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-2 text-gray-900">
        Community channel unread digest
      </h1>
      <p className="text-sm text-gray-600 mb-4">
        Sample preview (cron sends live unread data). Subject:{" "}
        <span className="font-medium text-gray-800">{subject}</span>
      </p>
      <div
        className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
