"use client";

import { isCloudinaryFileUrl } from "@/lib/chat";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import { Box, Typography } from "@mui/material";
import type { PreviewFile } from "./FilePreviewDialog";

interface MessageBubbleProps {
  message?: string;
  time: string;
  isMe: boolean;
  file?: PreviewFile;
  seen?: boolean;
  onFileClick?: (file: PreviewFile) => void;
}

interface MessageMetaProps {
  time: string;
  isMe: boolean;
  seen: boolean;
  overlay?: boolean;
}

const MessageMeta = ({
  time,
  isMe,
  seen,
  overlay = false,
}: MessageMetaProps) => {
  if (!time) return null;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 0.25,
        flexShrink: 0,
        px: overlay ? 0.55 : 0,
        py: overlay ? 0.3 : 0,
        borderRadius: overlay ? 1.25 : 0,
        bgcolor: overlay ? "rgba(0, 0, 0, 0.46)" : "transparent",
        backdropFilter: overlay ? "blur(5px)" : "none",
        color: overlay
          ? "rgba(255,255,255,0.88)"
          : isMe
            ? "rgba(255,255,255,0.64)"
            : "text.secondary",
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: 10,
          lineHeight: 1.2,
          fontWeight: 500,
          whiteSpace: "nowrap",
          letterSpacing: 0.05,
        }}
      >
        {time}
      </Typography>

      {isMe && (
        <DoneAllRoundedIcon
          sx={{
            fontSize: 14,
            lineHeight: 1,
            color: seen ? "info.main" : "rgba(255,255,255,0.58)",
          }}
        />
      )}
    </Box>
  );
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MessageBubble = ({
  message = "",
  time,
  isMe,
  file,
  seen = false,
  onFileClick,
}: MessageBubbleProps) => {
  const text = message.trim();

  const isEmoji = !file && text.length > 0 && /^\p{Emoji}+$/u.test(text);
  const isSingleEmoji = isEmoji && [...text].length === 1;
  const isImage =
    Boolean(
      file &&
        isCloudinaryFileUrl(
          file.fileUrl,
          process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""
        )
    ) &&
    typeof file?.contentType === "string" &&
    file.contentType.startsWith("image/");
  const isPdf = file?.contentType === "application/pdf";

  if (isEmoji) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: isMe ? "flex-end" : "flex-start",
          px: { xs: 1, sm: 2 },
          mb: 0.75,
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "inline-flex",
            alignItems: "flex-end",
            maxWidth: "85%",
            minWidth: isSingleEmoji ? 72 : 96,
            minHeight: isSingleEmoji ? 72 : 46,
            pb: 0.5,
          }}
        >
          <Typography
            component="div"
            sx={{
              fontSize: isSingleEmoji ? 64 : 30,
              lineHeight: 1.15,
              letterSpacing: isSingleEmoji ? 0 : 1,
              px: isSingleEmoji ? 0 : 1,
              py: isSingleEmoji ? 0 : 0.25,
            }}
          >
            {text}
          </Typography>

          <Box sx={{ position: "absolute", right: 0, bottom: 0 }}>
            <MessageMeta time={time} isMe={isMe} seen={seen} overlay />
          </Box>
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
        mb: 0.65,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "fit-content",
          maxWidth: { xs: "85%", sm: "70%" },
          minWidth: 52,
          borderRadius: isMe ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
          bgcolor: isMe ? "success.main" : "background.paper",
          color: isMe ? "secondary.contrastText" : "text.primary",
          border: "1px solid",
          borderColor: isMe ? "success.main" : "grey.300",
          boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
          overflow: "hidden",
        }}
      >
        {file && isImage && (
          <Box
            role="button"
            tabIndex={0}
            aria-label={`Preview ${file.fileName}`}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onFileClick?.(file);
              }
            }}
            onClick={() => onFileClick?.(file)}
            sx={{
              position: "relative",
              cursor: "pointer",
              lineHeight: 0,
              overflow: "hidden",
              "&:hover img": { transform: "scale(1.01)" },
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
                maxWidth: 420,
                maxHeight: 460,
                minWidth: { xs: 180, sm: 220 },
                objectFit: "cover",
                transition: "transform 180ms ease",
              }}
            />

            <Box sx={{ position: "absolute", right: 7, bottom: 7 }}>
              <MessageMeta time={time} isMe={isMe} seen={seen} overlay />
            </Box>
          </Box>
        )}

        {file && !isImage && (
          <Box
            role="button"
            tabIndex={0}
            aria-label={`Preview ${file.fileName}`}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onFileClick?.(file);
              }
            }}
            onClick={() => onFileClick?.(file)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              minWidth: { xs: 230, sm: 280 },
              px: 1.25,
              pt: 1.25,
              pb: 0.7,
              cursor: "pointer",
              "&:hover": { bgcolor: "rgba(255,255,255,0.035)" },
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                borderRadius: 1.5,
                bgcolor: isMe ? "rgba(255,255,255,0.16)" : "action.hover",
              }}
            >
              {isPdf ? (
                <PictureAsPdfRoundedIcon sx={{ fontSize: 24 }} />
              ) : (
                <InsertDriveFileRoundedIcon sx={{ fontSize: 24 }} />
              )}
            </Box>

            <Box sx={{ minWidth: 0, flex: 1, pr: 0.5 }}>
              <Typography
                variant="body2"
                noWrap
                title={file.fileName}
                sx={{ fontWeight: 500, fontSize: 13.5, lineHeight: 1.35 }}
              >
                {file.fileName}
              </Typography>

              <Typography
                variant="caption"
                sx={{ display: "block", mt: 0.35, fontSize: 11, opacity: 0.62 }}
              >
                {formatFileSize(file.fileSize)}
              </Typography>
            </Box>
          </Box>
        )}

        {text && (
          <Box sx={{ px: 1.3, pt: 0.85, pb: 0.15 }}>
            <Typography
              component="div"
              sx={{
                fontSize: 14.5,
                lineHeight: 1.45,
                overflowWrap: "anywhere",
                whiteSpace: "pre-wrap",
              }}
            >
              {text}
            </Typography>
          </Box>
        )}

        {!isImage && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              px: 1.25,
              pb: 0.7,
              pt: text ? 0.35 : 0.15,
            }}
          >
            <MessageMeta time={time} isMe={isMe} seen={seen} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessageBubble;
