"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Send, ChevronLeft, SquarePen } from "lucide-react";

type Message = {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
};

type Conversation = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  unread: number;
  lastMessage: string;
  lastTime: string;
  messages: Message[];
};

const conversations: Conversation[] = [
  {
    id: "1",
    name: "Mrs. Johnson",
    role: "Pre-K Teacher",
    initials: "MJ",
    color: "bg-[#4a7c59]",
    unread: 2,
    lastMessage: "Yes, Emma did great at circle time today!",
    lastTime: "10:32 AM",
    messages: [
      { id: "1a", text: "Good morning Mrs. Johnson! I wanted to check in on how Emma is adjusting to the new classroom routine.", fromMe: true, time: "9:15 AM" },
      { id: "1b", text: "Good morning! Emma has been doing wonderfully. She's really warmed up to the other children this week.", fromMe: false, time: "9:45 AM" },
      { id: "1c", text: "That's so great to hear! Has she been participating in circle time? She was a bit shy about it last week.", fromMe: true, time: "10:02 AM" },
      { id: "1d", text: "Yes, Emma did great at circle time today! She even volunteered to lead the weather song. I'll send a photo later.", fromMe: false, time: "10:32 AM" },
      { id: "1e", text: "Also, just a reminder that we have our parent-teacher conference next Thursday at 3:30 PM.", fromMe: false, time: "10:33 AM" },
    ],
  },
  {
    id: "2",
    name: "Front Office",
    role: "Administration",
    initials: "FO",
    color: "bg-[#7c6b4a]",
    unread: 0,
    lastMessage: "Your updated pickup authorization form has been received.",
    lastTime: "Yesterday",
    messages: [
      { id: "2a", text: "Hi, I submitted the updated authorized pickup form online. Can you confirm it was received?", fromMe: true, time: "Mar 20" },
      { id: "2b", text: "Your updated pickup authorization form has been received. We've updated Emma and Liam's records. Thank you!", fromMe: false, time: "Mar 20" },
    ],
  },
  {
    id: "3",
    name: "Nurse Smith",
    role: "School Nurse",
    initials: "NS",
    color: "bg-[#5a6b8a]",
    unread: 1,
    lastMessage: "Just a reminder — allergy meds expire next month.",
    lastTime: "Mar 19",
    messages: [
      { id: "3a", text: "Hi! I wanted to let you know that Emma's EpiPen in our office expires on April 15th. Could you bring a replacement before then?", fromMe: false, time: "Mar 18" },
      { id: "3b", text: "Oh thank you for the heads up! I'll get a new one from the pharmacy this week.", fromMe: true, time: "Mar 18" },
      { id: "3c", text: "Just a reminder — allergy meds expire next month. Let me know if you need the medical form updated as well.", fromMe: false, time: "Mar 19" },
    ],
  },
  {
    id: "4",
    name: "Mr. Davis",
    role: "Kindergarten Teacher",
    initials: "MD",
    color: "bg-[#8a5a6b]",
    unread: 0,
    lastMessage: "Liam had a fantastic day! He finished his reading assignment early.",
    lastTime: "Mar 17",
    messages: [
      { id: "4a", text: "Hi Mr. Davis, just checking in on Liam's progress with reading this week.", fromMe: true, time: "Mar 17" },
      { id: "4b", text: "Liam had a fantastic day! He finished his reading assignment early and even helped another student. He's making great progress.", fromMe: false, time: "Mar 17" },
      { id: "4c", text: "That's wonderful to hear, thank you so much!", fromMe: true, time: "Mar 17" },
    ],
  },
];

export default function MessagesPage() {
  const [activeId, setActiveId] = useState(conversations[0].id);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId)!;

  const filtered = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId]);

  return (
    <div className="flex flex-1 bg-white overflow-hidden">
      {/* Conversation list */}
      <div className={`w-full md:w-80 md:min-w-[320px] border-r border-gray-100 flex flex-col ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
        {/* Search + New Message */}
        <div className="p-3 border-b border-gray-100 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm font-body bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59]/40"
            />
          </div>
          <button
            className="w-9 h-9 rounded-lg bg-[#4a7c59] hover:bg-[#3d6849] text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="New message"
          >
            <SquarePen className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((convo) => (
            <button
              key={convo.id}
              onClick={() => {
                setActiveId(convo.id);
                setMobileShowChat(true);
              }}
              className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                convo.id === activeId
                  ? "bg-[#4a7c59]/5 border-r-2 border-[#4a7c59]"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className={`${convo.color} w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold font-body shrink-0`}>
                {convo.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold font-body text-gray-800 truncate">
                    {convo.name}
                  </span>
                  <span className="text-[11px] text-gray-400 font-body shrink-0 ml-2">
                    {convo.lastTime}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-body mb-0.5">{convo.role}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500 font-body truncate flex-1">
                    {convo.lastMessage}
                  </p>
                  {convo.unread > 0 && (
                    <span className="bg-[#4a7c59] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                      {convo.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 font-body text-center py-8">
              No conversations found
            </p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col ${mobileShowChat ? "flex" : "hidden md:flex"}`}>
        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
          <button
            onClick={() => setMobileShowChat(false)}
            className="md:hidden text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className={`${active.color} w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold font-body`}>
            {active.initials}
          </div>
          <div>
            <p className="text-sm font-semibold font-body text-gray-800">
              {active.name}
            </p>
            <p className="text-xs text-gray-400 font-body">{active.role}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {active.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed ${
                  msg.fromMe
                    ? "bg-[#4a7c59] text-white rounded-br-md"
                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                }`}
              >
                <p>{msg.text}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    msg.fromMe ? "text-white/60" : "text-gray-400"
                  }`}
                >
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim()) setDraft("");
              }}
              className="flex-1 px-4 py-2.5 text-sm font-body bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a7c59]/20 focus:border-[#4a7c59]/40"
            />
            <button
              onClick={() => draft.trim() && setDraft("")}
              className="w-10 h-10 rounded-xl bg-[#4a7c59] hover:bg-[#3d6849] text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
