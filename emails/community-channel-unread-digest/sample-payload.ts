import type { CommunityChannelDigestEmailInput } from "../../app/lib/community-channel-digest-types";

export const sampleCommunityChannelDigestPayload: CommunityChannelDigestEmailInput =
  {
    parentFullName: "Sarah Martinez",
    channels: [
      {
        channelId: "00000000-0000-0000-0000-000000000001",
        channelName: "General",
        unreadCount: 1,
        moreUnreadCount: 0,
        messages: [
          {
            senderName: "Miss Zelinda",
            preview:
              "Thank you for sharing this! It sounds really fun — we're glad the field trip went well.",
            createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
          },
        ],
      },
      {
        channelId: "00000000-0000-0000-0000-000000000002",
        channelName: "Fireflies ✨ — Miss Zelinda",
        unreadCount: 3,
        moreUnreadCount: 1,
        messages: [
          {
            senderName: "James R.",
            preview:
              "Does anyone know if we need to send sunscreen this week for outdoor time?",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            senderName: "Miss Zelinda",
            preview:
              "Yes — please send sunscreen labeled with your child's name. We'll reapply after lunch.",
            createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          },
        ],
      },
    ],
  };
