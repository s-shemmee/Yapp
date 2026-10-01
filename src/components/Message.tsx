import React, { useContext, useState, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { MoreHorizRounded as MoreHorizRoundedIcon,
  ReplyRounded as ReplyRoundedIcon,
  ShortcutRounded as ShortcutRoundedIcon,
  DeleteRounded as DeleteRoundedIcon,
  ContentCopyRounded as ContentCopyRoundedIcon, }
  from "@mui/icons-material";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Timestamp } from "firebase/firestore";
import "./Message.scss";
import { formatMessageText } from "../utils/formatText";

const PRIMARY = "#9474f4";
const GREY = "#5e5e5e";

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

const Message: React.FC<{ message: MessageData }> = ({ message }) => {
  const currentUser = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const open = Boolean(anchorEl);

  const isOwnMessage = message.senderId === currentUser?.uid;

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopy = useCallback(async () => {
    if (!message.message?.text) return;
    try {
      await navigator.clipboard.writeText(message.message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Copy failed:", error);
    }
    handleMenuClose();
  }, [message.message?.text]);

  const formattedTime = message.date
    .toDate()
    .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const senderLabel = isOwnMessage
    ? "Your avatar"
    : `${message.senderName ?? "User"}'s avatar`;

  return (
    <div className={`message ${isOwnMessage ? "Sender" : "Receiver"}`}>
      <div className={isOwnMessage ? "SenderInfo" : "ReceiverInfo"}>
        <Tooltip title={isOwnMessage ? "You" : message.senderName ?? "User"}>
          <img
            className={isOwnMessage ? "SenderImg" : "ReceiverImg"}
            src={message.senderAvatar}
            alt={senderLabel}
          />
        </Tooltip>
        <span className="timestamp">{formattedTime}</span>
      </div>

      <div className="messageContent">
        {message.message?.text && (
          <p className="messageText">{formatMessageText(message.message.text)}</p>
        )}
        {message.message?.img && (
          <img
            className="messageImg"
            src={message.message.img}
            alt={`Image attachment from ${isOwnMessage ? "you" : message.senderName ?? "user"}`}
          />
        )}
      </div>

      {isOwnMessage && (
        <div className="messageActions">
          <Tooltip title="More options">
            <IconButton
              onClick={handleMenuOpen}
              aria-label="Message options"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              <MoreHorizRoundedIcon sx={{ color: PRIMARY, fontSize: "20px" }} />
            </IconButton>
          </Tooltip>

          <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
            <MenuItem disabled>
              <ListItemIcon>
                <ReplyRoundedIcon sx={{ color: PRIMARY, fontSize: "20px" }} />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body2" sx={{ color: GREY, fontSize: "14px" }}>
                  Reply (coming soon)
                </Typography>
              </ListItemText>
            </MenuItem>

            <MenuItem onClick={handleCopy} disabled={!message.message?.text}>
              <ListItemIcon>
                <ContentCopyRoundedIcon sx={{ color: PRIMARY, fontSize: "20px" }} />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body2" sx={{ color: GREY, fontSize: "14px" }}>
                  {copied ? "Copied!" : "Copy"}
                </Typography>
              </ListItemText>
            </MenuItem>

            <MenuItem disabled>
              <ListItemIcon>
                <ShortcutRoundedIcon sx={{ color: PRIMARY, fontSize: "20px" }} />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body2" sx={{ color: GREY, fontSize: "14px" }}>
                  Forward (coming soon)
                </Typography>
              </ListItemText>
            </MenuItem>

            <MenuItem disabled>
              <ListItemIcon>
                <DeleteRoundedIcon sx={{ color: PRIMARY, fontSize: "20px" }} />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body2" sx={{ color: GREY, fontSize: "14px" }}>
                  Delete (coming soon)
                </Typography>
              </ListItemText>
            </MenuItem>
          </Menu>
        </div>
      )}
    </div>
  );
};

export default Message;
