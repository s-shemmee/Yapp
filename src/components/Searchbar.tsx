import React, { useCallback, useId, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { IconButton, Tooltip } from "@mui/material";
import {
  SearchRounded as SearchRoundedIcon,
  WavingHandRounded as WavingHandRoundedIcon,
  CloseRounded as CloseRoundedIcon,
} from "@mui/icons-material";
import "./Searchbar.scss";

interface UserData {
  uid: string;
  avatarURL: string;
  displayName: string;
  profession: string;
}

const Searchbar: React.FC = () => {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentUser = React.useContext(AuthContext);
  const searchInputId = useId();

  const handleSearch = useCallback(async () => {
    const trimmed = username.trim();
    if (!trimmed || loading) return;

    try {
      setLoading(true);
      setError(false);

      const q = query(collection(db, "users"), where("displayName", "==", trimmed));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError(true);
        setUser(null);
      } else {
        setUser(querySnapshot.docs[0].data() as UserData);
      }
    } catch (err) {
      console.error("Error searching for user:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [username, loading]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSearch();
    },
    [handleSearch]
  );

  const handleSelect = useCallback(async () => {
    if (!currentUser || !user || currentUser.uid === user.uid) {
      return;
    }

    const combinedId =
      currentUser.uid > user.uid
        ? `${currentUser.uid}${user.uid}`
        : `${user.uid}${currentUser.uid}`;

    setSelectError(null);

    try {
      const currentUserChatsSnap = await getDoc(doc(db, "userChats", currentUser.uid));
      const alreadyExists =
        currentUserChatsSnap.exists() && combinedId in (currentUserChatsSnap.data() || {});

      if (!alreadyExists) {
        await setDoc(doc(db, "chats", combinedId), { messages: [], createdAt: serverTimestamp() });

        await updateDoc(doc(db, "userChats", currentUser.uid), {
          [`${combinedId}.userInfo`]: {
            uid: user.uid,
            displayName: user.displayName,
            photoURL: user.avatarURL,
            profession: user.profession,
          },
          [`${combinedId}.date`]: serverTimestamp(),
        });

        const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
        const currentUserProfession = currentUserDoc.data()?.profession || "";

        await updateDoc(doc(db, "userChats", user.uid), {
          [`${combinedId}.userInfo`]: {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            profession: currentUserProfession,
          },
          [`${combinedId}.date`]: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Error handling selection:", err);
      setSelectError("Couldn't start this chat. Please try again.");
    } finally {
      setUser(null);
      setUsername("");
    }
  }, [currentUser, user]);

  const clearResult = useCallback(() => {
    setUser(null);
    setError(false);
  }, []);

  const canSayHi = currentUser?.uid !== user?.uid;

  return (
    <div className="searchbar">
      <form
        className="searchForm"
        role="search"
        onSubmit={handleSubmit}
        aria-label="Search for a user"
      >
        <label htmlFor={searchInputId} className="visuallyHidden">
          Search for a user by name
        </label>
        <input
          id={searchInputId}
          type="text"
          placeholder="Search for a user..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
        />
        <Tooltip title="Search">
          <span>
            <IconButton
              type="submit"
              disabled={loading || !username.trim()}
              aria-label="Search"
            >
              <SearchRoundedIcon className="searchIcon" aria-hidden="true" />
            </IconButton>
          </span>
        </Tooltip>
      </form>

      {loading && (
        <p className="searchStatus" role="status" aria-live="polite">
          Searching…
        </p>
      )}

      {error && !loading && (
        <p className="error-message" role="alert">
          User not found
        </p>
      )}

      {selectError && (
        <p className="error-message" role="alert">
          {selectError}
        </p>
      )}

      {user && !loading && (
        <div className="searchResult">
          <div className="searchResultUser">
            <img
              src={user.avatarURL}
              alt={`${user.displayName}'s avatar`}
              className="searchResultUserImg"
            />
            <div className="searchResultUserInfo">
              <h4 className="searchResultUserName">{user.displayName}</h4>
              <p className="searchResultUserProfession">
                {user.profession || "No profession"}
              </p>
            </div>
            <div className="searchResultbuttons">
              {canSayHi && (
                <Tooltip title="Say Hi!">
                  <IconButton onClick={handleSelect} aria-label={`Say hi to ${user.displayName}`}>
                    <WavingHandRoundedIcon className="searchResultbutton" aria-hidden="true" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Remove">
                <IconButton onClick={clearResult} aria-label="Remove search result">
                  <CloseRoundedIcon className="searchResultbutton" aria-hidden="true" />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Searchbar;
