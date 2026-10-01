import React, { useContext, useEffect, useRef, useState } from "react";
import { Timestamp, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Message from "./Message";
import { ChatContext } from "../context/ChatContext";
import "./Messages.scss";

interface MessageData {
  id: string;
  senderId: string | undefined;
  senderName: string | null | undefined;
  senderAvatar: string | undefined;
  date: Timestamp;
  message?: {
    text?: string;
    img?: string;
  };
}

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loadError, setLoadError] = useState(false);
  const { state } = useContext(ChatContext);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoadError(false);

    const unsubscribe = onSnapshot(
      doc(db, "chats", state.chatId),
      (snapshot) => {
        setMessages(snapshot.exists() ? snapshot.data()?.messages || [] : []);
      },
      (error) => {
        console.error("Error loading messages:", error);
        setLoadError(true);
      }
    );

    return () => unsubscribe();
  }, [state.chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="Messages" aria-live="polite">
      {loadError ? (
        <p className="noMessages" role="alert">
          Couldn't load messages. Check your connection and try again.
        </p>
      ) : messages.length > 0 ? (
        <>
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          <div ref={bottomRef} aria-hidden="true" />
        </>
      ) : (
        <p className="noMessages">
          No messages in this chat so far. Feel free to begin! 😄
        </p>
      )}
    </div>
  );
};

export default Messages;
