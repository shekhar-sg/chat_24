"use client";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grow,
  Stack,
  Typography,
} from "@mui/material";
import { isCloudinaryFileUrl } from "@/lib/chat";
import DownloadIcon from "@mui/icons-material/Download";
import { forwardRef, ReactElement, Ref, useState } from "react";
import { TransitionProps } from "@mui/material/transitions";

export interface PreviewFile {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  messageId?: string;
}

interface FilePreviewDialogProps {
  conversationId: string;
  file: PreviewFile | null;
  open: boolean;
  onClose: () => void;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
};

export default function FilePreviewDialog({
  file,
  conversationId,
  open,
  onClose,
}: FilePreviewDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!file) return null;

  const trusted = isCloudinaryFileUrl(
    file.fileUrl,
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""
  );
  const isImage =
    trusted &&
    typeof file.contentType === "string" &&
    file.contentType.startsWith("image/");

  const isPdf = trusted && file.contentType === "application/pdf";

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        conversationId,
        messageId: file.messageId || "",
      });

      const response = await fetch(`/api/files/download?${params.toString()}`);

      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = file.fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullScreen
      slots={{
        transition: Transition,
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          fontSize: 15,
          fontWeight: 600,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textAlign: "center",
        }}
      >
        {file.fileName} ({formatFileSize(file.fileSize)})
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error">{error}</Alert>}
        {isImage && (
          <Box
            component="img"
            src={file.fileUrl}
            alt={file.fileName}
            sx={{
              display: "block",
              width: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
              borderRadius: 1,
            }}
          />
        )}

        {isPdf && (
          <Box
            component={"embed"}
            src={file.fileUrl}
            type={"application/pdf"}
            sx={{
              width: 1,
              height: "90vh",
            }}
          ></Box>
        )}

        {!isImage && !isPdf && (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ minHeight: 240 }}
          >
            <Typography color="text.secondary">
              Preview is not available for this file type.
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>

        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          disabled={downloading}
          onClick={handleDownload}
        >
          {downloading ? "Downloading..." : "Download"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>
) {
  return <Grow ref={ref} {...props} />;
});
