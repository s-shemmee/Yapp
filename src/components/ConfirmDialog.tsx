import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
} from "@mui/material";
import {
  WarningRounded as WarningRoundedIcon,
  CloseRounded as CloseRoundedIcon,
} from "@mui/icons-material";

const PRIMARY = "#9474f4";
const PRIMARY_DARK = "#7c5cd4";
const DESTRUCTIVE = "#d32f2f";
const DESTRUCTIVE_DARK = "#b71c1c";
const GREY = "#5e5e5e";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  const accentColor = destructive ? DESTRUCTIVE : PRIMARY;
  const accentColorDark = destructive ? DESTRUCTIVE_DARK : PRIMARY_DARK;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      slotProps={{
        paper: {
          sx: {
            borderRadius: "20px",
            padding: "8px",
            minWidth: { xs: "90%", sm: "400px" },
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
          },
        },
        backdrop: {
          sx: {
            backgroundColor: "rgba(20, 15, 35, 0.4)",
            backdropFilter: "blur(2px)",
          },
        },
      }}
    >
      <IconButton
        onClick={onCancel}
        aria-label="Close dialog"
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          color: GREY,
          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
        }}
      >
        <CloseRoundedIcon sx={{ fontSize: "20px" }} />
      </IconButton>

      <DialogTitle
        id="confirm-dialog-title"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          paddingTop: "24px",
          paddingRight: "40px",
          fontSize: "1.1rem",
          fontWeight: 700,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            flexShrink: 0,
            borderRadius: "50%",
            backgroundColor: destructive
              ? "rgba(211, 47, 47, 0.1)"
              : "rgba(148, 116, 244, 0.12)",
            color: accentColor,
          }}
        >
          <WarningRoundedIcon sx={{ fontSize: "22px" }} />
        </span>
        {title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          id="confirm-dialog-description"
          sx={{ color: GREY, fontSize: "0.9rem", lineHeight: 1.6 }}
        >
          {description}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ padding: "16px 24px 20px", gap: "8px" }}>
        <Button
          onClick={onCancel}
          autoFocus
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            color: GREY,
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disableElevation
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: accentColor,
            "&:hover": { backgroundColor: accentColorDark },
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
