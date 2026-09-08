"use client";

import {
  Bolt,
  Bookmarks,
  ExpandMoreRounded,
  InsertEmoticonRounded,
} from "@mui/icons-material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Zoom,
} from "@mui/material";
import ButtonGroup from "@mui/material/ButtonGroup";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  useRef,
  useState,
} from "react";

interface MessageInputProps {
  onSend: (msg: string) => Promise<void>;
  disabled?: boolean;
}

const MessageInput = ({ onSend, disabled = false }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const openMenu = Boolean(anchorEl);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLButtonElement | null>(
    null
  );

  const handleEmojiClick = (event: MouseEvent<HTMLButtonElement>) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null);
  };

  const open = Boolean(emojiAnchorEl);

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || disabled) {
      return;
    }

    try {
      await onSend(trimmedMessage);
      setMessage("");
      setFiles([]);
      inputRef.current?.focus();
    } catch {
      // Keep the message in the input so the user can retry.
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };
  const handleClick = (event: MouseEvent<HTMLButtonElement>) =>
    setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };
  const handleAttachClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  const handleRemoveFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

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
          size={"small"}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleInputKeyDown}
          variant={"standard"}
          inputRef={inputRef}
          sx={{
            flex: 1,
            px: 2,
            py: 1,
          }}
          slotProps={{
            input: {
              disableUnderline: true,
              sx: { p: 0, border: "none", boxShadow: "none" },
              endAdornment: (
                <InputAdornment position={"end"}>
                  <Tooltip
                    title={"Emojis"}
                    followCursor
                    arrow
                    slots={{ transition: Zoom }}
                  >
                    <IconButton
                      color={"primary"}
                      onClick={handleEmojiClick}
                      size={"small"}
                    >
                      <InsertEmoticonRounded fontSize={"small"} />
                    </IconButton>
                  </Tooltip>
                  <Popover
                    open={open}
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
          <Tooltip
            title={"Attach files"}
            followCursor
            arrow
            slots={{ transition: Zoom }}
          >
            <IconButton
              color={"primary"}
              onClick={handleAttachClick}
              disabled={disabled}
              size="small"
            >
              <AttachFileIcon fontSize={"small"} />
            </IconButton>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={handleFileChange}
          />
          <Tooltip
            title={"Bookmarks"}
            followCursor
            arrow
            slots={{ transition: Zoom }}
          >
            <IconButton color="primary" disabled={disabled} size="small">
              <Bookmarks fontSize={"small"} />
            </IconButton>
          </Tooltip>
          <Divider orientation={"vertical"} flexItem variant={"middle"} />
          <Tooltip
            title={"Instant reply"}
            followCursor
            arrow
            slots={{ transition: Zoom }}
          >
            <IconButton color="primary" disabled={disabled} size="small">
              <Bolt fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box flex={1} />
          <ButtonGroup
            variant="contained"
            disabled={disabled || !message.trim()}
            disableElevation
          >
            <Button
              onClick={() => {
                void handleSend();
              }}
            >
              {disabled ? "Sending..." : "Send"}
            </Button>

            <Button
              size="small"
              id="basic-button"
              aria-controls={openMenu ? "basic-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={openMenu ? "true" : undefined}
              onClick={handleClick}
              disabled={disabled}
              sx={{
                minWidth: "0px !important",
                px: 1,
              }}
            >
              <ExpandMoreRounded fontSize={"small"} />
            </Button>
          </ButtonGroup>
          <Menu
            id={"basic-menu"}
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleClose}
            transformOrigin={{ horizontal: "center", vertical: "bottom" }}
            anchorOrigin={{ horizontal: "left", vertical: "top" }}
          >
            <MenuItem onClick={handleClose}>Schedule</MenuItem>
            <MenuItem onClick={handleClose}>Add Timer</MenuItem>
          </Menu>
        </Stack>
        {files.length > 0 && (
          <Stack direction="row" gap={1} mt={1} flexWrap="wrap">
            {files.map((file, idx) => (
              <Box
                key={`${file.name}-${idx}`}
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
                <Typography fontSize={13}>{file.name}</Typography>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleRemoveFile(idx)}
                  disabled={disabled}
                  sx={{ minWidth: 0, px: 1 }}
                >
                  x
                </Button>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default MessageInput;
