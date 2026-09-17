"use client";

import AttachFileIcon from "@mui/icons-material/AttachFile";
import { IconButton, Tooltip, Zoom } from "@mui/material";
import { CldUploadWidget } from "next-cloudinary";

export interface UploadedFile {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
}

interface FileUploadButtonProps {
  disabled?: boolean;
  onUpload: (file: UploadedFile) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: unknown) => void;
  onClose?: () => void;
}

interface CloudinaryUploadInfo {
  secure_url?: string;
  original_filename?: string;
  bytes?: number;
  resource_type?: string;
  format?: string;
}

interface CloudinaryUploadResult {
  info?: CloudinaryUploadInfo | string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp", "pdf"];

const getContentType = (resourceType?: string, format?: string) => {
  if (format === "pdf") {
    return "application/pdf";
  }

  if (resourceType === "image" && format) {
    return `image/${format}`;
  }

  return "application/octet-stream";
};

const FileUploadButton = ({
  disabled = false,
  onUpload,
  onUploadStart,
  onUploadError,
  onClose,
}: FileUploadButtonProps) => {
  return (
    <CldUploadWidget
      signatureEndpoint="/api/cloudinary/sign"
      options={{
        sources: ["local"],
        multiple: false,
        maxFiles: 1,
        maxFileSize: MAX_FILE_SIZE,
        clientAllowedFormats: ALLOWED_FORMATS,
        resourceType: "auto",
        folder: "chat-files",
        singleUploadAutoClose: true,
      }}
      onOpen={() => {
        onUploadStart?.();
      }}
      onSuccess={(result) => {
        const info = result.info;

        if (
          typeof info !== "object" ||
          info === null ||
          !info.secure_url ||
          !info.original_filename ||
          typeof info.bytes !== "number"
        ) {
          const error = new Error(
            "Cloudinary returned incomplete upload information."
          );

          onUploadError?.(error);

          return;
        }

        if (info.bytes > MAX_FILE_SIZE) {
          const error = new Error("File exceeds the 10 MB size limit.");

          onUploadError?.(error);

          return;
        }

        onUpload({
          fileName: info.original_filename,
          fileUrl: info.secure_url,
          fileSize: info.bytes,
          contentType: getContentType(info.resource_type, info.format),
        });
      }}
      onError={(error) => {
        onUploadError?.(error);
      }}
      onClose={onClose}
    >
      {({ open }) => (
        <Tooltip
          title="Attach file"
          followCursor
          arrow
          slots={{ transition: Zoom }}
        >
          <span>
            <IconButton
              color="primary"
              onClick={() => open()}
              disabled={disabled}
              size="small"
            >
              <AttachFileIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </CldUploadWidget>
  );
};

export default FileUploadButton;
