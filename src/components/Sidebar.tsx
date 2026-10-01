import React, { useCallback, useState } from "react";
import logo from "../assets/logo.png";
import { APP_NAME } from "../constants";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  HomeRounded as HomeRoundedIcon,
  ArchiveRounded as ArchiveRoundedIcon,
  SettingsRounded as SettingsRoundedIcon,
  LogoutRounded as LogoutRoundedIcon,
} from "@mui/icons-material";
import { IconButton, Tooltip, Badge } from "@mui/material";
import "./Sidebar.scss";

type ChatView = "inbox" | "archived";

interface SidebarProps {
  onHomeClick: () => void;
  view: ChatView;
  onViewChange: (view: ChatView) => void;
  unreadCount: number;
  archivedCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  onHomeClick,
  view,
  onViewChange,
  unreadCount,
  archivedCount,
}) => {
  const currentUser = React.useContext(AuthContext);
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setLogoutError(null);

    try {
      setIsLoggingOut(true);

      if (currentUser?.uid) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          online: false,
        });
      }

      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", (error as Error).message || error);
      setLogoutError("Couldn't log out. Please try again.");
      setIsLoggingOut(false);
    }
  }, [currentUser, isLoggingOut, navigate]);

  const handleClickHome = useCallback(() => {
    onViewChange("inbox");
    onHomeClick();
  }, [onHomeClick, onViewChange]);

  const handleClickArchive = useCallback(() => {
    onViewChange("archived");
  }, [onViewChange]);

  return (
    <nav className="sidebar" aria-label={`${APP_NAME} navigation`}>
      <div className="logo">
        <img src={logo} alt={`${APP_NAME} logo`} />
      </div>

      <div className="sidebarMenu">
        <Tooltip
          title={unreadCount > 0 ? `Home (${unreadCount} unread)` : "Home"}
        >
          <IconButton
            onClick={handleClickHome}
            aria-label={
              unreadCount > 0 ? `Home, ${unreadCount} unread chats` : "Home"
            }
            aria-pressed={view === "inbox"}
            className={view === "inbox" ? "active" : ""}
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              max={99}
              invisible={unreadCount === 0}
            >
              <HomeRoundedIcon className="sidebarIcon" aria-hidden="true" />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip
          title={
            archivedCount > 0
              ? `Archived chats (${archivedCount})`
              : "Archived chats"
          }
        >
          <IconButton
            onClick={handleClickArchive}
            aria-label={
              archivedCount > 0
                ? `Archived chats, ${archivedCount} total`
                : "Archived chats"
            }
            aria-pressed={view === "archived"}
            className={view === "archived" ? "active" : ""}
          >
          <Badge
            badgeContent={archivedCount}
            max={99}
            invisible={archivedCount === 0}
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "#70747D",
                color: "#fff",
              },
            }}
          >
            <ArchiveRoundedIcon className="sidebarIcon" aria-hidden="true" />
          </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="Settings (coming soon)">
          <span>
            <IconButton disabled aria-label="Settings (coming soon)">
              <SettingsRoundedIcon className="sidebarIcon" aria-hidden="true" />
            </IconButton>
          </span>
        </Tooltip>
      </div>

      <div className="sidebarUser">
        {currentUser?.photoURL && (
          <Tooltip title={currentUser.displayName || "You"}>
            <img
              src={currentUser.photoURL}
              alt={`${currentUser.displayName || "Your"} avatar`}
              className="userImg"
            />
          </Tooltip>
        )}

        <Tooltip title="Log out">
          <span>
            <IconButton
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label={isLoggingOut ? "Logging out…" : "Log out"}
            >
              <LogoutRoundedIcon className="userSignOut" aria-hidden="true" />
            </IconButton>
          </span>
        </Tooltip>

        {logoutError && (
          <span className="visuallyHidden" role="alert">
            {logoutError}
          </span>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;
