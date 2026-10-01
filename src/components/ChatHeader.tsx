import React, { useState, useContext, useEffect, useCallback } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { ChatContext } from "../context/ChatContext";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import NotificationsOffRoundedIcon from "@mui/icons-material/NotificationsOffRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import BlockRounded from "@mui/icons-material/BlockRounded";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { formatDistanceToNow, format } from "date-fns";
import "./ChatHeader.scss";

const PRIMARY = "#9474f4";
const GREY = "#5e5e5e";

const ChatHeader: React.FC = () => {
  const { state } = useContext(ChatContext);
  const [chatCreationTime, setChatCreationTime] = useState<string | null>(null);
  const [lastSeenStatus, setLastSeenStatus] = useState<
    "loading" | "online" | "offline"
  >("loading");
  const [lastSeenText, setLastSeenText] = useState("Loading…");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const fetchLastSignInTime = useCallback(async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", state.user.uid));
      const data = userDoc.data();
      const isOnline = Boolean(data?.online);
      const lastSignInTime = data?.userMetadata?.lastSignInTime;

      if (isOnline) {
        setLastSeenStatus("online");
        setLastSeenText("Online");
        return;
      }

      setLastSeenStatus("offline");
      if (lastSignInTime) {
        const distance = formatDistanceToNow(new Date(lastSignInTime), {
          addSuffix: true,
        });
        setLastSeenText(`Offline · Last seen ${distance}`);
      } else {
        setLastSeenText("Offline");
      }
    } catch (error) {
      console.error("Error fetching lastSignInTime:", error);
      setLastSeenStatus("offline");
      setLastSeenText("Status unavailable");
    }
  }, [state.user.uid]);

  const fetchChatCreationTime = useCallback(async () => {
    try {
      const chatDoc = await getDoc(doc(db, "chats", state.chatId));
      const createdAt = chatDoc.exists() ? chatDoc.data()?.createdAt : null;

      if (createdAt) {
        return format(createdAt.toDate(), "MMMM d, yyyy h:mm a");
      }
      return null;
    } catch (error) {
      console.error("Error fetching chat creation time:", error);
      return null;
    }
  }, [state.chatId]);

  useEffect(() => {
    setLastSeenStatus("loading");
    setLastSeenText("Loading…");
    setChatCreationTime(null);

    fetchLastSignInTime();
    fetchChatCreationTime().then((time) => {
      if (time) setChatCreationTime(time);
    });
  }, [fetchLastSignInTime, fetchChatCreationTime]);

  const infoTooltip = chatCreationTime
    ? `Chat started ${chatCreationTime}`
    : "Loading chat info…";

  return (
    <div className="chatHeader">
      <div className="chatUser">
        <img
          src={state.user.photoURL}
          alt={`${state.user.displayName}'s profile picture`}
          className="chatImg"
          {...(lastSeenStatus !== "loading" && {
            "data-online": lastSeenStatus === "online",
          })}
        />
        <div className="chatInfo">
          <h4 className="chatName">{state.user.displayName}</h4>
          <p className="chatStatus">{lastSeenText}</p>
        </div>
      </div>

      <div className="chatActions">
        <Tooltip title="Report (coming soon)">
          <span>
            <IconButton disabled aria-label="Report (coming soon)">
              <FlagOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={infoTooltip}>
          <IconButton aria-label={infoTooltip}>
            <InfoOutlinedIcon className="infoIcon" />
          </IconButton>
        </Tooltip>

        <Tooltip title="More options">
          <IconButton
            onClick={handleMenuOpen}
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={open ? "chat-header-menu" : undefined}
          >
            <MoreVertOutlinedIcon />
          </IconButton>
        </Tooltip>

        <Menu
          id="chat-header-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
        >
          <MenuItem disabled>
            <ListItemIcon>
              <NotificationsOffRoundedIcon sx={{ color: PRIMARY, fontSize: "20px" }} />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2" sx={{ color: GREY, fontSize: "14px", fontWeight: 600 }}>
                Notifications (coming soon)
              </Typography>
            </ListItemText>
          </MenuItem>
          <MenuItem disabled>
            <ListItemIcon>
              <ArchiveRoundedIcon sx={{ color: PRIMARY, fontSize: "20px" }} />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2" sx={{ color: GREY, fontSize: "14px", fontWeight: 600 }}>
                Archive (coming soon)
              </Typography>
            </ListItemText>
          </MenuItem>
          <MenuItem disabled>
            <ListItemIcon>
              <BlockRounded sx={{ color: PRIMARY, fontSize: "20px" }} />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2" sx={{ color: GREY, fontSize: "14px", fontWeight: 600 }}>
                Block (coming soon)
              </Typography>
            </ListItemText>
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
};

export default ChatHeader;
