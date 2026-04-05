import { useState, useEffect, useRef, useContext } from "react";
import { SocketContext } from "../../context/SocketContext";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import "./chat.scss";

function Chat({ chats: initialChats }) {
  const { currentUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [chats, setChats] = useState(initialChats || []);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Sync chats if parent re-renders with new data
  useEffect(() => {
    setChats(initialChats || []);
  }, [initialChats]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Receive real-time messages from socket
  useEffect(() => {
    if (!socket) return;

    const handleGetMessage = (data) => {
      // Only add if the message belongs to the open chat
      if (activeChat && data.chatId === activeChat.id) {
        setMessages((prev) => [...prev, data]);
      }
      // Always update preview in chat list
      setChats((prev) =>
        prev.map((c) =>
          c.id === data.chatId
            ? { ...c, lastMessage: data.text, seenByCurrentUser: false }
            : c,
        ),
      );
    };

    socket.on("getMessage", handleGetMessage);
    return () => socket.off("getMessage", handleGetMessage);
  }, [socket, activeChat]);

  // Open a chat and load its messages
  const openChat = async (chat) => {
    if (activeChat?.id === chat.id) return;
    setActiveChat(chat);
    setLoading(true);

    try {
      const res = await apiRequest.get(`/chats/${chat.id}`);
      setMessages(res.data.data.messages || []);

      // Mark as seen
      await apiRequest.put(`/chats/${chat.id}/seen`);
      setChats((prev) =>
        prev.map((c) =>
          c.id === chat.id ? { ...c, seenByCurrentUser: true } : c,
        ),
      );
    } catch (err) {
      console.error("Failed to open chat:", err);
    } finally {
      setLoading(false);
    }
  };

  const closeChat = () => {
    setActiveChat(null);
    setMessages([]);
    setText("");
  };

  const handleSend = async () => {
    if (!text.trim() || !activeChat) return;
    const msgText = text.trim();
    setText(""); // optimistic clear

    try {
      const res = await apiRequest.post(`/messages/${activeChat.id}`, {
        text: msgText,
      });
      const newMsg = res.data.data;

      // Add to local messages
      setMessages((prev) => [...prev, newMsg]);

      // ✅ Emit to socket so receiver gets it in real-time
      const receiver = activeChat.receiver;
      socket?.emit("sendMessage", {
        receiverId: receiver?.id,
        data: { ...newMsg, chatId: activeChat.id },
      });

      // Update chat list preview
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? { ...c, lastMessage: msgText, seenByCurrentUser: true }
            : c,
        ),
      );
    } catch (err) {
      console.error("Failed to send:", err);
      setText(msgText); // restore on error
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return "Just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000)
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString();
  };

  return (
    <div className="chat">
      {/* ── Chat List ─────────────────────────────── */}
      <div className="messages">
        <h1>Messages</h1>

        {chats.length === 0 && <p className="empty">No conversations yet.</p>}

        {chats.map((c) => (
          <div
            key={c.id}
            className={[
              "message",
              !c.seenByCurrentUser ? "unseen" : "",
              activeChat?.id === c.id ? "active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => openChat(c)}
          >
            <img src={c.receiver?.avatar || "/noavatar.jpg"} alt="" />
            <div className="info">
              <span className="name">{c.receiver?.username || "User"}</span>
              <p className="preview">{c.lastMessage || "No messages yet"}</p>
            </div>
            {!c.seenByCurrentUser && <div className="dot" />}
          </div>
        ))}
      </div>

      {/* ── Active Chat Box ──────────────────────── */}
      {activeChat && (
        <div className="chatBox">
          {/* Header */}
          <div className="top">
            <div className="user">
              <img
                src={activeChat.receiver?.avatar || "/noavatar.jpg"}
                alt=""
              />
              <span>{activeChat.receiver?.username || "Chat"}</span>
            </div>
            <span className="close" onClick={closeChat}>
              ✕
            </span>
          </div>

          {/* Messages */}
          <div className="center">
            {loading ? (
              <p className="status">Loading…</p>
            ) : messages.length === 0 ? (
              <p className="status">No messages yet. Say hello! 👋</p>
            ) : (
              messages.map((msg) => {
                const isOwn =
                  (msg.senderId ?? msg.sender?.id) === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`chatMessage${isOwn ? " own" : ""}`}
                  >
                    {!isOwn && (
                      <img
                        src={msg.sender?.avatar || "/noavatar.jpg"}
                        alt=""
                        className="avatar"
                      />
                    )}
                    <div className="bubble">
                      <p>{msg.text}</p>
                      <span className="time">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bottom">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              rows={2}
            />
            <button onClick={handleSend} disabled={!text.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
