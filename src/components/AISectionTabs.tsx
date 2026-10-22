"use client";
import AICopilotSection from "@/components/AICopilotSection";
import { useAppDispatch } from "@/store/hooks";
import { toggleAIChatSidebar } from "@/store/slices/appConfigSlice";
import { AutoFixOff } from "@mui/icons-material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { IconButton, Tab, Toolbar, type Theme } from "@mui/material";
import type { SxProps } from "@mui/system";
import { type SyntheticEvent, useState } from "react";
import AIDetailsSection from "./AIDetailsSection";

const AISectionTabs = () => {
  const [value, setValue] = useState("2");
  const dispatch = useAppDispatch();

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <TabContext value={value}>
      <Toolbar
        sx={{
          bgcolor: "background.default",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TabList
          onChange={handleChange}
          aria-label="Conversation assistant tabs"
          sx={{
            height: "100%",
          }}
          slotProps={{
            scroller: {
              sx: {
                display: "inline-flex",
                alignItems: "center",
              },
            },
            indicator: {
              sx: {
                bgcolor: "secondary.main",
              },
            },
          }}
        >
          <Tab
            label="Details"
            value="1"
            disableRipple
            sx={{
              fontSize: "large",
            }}
          />
          <Tab
            label="AI Assistant"
            value="2"
            disableRipple
            sx={{
              fontSize: "large",
            }}
          />
        </TabList>
        <IconButton
          aria-label="close AI drawer"
          onClick={() => dispatch(toggleAIChatSidebar())}
          size={"small"}
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            "&:hover": {
              bgcolor: "primary.main",
            },
          }}
        >
          <AutoFixOff fontSize={"small"} />
        </IconButton>
      </Toolbar>
      <TabPanel value="1" sx={tabPanelSx}>
        <AIDetailsSection />
      </TabPanel>
      <TabPanel value="2" sx={tabPanelSx}>
        <AICopilotSection />
      </TabPanel>
    </TabContext>
  );
};

export default AISectionTabs;

const tabPanelSx: SxProps<Theme> = (theme) => ({
  flex: 1,
  minHeight: 0,
  p: { xs: 2, md: 3 },
  paddingBottom: `max(${theme.spacing(2)}, env(safe-area-inset-bottom))`,
  overflow: "hidden",
});
