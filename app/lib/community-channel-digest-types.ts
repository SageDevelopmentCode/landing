export type CommunityChannelDigestMessage = {
  senderName: string;
  preview: string;
  createdAt: string;
};

export type CommunityChannelDigestChannel = {
  channelId: string;
  channelName: string;
  unreadCount: number;
  messages: CommunityChannelDigestMessage[];
  moreUnreadCount: number;
};

export type CommunityChannelDigestEmailInput = {
  parentFullName: string;
  channels: CommunityChannelDigestChannel[];
  messagesUrl?: string;
};
