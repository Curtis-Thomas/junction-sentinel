"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
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

function SettingsPage() {
  // Default values for the settings
  const defaultHighRiskPII =
    "firstName, lastName, email, licenseNumber, phone, pilot info";
  const defaultAllowedFields =
    "droneId, model, status, location, altitudeMeters, speedMps, owner, privacyLevel, batteryLevel, flightDuration, purpose, average, count, total, active, inactive, coordinates, latitude, longitude, battery, speed, altitude";
  const defaultDisallowedQueries =
    "What is Alex Chen's email?, Tell me the license number for pilot P-101.";

  const [highRiskPII, setHighRiskPII] = React.useState("");
  const [allowedFields, setAllowedFields] = React.useState("");
  const [disallowedQueries, setDisallowedQueries] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPageLoading, setIsPageLoading] = React.useState(true);
  const [alert, setAlert] = React.useState<{
    type: "success" | "error" | null;
    message: string | null;
  }>({ type: null, message: null });

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings.");
        }
        const data = await response.json();
        setHighRiskPII(data.highRiskPII.join(", "));
        setAllowedFields(data.allowedFields.join(", "));
        setDisallowedQueries(data.disallowedQueries.join(", "));
      } catch (error) {
        console.error("Error fetching settings:", error);
        setAlert({
          type: "error",
          message: "Failed to load settings. Please try refreshing the page.",
        });
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const parseStringToArray = (str: string) => {
    return str
      .split(/["']?,\s*["']?/)
      .map((s) => s.replace(/["']/g, "").trim())
      .filter((s) => s !== "");
  };

  const handleSaveSettings = async (settingsToSave: {
    highRiskPII: string[];
    allowedFields: string[];
    disallowedQueries: string[];
  }) => {
    setIsLoading(true);
    setAlert({ type: null, message: null });

    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsToSave),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings.");
      }

      setAlert({ type: "success", message: "Settings saved successfully!" });
    } catch (error) {
      console.error("Error saving settings:", error);
      setAlert({
        type: "error",
        message: "Failed to save settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    setHighRiskPII(defaultHighRiskPII);
    setAllowedFields(defaultAllowedFields);
    setDisallowedQueries(defaultDisallowedQueries);
    handleSaveSettings({
      highRiskPII: parseStringToArray(defaultHighRiskPII),
      allowedFields: parseStringToArray(defaultAllowedFields),
      disallowedQueries: parseStringToArray(defaultDisallowedQueries),
    });
  };

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
              maxWidth: 900,
              width: "100%",
              borderRadius: 2,
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ color: "text.primary", textAlign: "center" }}
            >
              User Settings
            </Typography>
            <Typography
              variant="body1"
              sx={{ mb: 2, color: "text.primary", textAlign: "center" }}
            >
              Customize the fields and queries the system will monitor.
            </Typography>

            {alert.message && (
              <Alert severity={alert.type || "info"} sx={{ mb: 2 }}>
                {alert.message}
              </Alert>
            )}

            {isPageLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TextField
                  id="high-risk-pii"
                  label="High-Risk PII Fields (comma-separated)"
                  multiline
                  fullWidth
                  minRows={2}
                  value={highRiskPII}
                  onChange={(e) => setHighRiskPII(e.target.value)}
                  placeholder={defaultHighRiskPII}
                  sx={{ mb: 3 }}
                />

                <TextField
                  id="allowed-fields"
                  label="Allowed Fields (comma-separated)"
                  multiline
                  fullWidth
                  minRows={3}
                  value={allowedFields}
                  onChange={(e) => setAllowedFields(e.target.value)}
                  placeholder={defaultAllowedFields}
                  sx={{ mb: 3 }}
                />

                <TextField
                  id="disallowed-queries"
                  label="Disallowed Query Examples (comma-separated)"
                  multiline
                  fullWidth
                  minRows={2}
                  value={disallowedQueries}
                  onChange={(e) => setDisallowedQueries(e.target.value)}
                  placeholder={defaultDisallowedQueries}
                  sx={{ mb: 3 }}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleResetSettings}
                    disabled={isLoading}
                    sx={{
                      flexGrow: 1,
                      height: 56,
                      borderColor: "error.main",
                      color: "error.main",
                      "&:hover": {
                        backgroundColor: "rgba(161, 60, 77, 0.04)",
                      },
                    }}
                  >
                    Reset to Default
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() =>
                      handleSaveSettings({
                        highRiskPII: parseStringToArray(highRiskPII),
                        allowedFields: parseStringToArray(allowedFields),
                        disallowedQueries:
                          parseStringToArray(disallowedQueries),
                      })
                    }
                    disabled={isLoading}
                    sx={{
                      flexGrow: 1,
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
                      "Save Settings"
                    )}
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default SettingsPage;
