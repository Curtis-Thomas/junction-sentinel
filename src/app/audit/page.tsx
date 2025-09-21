"use client";

import * as React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import DashHeader from "@/components/DashHeader";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";

// Define the Junction Sentinel brand theme
const junctionSentinelTheme = createTheme({
  palette: {
    primary: {
      main: "#C59D5F", // Sentinel Gold
    },
    secondary: {
      main: "#0A1C29", // Guardian Blue
    },
    background: {
      default: "#0A1C29", // Guardian Blue
      paper: "#1A2B3D", // A slightly lighter blue for cards/paper
    },
    text: {
      primary: "#F2F2F2", // Data Grey for text
      secondary: "#C59D5F", // Sentinel Gold for highlights
    },
    error: {
      main: "#A13C4D", // Alert Red
    },
  },
  typography: {
    fontFamily: ["Roboto", "Arial", "sans-serif"].join(","),
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1A2B3D",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#C59D5F",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#C59D5F",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#C59D5F",
          },
          color: "#F2F2F2",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#F2F2F2",
          "&.Mui-focused": {
            color: "#C59D5F",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          color: "#F2F2F2",
          borderColor: "#C59D5F",
        },
        filled: {
          color: "#0A1C29",
          backgroundColor: "#C59D5F",
          "&:hover": {
            backgroundColor: "#B38C4D",
          },
        },
        outlined: {
          color: "#C59D5F",
          borderColor: "#C59D5F",
          "&:hover": {
            backgroundColor: "rgba(197, 157, 95, 0.1)",
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(242, 242, 242, 0.2)",
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: "#F2F2F2",
        },
        secondary: {
          color: "#F2F2F2",
        },
      },
    },
  },
});

// Hardcoded data
const auditLogs = [
  {
    _id: "68ce69bfc3a0313542819325",
    timestamp: "2025-09-20T08:45:51.634+00:00",
    userId: "U-001",
    username: "admin@junction.com",
    action: "login",
    status: "success",
    ip: "192.168.1.100",
    userAgent: "Mozilla/5.0...",
    details: "Admin login from headquarters",
  },
  {
    _id: "68ce69bfc3a0313542819326",
    timestamp: "2025-09-20T07:45:51.634+00:00",
    userId: "U-002",
    username: "agent@junction.com",
    action: "query",
    queryType: "drone_status",
    target: "DS-001",
    status: "allowed",
    details: "Retrieved active drone info",
    ip: "203.0.113.45",
  },
  {
    _id: "68ce69bfc3a0313542819327",
    timestamp: "2025-09-20T06:45:51.634+00:00",
    userId: null,
    username: "anonymous",
    action: "query",
    queryText: "Show me all active drones",
    status: "disallowed",
    reason: "unauthorized",
    ip: "102.168.5.200",
    details: "No authentication provided",
  },
  {
    _id: "68ceac90eefebd97e551326b",
    logId: "test-1758375056699",
    timestamp: "2025-09-20T13:30:56.699+00:00",
    userId: "test-user-direct",
    inputQuery: "Test query for direct audit",
    queryStatus: "test",
    processingTimeMs: 100,
    ipAddress: "127.0.0.1",
    userAgent: "test-agent",
  },
  {
    _id: "68ceb34584a6c66a203f3401",
    logId: "audit-1758376769472-ipm4dnhb2",
    timestamp: "2025-09-20T13:59:29.472+00:00",
    endTime: "2025-09-20T13:59:33.318+00:00",
    userId: "U-001",
    userAgent: "PostmanRuntime/7.39.1",
    ipAddress: "::1",
    inputQuery: "whats the latitude and longitude of drone DS-001 ?",
    queryStatus: "allowed",
    agent1Decision: "allowed",
    agent1Reason: "Query for specific drone location data.",
    agent2Response:
      "Drone DS-001 was last detected at approximately 40.7128 latitude, -74....",
    finalResponse:
      "Drone DS-001 was last detected at approximately 40.7128 latitude, -74....",
    transparency:
      "The system retrieved drone data and redacted sensitive pilot informati...",
    processingTimeMs: 3846,
    error: null,
    metadata: {},
  },
  {
    _id: "68ceb3b284a6c66a203f3402",
    logId: "audit-1758376878538-hat40e84x",
    timestamp: "2025-09-20T14:01:18.538+00:00",
    endTime: "2025-09-20T14:01:22.106+00:00",
    userId: "U-001",
    userAgent: "PostmanRuntime/7.39.1",
    ipAddress: "::1",
    inputQuery: "Get active drones",
    queryStatus: "allowed",
    agent1Decision: "allowed",
    agent1Reason: "Filtered drone status request.",
    agent2Response:
      "Currently, Junction Sentinel Corp. operates three active drones: a Fal...",
    finalResponse:
      "Currently, Junction Sentinel Corp. operates three active drones: a Fal...",
    transparency:
      "The system retrieved drone data and redacted sensitive pilot informati...",
    processingTimeMs: 3568,
    error: null,
    metadata: {},
  },
];

