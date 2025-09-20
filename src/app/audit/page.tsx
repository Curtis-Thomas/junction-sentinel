"use client";

import * as React from "react";
import { useState, useEffect } from "react";
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
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

// --------------------
// Types
// --------------------
interface AuditLog {
  _id?: string;
  logId?: string;
  action?: string;
  status?: string;
  queryStatus?: string;
  error?: string | null;
  timestamp?: string;
  username?: string;
  userId?: string;
  details?: string;
  inputQuery?: string;
  finalResponse?: string;
  ip?: string;
  ipAddress?: string;
  agent1Reason?: string;
  transparency?: string;
  agent2Response?: string;
}

// --------------------
// Theme
// --------------------
const junctionSentinelTheme = createTheme({
  palette: {
    primary: { main: "#C59D5F" },
    secondary: { main: "#0A1C29" },
    background: { default: "#0A1C29", paper: "#1A2B3D" },
    text: { primary: "#F2F2F2", secondary: "#C59D5F" },
    error: { main: "#A13C4D" },
  },
  typography: {
    fontFamily: ["Roboto", "Arial", "sans-serif"].join(","),
    h4: { fontWeight: 600 },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundColor: "#1A2B3D" } } },
    MuiDivider: {
      styleOverrides: { root: { backgroundColor: "rgba(242, 242, 242, 0.2)" } },
    },
  },
});

// --------------------
// Component
// --------------------
function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search + filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const getAuditLogs = async () => {
    try {
      const response = await fetch("/api/agent/audit-logs");
      if (!response.ok) throw new Error("Failed to fetch audit logs");

      const data = await response.json();

      // Normalize logs
      const logsArray = Array.isArray(data.logs) ? data.logs : [];
      const normalizedLogs: AuditLog[] = logsArray.map((log: AuditLog) => ({
        _id: log._id ?? log.logId,
        action: log.action ?? "query",
        status: log.status ?? log.queryStatus,
        queryStatus: log.queryStatus,
        error: log.error,
        timestamp: log.timestamp,
        username: log.username,
        userId: log.userId,
        details: (log.agent1Reason ?? log.transparency) as string | undefined,
        inputQuery: log.inputQuery,
        finalResponse:
          log.finalResponse ?? (log.agent2Response as string | undefined),
        ip: log.ip,
        ipAddress: log.ipAddress,
      }));

      setAuditLogs(normalizedLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAuditLogs();
  }, []);

  // Apply search and filter
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      (log.username &&
        log.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.userId &&
        log.userId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.inputQuery &&
        log.inputQuery.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.finalResponse &&
        log.finalResponse.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "" || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Collect unique statuses for dropdown
  const uniqueStatuses = Array.from(
    new Set(auditLogs.map((log) => log.status).filter(Boolean)),
  );

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
              This page displays the audit trail of all actions and queries
              processed by the Junction Sentinel agent.
            </Typography>

            {/* Search + Filter Controls */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                mb: 3,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <TextField
                variant="outlined"
                size="small"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  input: { color: "text.primary" },
                  width: { xs: "100%", sm: "50%" },
                }}
              />
              <FormControl
                size="small"
                sx={{ minWidth: 150, color: "text.primary" }}
              >
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ color: "text.primary" }}
                >
                  <MenuItem value="">All</MenuItem>
                  {uniqueStatuses.map((status) => (
                    <MenuItem key={status} value={status || ""}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Logs */}
            <List sx={{ width: "100%" }}>
              {!loading && filteredLogs.length > 0
                ? filteredLogs.map((log, index) => (
                    <React.Fragment key={log._id || index}>
                      <ListItem alignItems="flex-start" sx={{ mb: 2 }}>
                        <ListItemText
                          primary={
                            <Typography
                              variant="h6"
                              sx={{ color: "text.secondary" }}
                            >
                              {log.action || "Unknown Action"}
                            </Typography>
                          }
                          secondary={
                            <Box component="div" sx={{ mt: 1 }}>
                              {log.timestamp && (
                                <Typography
                                  component="span"
                                  variant="body2"
                                  sx={{ display: "block" }}
                                >
                                  <strong>Timestamp:</strong>{" "}
                                  {new Date(log.timestamp).toLocaleString()}
                                </Typography>
                              )}
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
                                {log.status || log.queryStatus || "N/A"}
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
                                  {log.finalResponse.length > 100
                                    ? `${log.finalResponse.substring(0, 100)}...`
                                    : log.finalResponse}
                                </Typography>
                              )}
                              {(log.ip || log.ipAddress) && (
                                <Typography
                                  component="span"
                                  variant="body2"
                                  sx={{ display: "block" }}
                                >
                                  <strong>IP Address:</strong>{" "}
                                  {log.ip || log.ipAddress}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < filteredLogs.length - 1 && (
                        <Divider component="li" />
                      )}
                    </React.Fragment>
                  ))
                : !loading && (
                    <Typography
                      variant="body1"
                      align="center"
                      sx={{ color: "text.secondary" }}
                    >
                      No audit logs found.
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
