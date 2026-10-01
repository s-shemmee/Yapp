import React, { useRef, useContext, useState, useEffect, useCallback } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { arrayUnion, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { v4 as uuidv4 } from "uuid";
import { SendRounded as SendRoundedIcon,
  AttachFileRounded as AttachFileRoundedIcon,
  MicRounded as MicRoundedIcon,
  MoodRounded as MoodRoundedIcon,
  CloseRounded as CloseRoundedIcon,
  TextFieldsRounded as TextFieldsRoundedIcon,
  InsertLinkRounded as InsertLinkRoundedIcon,
 } from "@mui/icons-material";
import { IconButton, InputBase, Tooltip, Popover, Typography, Box } from "@mui/material";
import { ChatContext } from "../context/ChatContext";
import AuthContext from "../context/AuthContext";
import "./ChatInput.scss";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

interface OutgoingMessage {
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

async function uploadChatImage(file: File): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    console.error(
      "Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET"
    );
    throw new Error("CHAT_IMAGE_UPLOAD_FAILED");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "yapp-chat-images");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    throw new Error("CHAT_IMAGE_UPLOAD_FAILED");
  }

  const data = await response.json();
  return data.secure_url as string;
}

const ChatInput: React.FC = () => {
  const [text, setText] = useState<string>("");
  const [img, setImg] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [formatHelpAnchor, setFormatHelpAnchor] = useState<HTMLElement | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { state } = useContext(ChatContext);
  const currentUser = useContext(AuthContext);

  useEffect(() => {
    setText("");
    setImg(null);
    setSendError(null);
  }, [state.chatId]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSendError("Only image attachments are supported right now.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setSendError("Image must be smaller than 10MB.");
      e.target.value = "";
      return;
    }

    setSendError(null);
    setImg(file);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmedText = text.trim();
    if ((!trimmedText && !img) || sending) return;

    setSending(true);
    setSendError(null);

    const message: OutgoingMessage = {
      id: uuidv4(),
      senderId: currentUser?.uid,
      senderName: currentUser?.displayName,
      senderAvatar: currentUser?.photoURL || "",
      date: Timestamp.now(),
    };

    try {
      if (img) {
        const downloadURL = await uploadChatImage(img);
        message.message = { img: downloadURL };
      } else {
        message.message = { text: trimmedText };
      }

      await updateDoc(doc(db, "chats", state.chatId), {
        messages: arrayUnion(message),
      });

      setText("");
      setImg(null);
    } catch (error) {
      console.error("Error sending message:", error);
      if (error instanceof Error && error.message === "CHAT_IMAGE_UPLOAD_FAILED") {
        setSendError("Couldn't upload that image. Please try again.");
      } else {
        setSendError("Couldn't send that. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }, [text, img, sending, currentUser, state.chatId]);

  const handleFileIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setImg(null);
    setSendError(null);
  };

  const renderFilePreview = () => {
    if (!img) return null;
    return (
      <div className="imgPreviewContainer">
        <img
          src={URL.createObjectURL(img)}
          alt="Selected attachment preview"
          className="imgPreview"
        />
        <IconButton
          className="removeImgIcon"
          onClick={handleRemoveFile}
          aria-label="Remove attached image"
        >
          <CloseRoundedIcon aria-hidden="true" />
        </IconButton>
      </div>
    );
  };

  const handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setText((prevText) => prevText + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleEmojiPickerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="chatInput">
      {sendError && (
        <p className="sendError" role="alert">
          {sendError}
        </p>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        {renderFilePreview()}
        <InputBase
          placeholder={img ? "" : "Type a message..."}
          inputProps={{ "aria-label": "Type a message" }}
          className="inputBase"
          name="input"
          onChange={(e) => setText(e.target.value)}
          value={text}
          onKeyDown={handleEnterKey}
          multiline
          maxRows={5}
        />
      </form>

      <div className="chatIcons">
        <div className="chatOptions">
          <Tooltip title="Formatting">
            <IconButton
              className="chatIcon"
              onClick={(e) => setFormatHelpAnchor(e.currentTarget)}
              aria-label="Text formatting help"
              aria-haspopup="dialog"
              aria-expanded={Boolean(formatHelpAnchor)}
            >
              <TextFieldsRoundedIcon aria-hidden="true" />
            </IconButton>
          </Tooltip>

          <Popover
            open={Boolean(formatHelpAnchor)}
            anchorEl={formatHelpAnchor}
            onClose={() => setFormatHelpAnchor(null)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            transformOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Box className="formatHelpPopover">
              <Typography variant="subtitle2" className="formatHelpTitle">
                Formatting
              </Typography>
              <Box className="formatHelpRow">
                <code>**bold**</code>
                <strong>bold</strong>
              </Box>
              <Box className="formatHelpRow">
                <code>_italic_</code>
                <em>italic</em>
              </Box>
              <Box className="formatHelpRow">
                <code>~~strike~~</code>
                <s>strike</s>
              </Box>
              <Box className="formatHelpRow">
                <code>`code`</code>
                <code className="messageInlineCode">code</code>
              </Box>
            </Box>
          </Popover>

          <Tooltip title="Attach an image">
            <IconButton
              className="chatIcon"
              onClick={handleFileIconClick}
              aria-label="Attach an image"
            >
              <AttachFileRoundedIcon aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            id="fileInput"
            name="fileInput"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <Tooltip title="Emoji">
            <IconButton
              className="chatIcon"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              aria-label="Emoji picker"
              aria-expanded={showEmojiPicker}
            >
              <MoodRoundedIcon aria-hidden="true" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Insert link (coming soon)">
            <span>
              <IconButton className="chatIcon" disabled aria-label="Insert link (coming soon)">
                <InsertLinkRoundedIcon aria-hidden="true" />
              </IconButton>
            </span>
          </Tooltip>
        </div>

        <div className="chatSend">
          <Tooltip title="Voice message (coming soon)">
            <span>
              <IconButton className="chatIcon" disabled aria-label="Voice message (coming soon)">
                <MicRoundedIcon aria-hidden="true" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={sending ? "Sending…" : "Send"}>
            <span>
              <IconButton
                className="chatIconSend"
                onClick={handleSend}
                disabled={sending || (!text.trim() && !img)}
                aria-label={sending ? "Sending…" : "Send message"}
              >
                <SendRoundedIcon aria-hidden="true" />
              </IconButton>
            </span>
          </Tooltip>
        </div>
      </div>

      {showEmojiPicker && (
        <div
          className="emojiPickerContainer"
          role="dialog"
          aria-label="Emoji picker"
          onKeyDown={handleEmojiPickerKeyDown}
        >
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default ChatInput;
