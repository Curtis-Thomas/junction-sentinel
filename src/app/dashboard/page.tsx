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
      default: "#0A1C29", // Guardian Blue
      paper: "#1A2B3D", // A slightly lighter blue for cards/paper
    },
    text: {
      primary: "#F2F2F2", // Data Grey for text
      secondary: "#C59D5F", // Sentinel Gold for secondary text
    },
    error: {
      main: "#A13C4D", // Alert Red
    },
  },
  typography: {
    fontFamily: ["Roboto", "Arial", "sans-serif"].join(","),
    h4: {
      fontWeight: 600,
      color: "#F2F2F2",
    },
    h6: {
      color: "#C59D5F",
    },
    body1: {
      color: "#F2F2F2",
    },
    body2: {
      color: "#F2F2F2",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1A2B3D",
          color: "#F2F2F2",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(242, 242, 242, 0.5)",
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
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: "#C59D5F",
          color: "#0A1C29",
          "&:hover": {
            backgroundColor: "#B38C4D",
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(161, 60, 77, 0.15)",
          color: "#F2F2F2",
        },
        icon: {
          color: "#A13C4D !important",
        },
      },
    },
  },
});

export default function ResponsiveDrawer() {
  const [input, setInput] = React.useState("test"); // 👈 Changed initial state
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

  // ✅ Add this useEffect hook to call the function on component mount
  React.useEffect(() => {
    handleSendRequest();
  }, []); // The empty array makes it run only once on the initial load

  const allowedFields = [
    "droneId",
    "model",
    "status",
    "location",
    "owner",
    "privacyLevel",
    "count",
    "total",
    "active",
    "inactive",
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
                    bgcolor: "rgba(66, 165, 245, 0.2)",
                    color: "text.primary",
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
                    bgcolor: "rgba(161, 60, 77, 0.2)",
                    color: "text.primary",
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
            {isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                There was an issue with your query. Please adjust and try again.
              </Alert>
            )}

            <Typography variant="h6" sx={{ mb: 1 }}>
              Response
            </Typography>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                mb: 4,
                minHeight: 150,
                borderRadius: 2,
                overflow: "auto",
                whiteSpace: "pre-wrap",
                border: isError ? "2px solid #A13C4D" : "1px solid #1A2B3D",
                transition: "0.3s",
                height: "auto",
              }}
            >
              <Typography component="p" variant="body1">
                {output}
              </Typography>
            </Paper>

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
              />
              <Button
                variant="contained"
                onClick={handleSendRequest}
                disabled={isLoading || input.trim() === ""}
                sx={{
                  width: 120,
                  height: 56,
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
