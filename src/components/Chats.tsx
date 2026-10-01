import React, { useContext, useEffect, useState, useCallback } from "react";
import Searchbar from "../components/Searchbar";
import {
  doc,
  onSnapshot,
  updateDoc,
  deleteField,
  Timestamp,
} from "firebase/firestore";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import { db } from "../firebase";
import {
  MoreHorizRounded as MoreHorizRoundedIcon,
  MarkChatUnreadRounded as MarkChatUnreadRoundedIcon,
  MarkChatReadRounded as MarkChatReadRoundedIcon,
  ArchiveRounded as ArchiveRoundedIcon,
  UnarchiveRounded as UnarchiveRoundedIcon,
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
import ConfirmDialog from "./ConfirmDialog";
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
  unread?: boolean;
  archived?: boolean;
}

type ChatDataMap = Record<string, ChatEntry>;

interface LastMessageInfo {
  text?: string;
  img?: string;
  displayDate: string;
  sortKey: number;
}

interface ChatsProps {
  view: "inbox" | "archived";
  chatData: ChatDataMap;
  onSelectChat: (chatId: string) => void;
  selectedChatId: string | null;
  onChatDeleted?: (chatId: string) => void;
}

const Chats: React.FC<ChatsProps> = ({
  view,
  chatData,
  onSelectChat,
  selectedChatId,
  onChatDeleted,
}) => {
  const currentUser = useContext(AuthContext);
  const { dispatch } = useContext(ChatContext);
  const [lastMessages, setLastMessages] = useState<Record<string, LastMessageInfo>>({});
  const [anchorEls, setAnchorEls] = useState<Record<string, HTMLElement | null>>({});
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const setUnread = useCallback(
    async (chatId: string, unread: boolean) => {
      if (!currentUser) return;
      try {
        await updateDoc(doc(db, "userChats", currentUser.uid), {
          [`${chatId}.unread`]: unread,
        });
      } catch (error) {
        console.error("Failed to update unread status:", error);
      }
    },
    [currentUser]
  );

  const setArchived = useCallback(
    async (chatId: string, archived: boolean) => {
      if (!currentUser) return;
      try {
        await updateDoc(doc(db, "userChats", currentUser.uid), {
          [`${chatId}.archived`]: archived,
        });
      } catch (error) {
        console.error("Failed to update archived status:", error);
      }
    },
    [currentUser]
  );

  const openChat = (chatId: string) => {
    const chat = chatData[chatId];
    if (chat?.userInfo) {
      onSelectChat(chatId);
      dispatch({ type: "CHANGE_USER", payload: { ...chat.userInfo } });
      if (chat.unread) {
        setUnread(chatId, false);
      }
    }
  };

  const handleToggleUnread = (chatId: string) => {
    const current = chatData[chatId]?.unread ?? false;
    setUnread(chatId, !current);
    handleMenuClose(chatId);
  };

  const handleToggleArchive = (chatId: string) => {
    const current = chatData[chatId]?.archived ?? false;
    setArchived(chatId, !current);
    handleMenuClose(chatId);
  };

  const handleDeleteClick = (chatId: string) => {
    setDeleteTarget(chatId);
    handleMenuClose(chatId);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!currentUser || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await updateDoc(doc(db, "userChats", currentUser.uid), {
        [deleteTarget]: deleteField(),
      });

      onChatDeleted?.(deleteTarget);
    } catch (error) {
      console.error("Failed to delete chat:", error);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [currentUser, deleteTarget, onChatDeleted]);

  const visibleChatIds = Object.keys(chatData).filter((chatId) => {
    const entry = chatData[chatId];
    if (!entry?.userInfo) return false;
    const isArchived = entry.archived ?? false;
    return view === "archived" ? isArchived : !isArchived;
  });

  const sortedChatIds = visibleChatIds.sort((a, b) => {
    const keyA = lastMessages[a]?.sortKey ?? -Infinity;
    const keyB = lastMessages[b]?.sortKey ?? -Infinity;
    return keyB - keyA;
  });

  const deleteTargetName = deleteTarget
    ? chatData[deleteTarget]?.userInfo?.displayName ?? "this chat"
    : "";

  return (
    <div className="chatsContainer">
      <Searchbar />
      <div className="chatsList">
        <Divider textAlign="left">
          <p className="chatTitle">
            {view === "inbox" ? "Inbox" : "Archived"}
          </p>
        </Divider>

        {sortedChatIds.length === 0 && (
          <p className="emptyState">
            {view === "inbox"
              ? "No conversations yet."
              : "No archived chats."}
          </p>
        )}

        <ul className="chatCards">
          {sortedChatIds.map((chatId) => {
            const { userInfo, unread } = chatData[chatId];
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
            const isArchived = chatData[chatId]?.archived ?? false;

            return (
              <li
                key={chatId}
                className={`chatCard${isSelected ? " selected" : ""}${
                  unread ? " unread" : ""
                }`}
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
                        <h4 className="chatUserName">
                          {userInfo.displayName}
                          {unread && (
                            <span className="unreadDot" aria-label="Unread" />
                          )}
                        </h4>
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
                  <MenuItem onClick={() => handleToggleUnread(chatId)}>
                    <ListItemIcon>
                      {unread ? (
                        <MarkChatReadRoundedIcon sx={{ color: PRIMARY, fontSize: "20px" }} />
                      ) : (
                        <MarkChatUnreadRoundedIcon sx={{ color: PRIMARY, fontSize: "20px" }} />
                      )}
                    </ListItemIcon>
                    <ListItemText>
                      <Typography variant="body2" sx={{ color: GREY, fontSize: "14px", fontWeight: 600 }}>
                        {unread ? "Mark as read" : "Mark as unread"}
                      </Typography>
                    </ListItemText>
                  </MenuItem>

                  <MenuItem onClick={() => handleToggleArchive(chatId)}>
                    <ListItemIcon>
                      {isArchived ? (
                        <UnarchiveRoundedIcon sx={{ color: PRIMARY, fontSize: "20px" }} />
                      ) : (
                        <ArchiveRoundedIcon sx={{ color: PRIMARY, fontSize: "20px" }} />
                      )}
                    </ListItemIcon>
                    <ListItemText>
                      <Typography variant="body2" sx={{ color: GREY, fontSize: "14px", fontWeight: 600 }}>
                        {isArchived ? "Unarchive chat" : "Archive chat"}
                      </Typography>
                    </ListItemText>
                  </MenuItem>

                  <MenuItem onClick={() => handleDeleteClick(chatId)}>
                    <ListItemIcon>
                      <DeleteRoundedIcon sx={{ color: "#d32f2f", fontSize: "20px" }} />
                    </ListItemIcon>
                    <ListItemText>
                      <Typography variant="body2" sx={{ color: GREY, fontSize: "14px", fontWeight: 600 }}>
                        Delete chat
                      </Typography>
                    </ListItemText>
                  </MenuItem>
                </Menu>
              </li>
            );
          })}
        </ul>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this chat?"
        description={`This removes your conversation with ${deleteTargetName} from your inbox. This can't be undone.`}
        confirmLabel={isDeleting ? "Deleting…" : "Delete"}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default Chats;
