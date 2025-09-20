"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import DashHeader from "@/components/DashHeader";

// Define the brand theme
const junctionSentinelTheme = createTheme({
  palette: {
    primary: {
      main: "#C59D5F", // Sentinel Gold
    },
    secondary: {
      main: "#0A1C29", // Guardian Blue
    },
    background: {
      default: "#F2F2F2", // Data Grey
    },
    text: {
      primary: "#0A1C29", // Guardian Blue for text
      secondary: "#C59D5F", // Sentinel Gold for secondary text
    },
    error: {
      main: "#A13C4D", // Alert Red
    },
  },
  typography: {
    fontFamily: ["Roboto", "Arial", "sans-serif"].join(","),
  },
});

function AuditPage() {
  return (
    <ThemeProvider theme={junctionSentinelTheme}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CssBaseline />

        <DashHeader />

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: "100%",
              textAlign: "center",
              borderRadius: 2,
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ color: "text.primary" }}
            >
              Audit Log
            </Typography>
            <Typography variant="body1" sx={{ color: "text.primary" }}>
              This page will display the audit trail of all actions and queries
              processed by the Junction Sentinel agent.
            </Typography>
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default AuditPage;