const presetFilters = [
  "Login",
  "Query",
  "Success",
  "Allowed",
  "Disallowed",
  "Error",
];

function AuditPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilters((prevFilters) =>
      prevFilters.includes(filter)
        ? prevFilters.filter((f) => f !== filter)
        : [...prevFilters, filter],
    );
  };

  const filteredLogs = auditLogs.filter((log) => {
    const logString = JSON.stringify(Object.values(log)).toLowerCase();
    const matchesSearch = logString.includes(searchTerm.toLowerCase());

    if (activeFilters.length === 0) {
      return matchesSearch;
    }

    const matchesFilter = activeFilters.some((filter) => {
      const lowerFilter = filter.toLowerCase();
      if (lowerFilter === "login" && log.action === "login") return true;
      if (lowerFilter === "query" && log.action === "query") return true;
      if (lowerFilter === "success" && log.status === "success") return true;
      if (lowerFilter === "allowed" && log.queryStatus === "allowed")
        return true;
      if (lowerFilter === "disallowed" && log.status === "disallowed")
        return true;
      if (lowerFilter === "error" && log.error !== null) return true;
      return false;
    });

    return matchesSearch && matchesFilter;
  });

  return (
    <ThemeProvider theme={junctionSentinelTheme}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "101vh",
          bgcolor: "background.default",
        }}
      >
        <CssBaseline />
        <DashHeader />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 900,
              width: "100%",
              borderRadius: 2,
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ textAlign: "center", color: "text.primary" }}
            >
              Audit Log
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "text.primary", mb: 4, textAlign: "center" }}
            >
              This page displays a hardcoded audit trail of all actions and
              queries processed by the Junction Sentinel agent.
            </Typography>

            {/* Search and Filters */}
            <Box sx={{ mb: 4, width: "100%" }}>
              <TextField
                fullWidth
                label="Search logs..."
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.primary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <Stack
                direction="row"
                spacing={1}
                sx={{ overflowX: "auto", py: 1 }}
              >
                {presetFilters.map((filter) => (
                  <Chip
                    key={filter}
                    label={filter}
                    clickable
                    onClick={() => handleFilterClick(filter)}
                    color={
                      activeFilters.includes(filter) ? "primary" : "default"
                    }
                    variant={
                      activeFilters.includes(filter) ? "filled" : "outlined"
                    }
                  />
                ))}
              </Stack>
            </Box>

            <List sx={{ width: "100%" }}>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => (
                  <React.Fragment key={log._id}>
                    <ListItem alignItems="flex-start" sx={{ mb: 2 }}>
                      <ListItemText
                        primary={
                          <Typography
                            variant="h6"
                            sx={{ color: "text.secondary" }}
                          >
                            {log.action}
                          </Typography>
                        }
                        secondary={
                          <Box component="div" sx={{ mt: 1 }}>
                            <Typography
                              component="span"
                              variant="body2"
                              sx={{ display: "block" }}
                            >
                              <strong>Timestamp:</strong>{" "}
                              {new Date(log.timestamp).toLocaleString()}
                            </Typography>
                            <Typography
                              component="span"
                              variant="body2"
                              sx={{ display: "block" }}
                            >
                              <strong>User:</strong>{" "}
                              {log.username || log.userId || "N/A"}
                            </Typography>
                            <Typography
                              component="span"
                              variant="body2"
                              sx={{ display: "block" }}
                              color={
                                log.status === "disallowed" || log.error
                                  ? "error.main"
                                  : "text.primary"
                              }
                            >
                              <strong>Status:</strong>{" "}
                              {log.status || log.queryStatus}
                            </Typography>
                            {log.details && (
                              <Typography
                                component="span"
                                variant="body2"
                                sx={{ display: "block" }}
                              >
                                <strong>Details:</strong> {log.details}
                              </Typography>
                            )}
                            {log.inputQuery && (
                              <Typography
                                component="span"
                                variant="body2"
                                sx={{ display: "block" }}
                              >
                                <strong>Query:</strong> {log.inputQuery}
                              </Typography>
                            )}
                            {log.finalResponse && (
                              <Typography
                                component="span"
                                variant="body2"
                                sx={{ display: "block" }}
                              >
                                <strong>Response:</strong>{" "}
                                {log.finalResponse.substring(0, 100)}...
                              </Typography>
                            )}
                            <Typography
                              component="span"
                              variant="body2"
                              sx={{ display: "block" }}
                            >
                              <strong>IP Address:</strong>{" "}
                              {log.ip || log.ipAddress}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < filteredLogs.length - 1 && (
                      <Divider component="li" />
                    )}
                  </React.Fragment>
                ))
              ) : (
                <Typography
                  variant="body1"
                  align="center"
                  sx={{ color: "text.secondary" }}
                >
                  No matching audit logs found.
                </Typography>
              )}
            </List>
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default AuditPage;
