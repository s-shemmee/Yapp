import React, { useContext, useEffect, useState } from "react";
import Searchbar from "../components/Searchbar";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { db } from "../firebase";
import {
  MoreHorizRounded as MoreHorizRoundedIcon,
  MarkChatUnreadRounded as MarkChatUnreadRoundedIcon,
  ArchiveRounded as ArchiveRoundedIcon,
  DeleteRounded as DeleteRoundedIcon,
} from "@mui/icons-material";
import {
  IconButton,
  Tooltip,
  Divider,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { formatDistanceStrict } from "date-fns";
import { enUS } from "date-fns/locale";
import "./Chats.scss";

const PRIMARY = "#9474f4";
const GREY = "#5e5e5e";

interface ChatEntry {
  userInfo: {
    uid: string;
    displayName: string;
    photoURL: string;
    profession: string;
  };
  date?: Timestamp;
}

type ChatDataMap = Record<string, ChatEntry>;

interface LastMessageInfo {
  text?: string;
  img?: string;
  displayDate: string;
  sortKey: number;
}

interface ChatsProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId: string | null;
}

const Chats: React.FC<ChatsProps> = ({ onSelectChat, selectedChatId }) => {
  const currentUser = useContext(AuthContext);
  const { dispatch } = useContext(ChatContext);
  const [lastMessages, setLastMessages] = useState<Record<string, LastMessageInfo>>({});
  const [chatData, setChatData] = useState<ChatDataMap>({});
  const [anchorEls, setAnchorEls] = useState<Record<string, HTMLElement | null>>({});

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    chatId: string
  ) => {

    event.stopPropagation();
    setAnchorEls((prev) => ({ ...prev, [chatId]: event.currentTarget }));
  };

  const handleMenuClose = (chatId: string) => {
    setAnchorEls((prev) => ({ ...prev, [chatId]: null }));
  };

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

  useEffect(() => {
    const unsubscribes = Object.keys(chatData).map((chatId) =>
      onSnapshot(doc(db, "chats", chatId), (snapshot) => {
        const messages = snapshot.data()?.messages || [];
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage?.date) return;

        const messageDate = lastMessage.date.toDate();
        setLastMessages((prev) => ({
          ...prev,
          [chatId]: {
            text: lastMessage.message?.text || "",
            img: lastMessage.message?.img || "",
            displayDate: formatDistanceStrict(messageDate, new Date(), {
              locale: enUS,
            }),
            sortKey: messageDate.getTime(),
          },
        }));
      })
    );

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [chatData]);

  const openChat = (chatId: string) => {
    const chat = chatData[chatId];
    if (chat?.userInfo) {
      onSelectChat(chatId);
      dispatch({ type: "CHANGE_USER", payload: { ...chat.userInfo } });
    }
  };

  const sortedChatIds = Object.keys(chatData).sort((a, b) => {
    const keyA = lastMessages[a]?.sortKey ?? -Infinity;
    const keyB = lastMessages[b]?.sortKey ?? -Infinity;
    return keyB - keyA;
  });

  return (
    <div className="chatsContainer">
      <Searchbar />
      <div className="chatsList">
        <Divider textAlign="left">
          <p className="chatTitle">Inbox</p>
        </Divider>

        <ul className="chatCards">
          {sortedChatIds.map((chatId) => {
            const { userInfo } = chatData[chatId];
            if (!userInfo) return null;

            const lastMessage = lastMessages[chatId];
            const truncatedMessage = lastMessage?.text
              ? lastMessage.text.length > 20
                ? `${lastMessage.text.slice(0, 20)}...`
                : lastMessage.text
              : lastMessage?.img
              ? "Attachment"
              : "No messages yet";

            const isSelected = selectedChatId === chatId;

            return (
              <li
                key={chatId}
                className={`chatCard${isSelected ? " selected" : ""}`}
              >
                <button
                  type="button"
                  className="chatCardMain"
                  onClick={() => openChat(chatId)}
                  aria-current={isSelected ? "true" : undefined}
                >
                  <div className="chatUserInfo">
                    <img
                      src={userInfo.photoURL}
                      alt={`${userInfo.displayName}'s avatar`}
                      className="chatUserImg"
                    />
                    <div className="chatContent">
                      <div className="chatUser">
                        <h4 className="chatUserName">{userInfo.displayName}</h4>
                        <span className="chatUserProfession">
                          {userInfo.profession || "No profession"}
                        </span>
                      </div>
                      <p className="chatLastMessage">{truncatedMessage}</p>
                    </div>
                  </div>
                </button>

                <div className="chatUserDetails">
                  <Tooltip title="More options">
                    <IconButton
                      className="button"
                      onClick={(e) => handleMenuOpen(e, chatId)}
                      aria-label="More options"
                      aria-haspopup="menu"
                      aria-expanded={Boolean(anchorEls[chatId])}
                    >
                      <MoreHorizRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  {lastMessage && (
                    <p className="timestamp">{lastMessage.displayDate}</p>
                  )}
                </div>

                <Menu
                  id={`chat-menu-${chatId}`}
                  anchorEl={anchorEls[chatId]}
                  open={Boolean(anchorEls[chatId])}
                  onClose={() => handleMenuClose(chatId)}
                >
                  <MenuItem disabled>
                    <ListItemIcon>
                      <MarkChatUnreadRoundedIcon sx={{ color: PRIMARY, fontSize: "20px" }} />
                    </ListItemIcon>
                    <ListItemText>
                      <Typography variant="body2" sx={{ color: GREY, fontSize: "14px", fontWeight: 600 }}>
                        Mark as unread (coming soon)
                      </Typography>
                    </ListItemText>
                  </MenuItem>
                  <MenuItem disabled>
                    <ListItemIcon>
                      <ArchiveRoundedIcon sx={{ color: PRIMARY, fontSize: "20px" }} />
                    </ListItemIcon>
                    <ListItemText>
                      <Typography variant="body2" sx={{ color: GREY, fontSize: "14px", fontWeight: 600 }}>
                        Archive chat (coming soon)
                      </Typography>
                    </ListItemText>
                  </MenuItem>
                  <MenuItem disabled>
                    <ListItemIcon>
                      <DeleteRoundedIcon sx={{ color: PRIMARY, fontSize: "20px" }} />
                    </ListItemIcon>
                    <ListItemText>
                      <Typography variant="body2" sx={{ color: GREY, fontSize: "14px", fontWeight: 600 }}>
                        Delete chat (coming soon)
                      </Typography>
                    </ListItemText>
                  </MenuItem>
                </Menu>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Chats;
