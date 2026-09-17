"use client";

import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import { Box, Typography } from "@mui/material";
import type { PreviewFile } from "./FilePreviewDialog";

interface MessageBubbleProps {
  message?: string;
  time: string;
  isMe: boolean;
  file?: PreviewFile;
  onFileClick?: (file: PreviewFile) => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MessageBubble = ({
  message = "",
  time,
  isMe,
  file,
  onFileClick,
}: MessageBubbleProps) => {
  const text = message.trim();

  const isEmoji = !file && text.length > 0 && /^\p{Emoji}+$/u.test(text);

  const isSingleEmoji = isEmoji && [...text].length === 1;

  const isImage =
    typeof file?.contentType === "string" &&
    file.contentType.startsWith("image/");

  const isPdf = file?.contentType === "application/pdf";

  /*
   * Emoji-only messages
   */
  if (isEmoji) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: isMe ? "flex-end" : "flex-start",
          px: { xs: 1, sm: 2 },
          mb: 0.5,
        }}
      >
        <Box
          sx={{
            textAlign: isMe ? "right" : "left",
          }}
        >
          <Typography
            component="div"
            sx={{
              fontSize: isSingleEmoji ? 120 : 30,
              lineHeight: 1.2,
            }}
          >
            {text}
          </Typography>

          {time && (
            <Typography
              component="span"
              sx={{
                display: "block",
                mt: 0.25,
                fontSize: 10,
                color: "text.secondary",
                opacity: 0.55,
              }}
            >
              {time}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isMe ? "flex-end" : "flex-start",
        px: { xs: 1, sm: 2 },
        mb: 0.5,
      }}
    >
      <Box
        sx={{
          position: "relative",
          maxWidth: {
            xs: "85%",
            sm: "70%",
          },

          /*
           * WhatsApp-like bubble shape
           */
          borderRadius: isMe ? "8px 8px 2px 8px" : "8px 8px 8px 2px",

          bgcolor: isMe ? "secondary.main" : "background.paper",

          color: isMe ? "secondary.contrastText" : "text.primary",

          /*
           * Very subtle separation instead of cards/shadows
           */
          boxShadow: "0 1px 1px rgba(0, 0, 0, 0.08)",

          overflow: "hidden",
        }}
      >
        {/* IMAGE MESSAGE */}
        {file && isImage && (
          <Box
            onClick={() => onFileClick?.(file)}
            sx={{
              position: "relative",
              cursor: "pointer",
            }}
          >
            <Box
              component="img"
              src={file.fileUrl}
              alt={file.fileName}
              loading="lazy"
              sx={{
                display: "block",
                width: "100%",
                maxWidth: 380,
                maxHeight: 420,
                minWidth: 220,
                objectFit: "cover",
              }}
            />

            {/* Image footer */}
            {time && (
              <Box
                sx={{
                  position: "absolute",
                  right: 8,
                  bottom: 7,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 4,
                  bgcolor: "rgba(0,0,0,0.45)",
                  color: "#fff",
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontSize: 10,
                    lineHeight: 1,
                  }}
                >
                  {time}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* FILE MESSAGE */}
        {file && !isImage && (
          <Box
            onClick={() => onFileClick?.(file)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              minWidth: 250,
              px: 1.25,
              py: 1,
              cursor: "pointer",
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: 1,
                bgcolor: isMe ? "rgba(255,255,255,0.14)" : "action.hover",
              }}
            >
              {isPdf ? (
                <PictureAsPdfRoundedIcon />
              ) : (
                <InsertDriveFileRoundedIcon />
              )}
            </Box>

            <Box
              sx={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <Typography
                variant="body2"
                noWrap
                sx={{
                  fontWeight: 500,
                }}
              >
                {file.fileName}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  opacity: 0.6,
                }}
              >
                {formatFileSize(file.fileSize)}
              </Typography>
            </Box>

            {time && (
              <Typography
                component="span"
                sx={{
                  alignSelf: "flex-end",
                  fontSize: 10,
                  opacity: 0.6,
                  whiteSpace: "nowrap",
                }}
              >
                {time}
              </Typography>
            )}
          </Box>
        )}

        {/* TEXT */}
        {text && (
          <Typography
            sx={{
              px: 1.25,
              pt: file ? 0.25 : 0.75,
              pb: 0.75,
              fontSize: 14.5,
              lineHeight: 1.45,
              overflowWrap: "anywhere",
            }}
          >
            {text}

            {/* Timestamp sits naturally beside short text */}
            {time && (
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  width: 52,
                  height: 1,
                }}
              />
            )}
          </Typography>
        )}

        {/* Timestamp for text */}
        {text && time && (
          <Typography
            component="span"
            sx={{
              position: "absolute",
              right: 7,
              bottom: 5,
              fontSize: 10,
              lineHeight: 1,
              opacity: 0.55,
              whiteSpace: "nowrap",
            }}
          >
            {time}
          </Typography>
        )}

        {/* Timestamp when file has no separate timestamp */}
        {!text && file && !isImage && null}
      </Box>
    </Box>
  );
};

export default MessageBubble;
