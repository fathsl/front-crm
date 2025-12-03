import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import type { Discussion, Message } from "~/help";
import { useAtomValue } from "jotai";
import { userAtom } from "~/utils/userAtom";
import type { User } from "~/help";

const DiscussionDetailPage: React.FC = () => {
  const { discussionId } = useParams<{ discussionId: string }>();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useAtomValue(userAtom) as unknown as User;
  const baseUrl = "https://api-crm-tegd.onrender.com";

  const fetchDiscussionById = useCallback(async () => {
    if (!discussionId || !currentUser) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${baseUrl}/api/Chat/discussions/detail/${discussionId}?userId=${currentUser.userId}`
      );

      if (response.ok) {
        const data: Discussion = await response.json();
        setDiscussion(data);
      } else {
        throw new Error("Failed to fetch discussion");
      }
    } catch (err) {
      console.error("Error fetching discussion:", err);
      setError("Failed to load discussion");
    }
  }, [discussionId, currentUser, baseUrl]);

  const fetchMessages = useCallback(async () => {
    if (!discussionId || !currentUser) return;

    try {
      const response = await fetch(
        `${baseUrl}/api/Chat/discussions/${discussionId}/messages?userId=${currentUser.userId}`
      );

      if (response.ok) {
        const data = await response.json();
        const sorted = data.messages.sort(
          (a: Message, b: Message) =>
            new Date(a.createdAt ?? 0).getTime() -
            new Date(b.createdAt ?? 0).getTime()
        );
        setMessages(sorted);
      } else {
        throw new Error("Failed to fetch messages");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [discussionId, currentUser, baseUrl]);

  useEffect(() => {
    const loadData = async () => {
      await fetchDiscussionById();
      await fetchMessages();
    };
    loadData();
  }, [fetchDiscussionById, fetchMessages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading discussion...</div>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">
          {error || "Discussion not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-800">
          {discussion.title}
        </h1>
        {discussion.description && (
          <p className="text-sm text-gray-600 mt-1">{discussion.description}</p>
        )}
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <span>Created by: {discussion.createdByUserId}</span>
          <span>•</span>
          <span>
            Between: {discussion.senderId} & {discussion.receiverId}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.senderId === currentUser?.userId;

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg ${
                      isCurrentUser
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-800 border"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs ${isCurrentUser ? "text-blue-100" : "text-gray-500"}`}
                      >
                        {new Date(message.createdAt ?? 0).toLocaleTimeString()}
                      </span>
                      {message.isEdited && (
                        <span
                          className={`text-xs ${isCurrentUser ? "text-blue-100" : "text-gray-500"}`}
                        >
                          (edited)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionDetailPage;
