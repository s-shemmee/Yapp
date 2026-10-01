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
import { IconButton, Tooltip } from "@mui/material";
import "./Sidebar.scss";

interface SidebarProps {
  onHomeClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onHomeClick }) => {
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
    onHomeClick();
  }, [onHomeClick]);

  return (
    <nav className="sidebar" aria-label={`${APP_NAME} navigation`}>
      <div className="logo">
        <img src={logo} alt={`${APP_NAME} logo`} />
      </div>

      <div className="sidebarMenu">
        <Tooltip title="Home">
          <IconButton onClick={handleClickHome} aria-label="Home">
            <HomeRoundedIcon className="sidebarIcon" aria-hidden="true" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Archive (coming soon)">
          <span>
            <IconButton disabled aria-label="Archive (coming soon)">
              <ArchiveRoundedIcon className="sidebarIcon" aria-hidden="true" />
            </IconButton>
          </span>
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
