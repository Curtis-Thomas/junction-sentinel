"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import {
  TextField,
  Button,
  CircularProgress,
  Paper,
  Alert,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import DashHeader from "@/components/DashHeader";

// Define a custom Material-UI theme with the brand colors
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
      paper: "#F2F2F2", // Data Grey for Paper components
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
    h4: {
      color: "#0A1C29",
    },
  },
});

export default function ResponsiveDrawer() {
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("Waiting for input...");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSendRequest = async () => {
    if (input.trim() === "") return;
    setIsLoading(true);
    setIsError(false);

    try {
      const response = await fetch("/api/agent/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setOutput(data.message);
          setIsError(true);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        setOutput(data.message);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setOutput("Something went wrong. Please try again.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !isLoading) {
      handleSendRequest();
    }
  };

  const allowedFields = [
    "droneId",
    "model",
    "status",
    "location",
    "altitudeMeters",
    "speedMps",
    "owner",
    "privacyLevel",
    "batteryLevel",
    "flightDuration",
    "purpose",
    "average",
    "count",
    "total",
    "active",
    "inactive",
    "coordinates",
    "latitude",
    "longitude",
    "battery",
    "speed",
    "altitude",
  ];

  const disallowedFields = [
    "firstName",
    "lastName",
    "email",
    "licenseNumber",
    "phone",
    "pilot info",
  ];

  return (
    <ThemeProvider theme={junctionSentinelTheme}>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <CssBaseline />

        <DashHeader />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            bgcolor: "background.default",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 900 }}>
            <Typography variant="h4" sx={{ mb: 2, textAlign: "center" }}>
              Agent Query Interface
            </Typography>

            <Typography
              variant="body1"
              sx={{ mb: 4, textAlign: "center", fontStyle: "italic" }}
            >
              Ask a question about the drone data, and our multi-agent system
              will find the answer while ensuring all queries are compliant and
              privacy-preserving.
            </Typography>

            {/* Allowed and Disallowed Fields Lists */}
            <Typography variant="h6" sx={{ mb: 1 }}>
              Allowed Fields
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                mb: 2,
              }}
            >
              {allowedFields.map((field, index) => (
                <Paper
                  key={index}
                  elevation={1}
                  sx={{
                    p: 0.5,
                    borderRadius: 1,
                    bgcolor: "#e8f5e9", // Lighter green for allowed
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                    {field}
                  </Typography>
                </Paper>
              ))}
            </Box>

            <Typography variant="h6" sx={{ mb: 1 }}>
              Specified Disallowed Fields (High-Risk PII)
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                mb: 4,
              }}
            >
              {disallowedFields.map((field, index) => (
                <Paper
                  key={index}
                  elevation={1}
                  sx={{
                    p: 0.5,
                    borderRadius: 1,
                    bgcolor: "#ffcdd2", // A more visible red for disallowed
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "0.875rem" }}
                    color="error.main"
                  >
                    {field}
                  </Typography>
                </Paper>
              ))}
            </Box>

            {/* Error Banner */}
            {isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                There was an issue with your query. Please adjust and try again.
              </Alert>
            )}

            {/* Response Output */}
            <Typography variant="h6" sx={{ mb: 1 }}>
              Response
            </Typography>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                mb: 4,
                minHeight: 150,
                bgcolor: "background.paper",
                borderRadius: 2,
                overflow: "auto",
                whiteSpace: "pre-wrap",
                border: isError ? "2px solid #A13C4D" : "1px solid #ddd",
                transition: "0.3s",
                height: "auto",
              }}
            >
              <Typography component="p" variant="body1">
                {output}
              </Typography>
            </Paper>

            {/* Input + Send Button */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <TextField
                fullWidth
                label="Input Query"
                variant="outlined"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                disabled={isLoading}
                autoComplete="off"
                sx={{
                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                    { borderColor: "primary.main" },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "primary.main",
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleSendRequest}
                disabled={isLoading || input.trim() === ""}
                sx={{
                  width: 120,
                  height: 56,
                  bgcolor: "primary.main",
                  color: "secondary.main",
                }}
              >
                {isLoading ? (
                  <CircularProgress
                    size={24}
                    sx={{ color: "secondary.main" }}
                  />
                ) : (
                  "Send"
                )}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
