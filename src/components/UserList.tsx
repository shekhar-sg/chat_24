"use client";
import { Person, Search, Sort, ViewList } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  InputBase,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  listItemButtonClasses,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { type ChangeEvent, type MouseEvent, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";

export interface User {
  id: string;
  conversationId?: string;
  name: string;
  avatarUrl?: string;
  status?: string; // e.g. 'online', 'offline', 'typing...'
  isGroup?: boolean;
  groupMembers?: string[]; // for group chats
  unreadCount?: number;
  conversation?: { from: string; message: string; time: string }[]; // optional, for conversation history
}

interface UserListProps {
  users: User[];
  selectedUserId?: string | null;
  onSelectUser?: (userId: string) => void;
}

const getLastMessage = (user: User) => {
  if (user.conversation && user.conversation.length > 0) {
    const last = user.conversation[user.conversation.length - 1];
    return { message: last.message, time: last.time };
  }
};

export function stringToColor(string: string) {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
}

const UserList = ({ users, selectedUserId, onSelectUser }: UserListProps) => {
  const [search, setSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<string>("recent");
  const [avatarView, setAvatarView] = useState<"avatar" | "no-avatar">(
    "avatar"
  );
  const params = useParams();
  const open = Boolean(anchorEl);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) =>
    setSearch(e.target.value);
  const handleSortClick = (event: MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleSortClose = (sort?: string) => {
    if (sort) setSortBy(sort);
    setAnchorEl(null);
  };
  const handleAvatarView = (
    _: MouseEvent<HTMLElement>,
    nextView: "avatar" | "no-avatar"
  ) => {
    if (nextView !== null) setAvatarView(nextView);
  };

  const filteredUsers = users
    .filter((user) => {
      const searchLower = search.toLowerCase();
      const last = getLastMessage(user);
      return (
        user.name.toLowerCase().includes(searchLower) ||
        (last &&
          last.message &&
          last.message.toLowerCase().includes(searchLower)) ||
        (user.status && user.status.toLowerCase().includes(searchLower)) ||
        (user.isGroup &&
          user.groupMembers &&
          user.groupMembers.some((member) =>
            member.toLowerCase().includes(searchLower)
          ))
      );
    })
    .sort((a, b) => {
      const lastA = getLastMessage(a);
      const lastB = getLastMessage(b);
      if (sortBy === "recent") {
        return (lastB?.time || "").localeCompare(lastA?.time || "");
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  return (
    <Box
      display="flex"
      flexDirection="column"
      height={(theme) => ({
        xs: `calc(100% - ${theme.spacing(8)})`,
        md: `calc(100% - ${theme.spacing(10)})`,
      })}
    >
      {/* Search and sort */}
      <Box display="flex" alignItems="center" px={2} py={1.5} gap={1}>
        <InputBase
          placeholder="Search chats"
          value={search}
          onChange={handleSearchChange}
          sx={{
            flex: 1,
            bgcolor: "background.default",
            px: 2,
            py: 0.5,
            borderRadius: 2,
            fontSize: 15,
          }}
          startAdornment={
            <Search sx={{ mr: 1, color: "text.secondary" }} fontSize="small" />
          }
        />
        <IconButton onClick={handleSortClick} size="small" sx={{ ml: 1 }}>
          <Sort fontSize="small" />
        </IconButton>
        <Menu anchorEl={anchorEl} open={open} onClose={() => handleSortClose()}>
          <MenuItem
            selected={sortBy === "recent"}
            onClick={() => handleSortClose("recent")}
          >
            Sort by Recent
          </MenuItem>
          <MenuItem
            selected={sortBy === "name"}
            onClick={() => handleSortClose("name")}
          >
            Sort by Name
          </MenuItem>
        </Menu>
      </Box>
      <Divider />
      {/* Chat list, flex: 1 for scrollable area */}
      <Box flex={1} minHeight={0} overflow="auto">
        <List dense>
          {filteredUsers.length === 0 && (
            <Box p={3} textAlign="center" color="text.secondary">
              No chats yet
            </Box>
          )}
          {filteredUsers.map((user) => {
            const last = getLastMessage(user);
            const bgcolor = stringToColor(user.name || "Unknown");
            // const isSelected = params?.u
            return (
              <ListItem key={user.id} alignItems="flex-start">
                <ListItemButton
                  component={Link}
                  href={`/conversation/${user.conversationId ?? user.id}`}
                  selected={
                    params?.userID === user.id || selectedUserId === user.id
                  }
                  onClick={() => onSelectUser?.(user.id)}
                  alignItems="flex-start"
                  sx={{
                    py: 1,
                    px: 1.5,
                    minHeight: 56,
                    borderRadius: 1,
                    [`&.${listItemButtonClasses.selected}`]: {
                      border: 1,
                      borderColor: "divider",
                    },
                  }}
                >
                  {avatarView === "avatar" && (
                    <ListItemAvatar
                      sx={{
                        mt: 0.5,
                      }}
                    >
                      <Avatar
                        src={user.avatarUrl}
                        alt={user.name}
                        sx={{
                          width: 36,
                          height: 36,
                          mr: 1,
                          borderRadius: "50%",
                          bgcolor,
                          color: (theme) =>
                            theme.palette.getContrastText(bgcolor),
                          fontWeight: 600,
                          fontSize: 18,
                        }}
                      >
                        {user.isGroup ? (
                          <Box component="span" fontSize={20}>
                            👥
                          </Box>
                        ) : user.name ? (
                          user.name[0].toUpperCase()
                        ) : (
                          <Box component="span" fontSize={20}>
                            ?
                          </Box>
                        )}
                      </Avatar>
                    </ListItemAvatar>
                  )}
                  <Box flex={1} minWidth={0}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      width="100%"
                      gap={1}
                    >
                      <Box
                        minWidth={0}
                        flex={1}
                        display="flex"
                        flexDirection="column"
                      >
                        <Typography
                          variant="subtitle2"
                          fontWeight={600}
                          noWrap
                          sx={{ maxWidth: "100%", fontSize: 15, flex: 1 }}
                        >
                          {user.name}
                        </Typography>
                        {user.isGroup && user.groupMembers && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            sx={{
                              display: "block",
                              maxWidth: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontSize: 11,
                              flex: 1,
                            }}
                          >
                            {user.groupMembers.join(", ")}
                          </Typography>
                        )}
                      </Box>
                      {last?.time && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            whiteSpace: "nowrap",
                            ml: 1,
                            minWidth: 40,
                            textAlign: "right",
                            fontSize: 12,
                          }}
                        >
                          {last.time}
                        </Typography>
                      )}
                    </Box>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      width="100%"
                      gap={1}
                      mt={0.2}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{
                          flex: 1,
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontSize: 13,
                        }}
                      >
                        {last?.message || (
                          <span style={{ color: "#bbb" }}>No messages yet</span>
                        )}
                      </Typography>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        minWidth={0}
                      >
                        {user.status && (
                          <Typography
                            variant="caption"
                            color={
                              user.status === "online"
                                ? "success.main"
                                : "text.disabled"
                            }
                            sx={{
                              ml: 0.5,
                              minWidth: 28,
                              textAlign: "right",
                              fontSize: 11,
                            }}
                          >
                            {user.status}
                          </Typography>
                        )}
                        {user.unreadCount && user.unreadCount > 0 ? (
                          <Box
                            ml={0.5}
                            px={0.7}
                            minWidth={18}
                            bgcolor="secondary.main"
                            color="secondary.contrastText"
                            borderRadius={8}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize={11}
                            fontWeight={600}
                            sx={{ minWidth: 18, textAlign: "center" }}
                          >
                            {user.unreadCount}
                          </Box>
                        ) : null}
                      </Box>
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
      {/* Toggle buttons at bottom left */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        px={2}
        py={1}
      >
        <ToggleButtonGroup
          value={avatarView}
          exclusive
          onChange={handleAvatarView}
          size="small"
          aria-label="avatar view toggle"
        >
          <ToggleButton value="avatar" aria-label="avatar view">
            <Person fontSize="small" />
          </ToggleButton>
          <ToggleButton value="no-avatar" aria-label="no avatar view">
            <ViewList fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
        <LogoutButton variant={"button"}/>
      </Box>
    </Box>
  );
};

export default UserList;
