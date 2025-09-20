"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

const drawerWidth = 240;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const drawer = (
    <Box sx={{ bgcolor: "#0A1C29", color: "#fff", height: "100vh", px: 2 }}>
      <Typography sx={{ pt: 5, pb: 2, fontSize: 20, fontWeight: 600 }}>
        Junction Boxers
      </Typography>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton href="/dashboard">
            <ListItemText primary="Agent 1" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton href="/dashboard/agent2">
            <ListItemText primary="Agent 2" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
        open
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{ flexGrow: 1, p: 4, width: `calc(100% - ${drawerWidth}px)` }}
      >
        {children} {/* Dynamic page content renders here */}
      </Box>
    </Box>
  );
}
