"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleAIChatSidebar } from "@/store/slices/appConfigSlice";
import { sxToArray } from "@/utils/helpers";
import { Drawer, Paper, useMediaQuery, type PaperProps } from "@mui/material";

const PaperForAISection = (props: PaperProps) => {
  const dispatch = useAppDispatch();
  const isBelowLg = useMediaQuery((theme) => theme.breakpoints.down("lg"));
  const { children, ...restProps } = props;
  const isAIChatSidebarOpen = useAppSelector(
    ({ appConfig }) => appConfig.isAIChatSidebarOpen
  );
  return (
    <>
      <Drawer
        variant="temporary"
        open={isAIChatSidebarOpen && isBelowLg}
        onClose={() => dispatch(toggleAIChatSidebar(false))}
        anchor={"right"}
        sx={{
          display: { xs: "block", lg: "none" },
        }}
        slotProps={{
          root: {
            keepMounted: true, // Better open performance on mobile.
          },
          paper: {
            ...restProps,
            sx: { width: "min(440px, 100vw)" },
          },
        }}
      >
        {children}
      </Drawer>
      <Paper
        {...props}
        sx={[
          {
            display: { xs: "none", lg: "flex" },
            flexShrink: 0,
          },
          (theme) =>
            isAIChatSidebarOpen
              ? {
                  transition: theme.transitions.create(["margin"], {
                    easing: theme.transitions.easing.easeOut,
                    duration: theme.transitions.duration.enteringScreen,
                  }),
                  marginRight: 0,
                }
              : {
                  transition: theme.transitions.create(["margin"], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                  }),
                  marginRight: "-448px",
                },
          ...sxToArray(props?.sx),
        ]}
      />
    </>
  );
};

export default PaperForAISection;
