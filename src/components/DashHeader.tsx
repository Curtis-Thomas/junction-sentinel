"use client";

import * as React from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { IconButton, Tooltip, Stack } from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";

function DashHeader() {
  return (
    <AppBar position="static" sx={{ bgcolor: "secondary.main" }}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, color: "primary.main" }}
        >
          Junction Sentinel
        </Typography>
        <Stack direction="row" spacing={1} sx={{ color: "primary.main" }}>
          <Tooltip title="Dashboard">
            <IconButton color="inherit" href="/dashboard">
              <DashboardIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton color="inherit" href="/settings">
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Audit Log">
            <IconButton color="inherit" href="/audit">
              <HistoryIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        <Button
          color="error"
          variant="outlined"
          startIcon={<LogoutIcon />}
          sx={{
            ml: 2,
            borderColor: "error.main",
            // Hide text on small screens and show only the icon
            display: { xs: "none", md: "flex" },
            "& .MuiButton-startIcon": {
              mr: { xs: 0, md: 1 },
            },
          }}
          href="/auth/logout"
        >
          Logout
        </Button>
        {/* A version of the Logout button that only shows the icon on small screens */}
        <Tooltip title="Logout">
          <IconButton
            color="error"
            href="/auth/logout"
            sx={{
              ml: 1,
              display: { xs: "block", md: "none" },
              borderColor: "error.main",
              "&:hover": {
                backgroundColor: "rgba(161, 60, 77, 0.04)",
              },
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}

export default DashHeader;
