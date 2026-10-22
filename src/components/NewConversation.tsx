"use client";

import { Close, PersonAdd, Search } from "@mui/icons-material";
import {
  Alert,
  Button,
  Avatar,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useDebounce } from "@/hooks/useDebounce";
import { getOrCreateDirectConversation } from "@/lib/firebase/firestore/conversations";
import { useGetUsersQuery } from "@/store/api/usersApi";
import { useAppSelector } from "@/store/hooks";

interface NewConversationProps {
  open: boolean;
  onClose: () => void;
}

const SEARCH_DEBOUNCE_MS = 300;

const NewConversation = ({ open, onClose }: NewConversationProps) => {
  const router = useRouter();

  const currentUserId = useAppSelector((state) => state.auth.user?.uid);

  const [pageSize, setPageSize] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [creatingConversation, setCreatingConversation] = useState<
    string | null
  >(null);

  const { data, refetch, isFetching, isLoading, isError } = useGetUsersQuery(
    { excludedUserId: currentUserId || "", pageSize },
    {
      skip: !open || !currentUserId,
    }
  );

  const users = useMemo(() => data?.users ?? [], [data]);
  const debouncedSearch = useDebounce(
    search.trim().toLowerCase(),
    SEARCH_DEBOUNCE_MS
  );

  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) {
      return users;
    }

    return users.filter((user) => {
      const name = user.displayName?.toLowerCase() ?? "";

      const email = user.email?.toLowerCase() ?? "";

      return name.includes(debouncedSearch) || email.includes(debouncedSearch);
    });
  }, [users, debouncedSearch]);

  const handleClose = () => {
    if (creatingConversation) {
      return;
    }

    setSearch("");
    setError(null);
    setPageSize(30);
    setCreatingConversation(null);
    onClose();
  };

  const handleSelectUser = async (userId: string) => {
    if (!currentUserId || creatingConversation) {
      return;
    }

    setError(null);
    setCreatingConversation(userId);

    try {
      const conversationId = await getOrCreateDirectConversation(
        currentUserId,
        userId
      );

      onClose();
      router.push(`/conversation/${conversationId}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      setError("Unable to start this conversation. Please try again.");

      setCreatingConversation(null);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <PersonAdd fontSize="small" />

          <Typography component="span" fontWeight={600}>
            New Conversation
          </Typography>
        </Box>

        <IconButton
          onClick={handleClose}
          disabled={Boolean(creatingConversation)}
          size="small"
          aria-label="Close"
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: "background.default",
            borderRadius: 2,
            px: 2,
            py: 0.75,
            mb: 2,
          }}
        >
          <Search
            fontSize="small"
            sx={{
              mr: 1,
              color: "text.secondary",
            }}
          />

          <InputBase
            fullWidth
            autoFocus
            placeholder="Search loaded people"
            inputProps={{ "aria-label": "Search people" }}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Box>

        {isError && (
          <Typography color="error" variant="body2" sx={{ mb: 1.5 }}>
            Unable to load users.{" "}
            <Button onClick={() => void refetch()}>Retry</Button>
          </Typography>
        )}

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            {debouncedSearch ? "No users found." : "No other users available."}
          </Typography>
        ) : (
          <List disablePadding>
            {filteredUsers.map((user) => {
              const isCreating = creatingConversation === user.id;

              return (
                <ListItem key={user.id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleSelectUser(user.id)}
                    disabled={Boolean(creatingConversation)}
                    sx={{ borderRadius: 2 }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={user.photoURL ?? undefined}
                        alt={user.displayName ?? "User"}
                      >
                        {user.displayName?.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={user.displayName || user.email || "Unknown user"}
                      secondary={user.email}
                    />

                    {isCreating && <CircularProgress size={20} />}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
        {data?.hasMore && (
          <Button
            disabled={isFetching || Boolean(creatingConversation)}
            onClick={() => setPageSize((value) => value + 30)}
          >
            Load more people
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewConversation;
