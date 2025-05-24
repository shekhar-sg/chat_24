import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  toggleAIChatSidebar,
  toggleThemeMode,
} from "@/store/slices/appConfigSlice";
import { gradientForAI } from "@/styles/theme";
import { sxToArray } from "@/utils/helpers";
import {
  AutoFixHigh,
  Brightness4,
  Inbox,
  MoreHoriz,
} from "@mui/icons-material";
import {
  AppBar,
  type AppBarProps,
  Chip,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";

import Link from "next/link";
import React from "react";

interface ChatToolbarProps extends AppBarProps {
  userName: string;
}

function ChatToolbar(props: ChatToolbarProps) {
  const { userName, ...rest } = props;
  const isAIChatSidebarOpen = useAppSelector(
    ({ appConfig }) => appConfig.isAIChatSidebarOpen
  );
  const dispatch = useAppDispatch(); // Replace with actual state if needed
  return (
    <AppBar
      position={"sticky"}
      color={"default"}
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
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }} component="div">
          {userName}
        </Typography>
        <IconButton color="inherit" aria-label="menu" size={"small"}>
          <MoreHoriz fontSize={"small"} />
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
          disabled={!userName}
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
