"use client";

import {
  Bolt,
  Bookmarks,
  ExpandMoreRounded,
  InsertEmoticonRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Typography,
  Zoom,
  Tooltip,
} from "@mui/material";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { type KeyboardEvent, type MouseEvent, useRef, useState } from "react";
import FileUploadButton, {
  type UploadedFile,
} from "@/components/FileUpoadButton";

interface MessageInputProps {
  onSend: (message: string, file?: UploadedFile) => Promise<void>;
  disabled?: boolean;
}

const MessageInput = ({ onSend, disabled = false }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLButtonElement | null>(
    null
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const openMenu = Boolean(anchorEl);
  const openEmojiPicker = Boolean(emojiAnchorEl);

  const isBusy = disabled || uploading;

  const handleEmojiClick = (event: MouseEvent<HTMLButtonElement>) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null);
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setMessage((previous) => previous + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (isBusy) {
      return;
    }

    if (!trimmedMessage && !file) {
      return;
    }

    try {
      await onSend(trimmedMessage, file ?? undefined);

      setMessage("");
      setFile(null);

      inputRef.current?.focus();
    } catch {
      // Keep the message/file so the user can retry.
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      void handleSend();
    }
  };

  const handleMenuClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFileUpload = (uploadedFile: UploadedFile) => {
    setFile(uploadedFile);
    setUploading(false);
  };

  const handleFileUploadStart = () => {
    setUploading(true);
  };

  const handleFileUploadError = (error: unknown) => {
    console.error("Cloudinary upload failed:", error);
    setUploading(false);
  };

  const handleClose = () => {
    setUploading(false);
  }

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        px: { xs: 1, sm: 3 },
        py: 2,
        position: "sticky",
        bottom: 0,
        borderRadius: 1,
      }}
    >
      <Stack direction="column" gap={1}>
        <TextField
          fullWidth
          multiline
          maxRows={6}
          size="small"
          placeholder="Type a message..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleInputKeyDown}
          variant="standard"
          inputRef={inputRef}
          disabled={isBusy}
          sx={{
            flex: 1,
            px: 2,
            py: 1,
          }}
          slotProps={{
            input: {
              disableUnderline: true,
              sx: {
                p: 0,
                border: "none",
                boxShadow: "none",
              },
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip
                    title="Emojis"
                    followCursor
                    arrow
                    slots={{ transition: Zoom }}
                  >
                    <IconButton
                      color="primary"
                      onClick={handleEmojiClick}
                      size="small"
                      disabled={isBusy}
                    >
                      <InsertEmoticonRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Popover
                    open={openEmojiPicker}
                    anchorEl={emojiAnchorEl}
                    onClose={handleEmojiClose}
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "left",
                    }}
                  >
                    <EmojiPicker onEmojiClick={handleEmojiSelect} />
                  </Popover>
                </InputAdornment>
              ),
            },
          }}
        />

        <Stack direction="row" alignItems="center" gap={0.5}>
          <FileUploadButton
            disabled={isBusy}
            onUpload={handleFileUpload}
            onUploadStart={handleFileUploadStart}
            onUploadError={handleFileUploadError}
            onClose={handleClose}
          />

          <Tooltip
            title="Bookmarks"
            followCursor
            arrow
            slots={{ transition: Zoom }}
          >
            <IconButton color="primary" disabled={isBusy} size="small">
              <Bookmarks fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem variant="middle" />

          <Tooltip
            title="Instant reply"
            followCursor
            arrow
            slots={{ transition: Zoom }}
          >
            <IconButton color="primary" disabled={isBusy} size="small">
              <Bolt fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box flex={1} />

          <ButtonGroup
            variant="contained"
            disabled={isBusy || (!message.trim() && !file)}
            disableElevation
          >
            <Button
              onClick={() => {
                void handleSend();
              }}
            >
              {uploading ? "Uploading..." : disabled ? "Sending..." : "Send"}
            </Button>

            <Button
              size="small"
              id="basic-button"
              aria-controls={openMenu ? "basic-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={openMenu ? "true" : undefined}
              onClick={handleMenuClick}
              disabled={isBusy}
              sx={{
                minWidth: "0px !important",
                px: 1,
              }}
            >
              <ExpandMoreRounded fontSize="small" />
            </Button>
          </ButtonGroup>
          <Menu
            id={"basic-menu"}
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
            transformOrigin={{
              horizontal: "center",
              vertical: "bottom",
            }}
            anchorOrigin={{
              horizontal: "left",
              vertical: "top",
            }}
          >
            <MenuItem onClick={handleMenuClose}>Schedule</MenuItem>
            <MenuItem onClick={handleMenuClose}>Add Timer</MenuItem>
          </Menu>
        </Stack>

        {file && (
          <Stack direction="row" gap={1} mt={1} flexWrap="wrap">
            <Box
              sx={{
                bgcolor: "#f7f8fa",
                px: 2,
                py: 1,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography fontSize={13}>{file.fileName}</Typography>

              <Button
                size="small"
                color="error"
                onClick={() => setFile(null)}
                disabled={isBusy}
                sx={{
                  minWidth: 0,
                  px: 1,
                }}
              >
                x
              </Button>
            </Box>
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default MessageInput;
