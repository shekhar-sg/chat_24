"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  Grow,
  Slide,
  Stack,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { forwardRef, ReactElement, Ref } from "react";
import { TransitionProps } from "@mui/material/transitions";

export interface PreviewFile {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
}

interface FilePreviewDialogProps {
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
  open,
  onClose,
}: FilePreviewDialogProps) {
  if (!file) return null;

  const isImage =
    typeof file.contentType === "string" &&
    file.contentType.startsWith("image/");

  const isPdf = file.contentType === "application/pdf";

  const handleDownload = async () => {
    try {
      const params = new URLSearchParams({
        url: file.fileUrl,
        fileName: file.fileName,
      });

      const response = await fetch(`/api/files/download?${params.toString()}`);

      console.log("Download response:", {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorBody = await response.text();

        console.error("Download API error:", errorBody);

        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`
        );
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = file.fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
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
        {file.fileName}
      </DialogTitle>

      <DialogContent dividers>
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
          onClick={handleDownload}
        >
          Download
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
