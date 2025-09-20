"use client";

import * as React from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { IconButton, Tooltip, Stack, Box } from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";

function DashHeader() {
  return (
    <AppBar position="static" sx={{ bgcolor: "secondary.main" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Left Section: Brand Name */}
        <Box sx={{ flexGrow: 0 }}>
          {/* Full brand name for medium and larger screens */}
          <Button
            href="/dashboard"
            disableRipple
            sx={{
              display: { xs: "none", md: "flex" },
              color: "primary.main",
              background: "none",
              boxShadow: "none",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "transparent",
                color: "text.primary",
              },
            }}
          >
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              JS
            </Typography>
          </Button>
          {/* Abbreviated brand name for small screens */}
          <Button
            href="/dashboard"
            disableRipple
            sx={{
              display: { xs: "flex", md: "none" },
              color: "primary.main",
              background: "none",
              boxShadow: "none",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "transparent",
                color: "text.primary",
              },
            }}
          >
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              JS
            </Typography>
          </Button>
        </Box>

        {/* Center Section: Navigation Icons */}
        <Stack
          direction="row"
          spacing={{ xs: 0, sm: 1 }}
          sx={{
            flexGrow: 1, // Allows the stack to grow and center its content
            justifyContent: "center",
            color: "primary.main",
            alignItems: "center",
          }}
        >
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

        {/* Right Section: Logout Button */}
        <Box sx={{ flexGrow: 0 }}>
          {/* Full-size Logout button for medium and larger screens */}
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            href="/auth/logout"
            sx={{
              display: { xs: "none", md: "flex" },
              color: "error.main",
              borderColor: "error.main",
              "&:hover": {
                borderColor: "error.light",
                color: "error.light",
              },
            }}
          >
            Logout
          </Button>
          {/* Icon-only Logout button for small screens */}
          <Tooltip title="Logout">
            <IconButton
              color="error"
              href="/auth/logout"
              sx={{
                display: { xs: "flex", md: "none" },
                "&:hover": {
                  backgroundColor: "rgba(161, 60, 77, 0.1)",
                },
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default DashHeader;
