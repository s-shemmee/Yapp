import React, { useContext, useState } from "react";
import Sidebar from "../components/Sidebar";
import Chats from "../components/Chats";
import Chat from "../components/Chat";
import { AuthContext } from "../context/AuthContext";
import "./Home.scss";

const Home: React.FC = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const currentUser = useContext(AuthContext);

  const selectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const clearSelectedChat = () => {
    setSelectedChatId(null);
  };

  return (
    <div className="home">
      <Sidebar onHomeClick={clearSelectedChat} />
      <Chats onSelectChat={selectChat} selectedChatId={selectedChatId} />
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
