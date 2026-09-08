import {
  AutoFixHigh,
  Brightness4,
  Inbox,
  MoreHoriz,
} from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Box,
  type AppBarProps,
  Chip,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import Link from "next/link";

import { stringToColor } from "@/components/UserList";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  toggleAIChatSidebar,
  toggleThemeMode,
} from "@/store/slices/appConfigSlice";
import { gradientForAI } from "@/styles/theme";
import { sxToArray } from "@/utils/helpers";
import type { UserWithId } from "@/store/api/usersApi";

interface ChatToolbarProps extends AppBarProps {
  user: UserWithId;
}

function ChatToolbar(props: ChatToolbarProps) {
  const { user, ...rest } = props;

  const isAIChatSidebarOpen = useAppSelector(
    ({ appConfig }) => appConfig.isAIChatSidebarOpen
  );

  const dispatch = useAppDispatch();

  const displayName = user.displayName || user.email || "Unknown user";
  const avatarColor = stringToColor(user.displayName || displayName);

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      {...rest}
      sx={[
        {
          bgcolor: "transparent",
        },
        ...sxToArray(rest.sx),
      ]}
    >
      <Toolbar sx={{ gap: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Avatar
            src={user.photoURL || undefined}
            alt={displayName}
            sx={{
              width: 36,
              height: 36,
              bgcolor: avatarColor,
              color: (theme) => theme.palette.getContrastText(avatarColor),
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </Avatar>

          <Typography
            variant={"h6"}
            noWrap
            component={"div"}
            sx={{
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayName}
          </Typography>
        </Box>

        <IconButton color="inherit" aria-label="conversation menu" size="small">
          <MoreHoriz fontSize="small" />
        </IconButton>
        <IconButton
          color="inherit"
          aria-label="toggle theme"
          onClick={() => {
            dispatch(
              toggleThemeMode({
                seToCookie: true,
              })
            );
          }}
          size={"small"}
        >
          <Brightness4 fontSize={"small"} />
        </IconButton>
        <Chip
          component={Link}
          href={"/"}
          disabled={!user.displayName}
          sx={{
            bgcolor: "primary.main",
            padding: 0.8,
            color: "primary.contrastText",
            fontWeight: "bold",
            cursor: "pointer",
          }}
          icon={<Inbox fontSize={"small"} color={"inherit"} />}
          label={"Close"}
          variant={"filled"}
        />
        {!isAIChatSidebarOpen && (
          <IconButton
            aria-label="open AI drawer"
            onClick={() => dispatch(toggleAIChatSidebar())}
            size={"small"}
            sx={{
              backgroundImage: gradientForAI,
              color: "common.white",
            }}
          >
            <AutoFixHigh fontSize={"small"} />
          </IconButton>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default ChatToolbar;
