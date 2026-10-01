import React, { useContext, useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "../components/Sidebar";
import Chats from "../components/Chats";
import Chat from "../components/Chat";
import { AuthContext } from "../context/AuthContext";
import "./Home.scss";

type ChatView = "inbox" | "archived";

interface ChatEntry {
  userInfo: {
    uid: string;
    displayName: string;
    photoURL: string;
    profession: string;
  };
  date?: Timestamp;
  unread?: boolean;
  archived?: boolean;
}

type ChatDataMap = Record<string, ChatEntry>;

const Home: React.FC = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [view, setView] = useState<ChatView>("inbox");
  const [chatData, setChatData] = useState<ChatDataMap>({});
  const currentUser = useContext(AuthContext);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, "userChats", currentUser.uid),
      (snapshot) => {
        setChatData((snapshot.data() as ChatDataMap) || {});
      },
      (error) => {
        console.error("Error fetching user chats:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const { unreadCount, archivedCount } = useMemo(() => {
    let unread = 0;
    let archived = 0;

    for (const entry of Object.values(chatData)) {
      if (!entry?.userInfo) continue; // skip corrupted/incomplete entries
      if (entry.archived) {
        archived += 1;
      } else if (entry.unread) {
        unread += 1;
      }
    }

    return { unreadCount: unread, archivedCount: archived };
  }, [chatData]);

  const selectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const clearSelectedChat = () => {
    setSelectedChatId(null);
  };

  const handleChatDeleted = (chatId: string) => {
  if (selectedChatId === chatId) {
    setSelectedChatId(null);
  }
};

  return (
    <div className="home">
      <Sidebar
        onHomeClick={clearSelectedChat}
        view={view}
        onViewChange={setView}
        unreadCount={unreadCount}
        archivedCount={archivedCount}
      />
      <Chats
        view={view}
        chatData={chatData}
        onSelectChat={selectChat}
        selectedChatId={selectedChatId}
        onChatDeleted={handleChatDeleted}
      />
      {selectedChatId ? (
        <Chat chatId={selectedChatId} />
      ) : (
        <div className="noChatMessage">
          <h4>Hey there, {currentUser?.displayName}!</h4>
          <p>No chats yet. Click on a user chat to kick off a conversation. 😊</p>
        </div>
      )}
    </div>
  );
};

export default Home;
