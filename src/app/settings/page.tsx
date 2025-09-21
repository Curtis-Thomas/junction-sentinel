"use client";
//ignore typescrip
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
    MuiButton: {
      styleOverrides: {
        outlined: {
          color: "#A13C4D",
          borderColor: "#A13C4D",
          "&:hover": {
            backgroundColor: "rgba(161, 60, 77, 0.04)",
            borderColor: "#A13C4D",
          },
        },
        contained: {
          backgroundColor: "#C59D5F",
          color: "#0A1C29",
          "&:hover": {
            backgroundColor: "#B38C4D",
          },
        },
      },
    },
  },
});

function SettingsPage() {
  const [highRiskPII, setHighRiskPII] = React.useState("");
  const [allowedFields, setAllowedFields] = React.useState("");
  const [allowedQueries, setAllowedQueries] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPageLoading, setIsPageLoading] = React.useState(true);
  const [alert, setAlert] = React.useState<{
    type: "success" | "error" | null;
    message: string | null;
  }>({ type: null, message: null }); // Default values for the settings

  const defaultSettings = React.useMemo(
    () => ({
      highRiskPII: [
        "firstName",
        "lastName",
        "email",
        "licenseNumber",
        "phone",
        "pilot info",
      ],
      allowedFields: [
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
      ],
      isAllowedQueries: [
        "drone status",
        "active drones",
        "battery level",
        "location",
        "flight duration",
      ],
    }),
    [],
  );

  const parseStringToArray = (str: string) => {
    return str
      .split(/,\s*/)
      .map((s) => s.trim())
      .filter((s) => s !== "");
  };

  const fetchSettings = async () => {
    setIsPageLoading(true);
    try {
      const response = await fetch("/api/userSetting", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      const { highRiskPII, allowedFields, isAllowedQueries } =
        responseData.settings;

      setHighRiskPII(highRiskPII.join(", "));
      setAllowedFields(allowedFields.join(", "));
      setAllowedQueries(isAllowedQueries.join(", "));
      setAlert({ type: null, message: null });
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

  React.useEffect(() => {
    fetchSettings();
  }, []); // Define a type for the API error response

  type ErrorResponse = {
    error: string;
  }; // Updated function to handle saving settings

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setAlert({ type: null, message: null });

    try {
      const payload = {
        highRiskPII: parseStringToArray(highRiskPII),
        allowedFields: parseStringToArray(allowedFields),
        isAllowedQueries: parseStringToArray(allowedQueries),
      };

      const response = await fetch("/api/userSetting", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.error || "Failed to save settings.");
      }

      setAlert({ type: "success", message: "Settings saved successfully!" });
    } catch (error: unknown) {
      console.error("Error saving settings:", error);
      let message = "Failed to save settings. Please try again.";
      if (error instanceof Error) {
        message = error.message;
      }
      setAlert({
        type: "error",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  }; // Updated function to handle resetting settings

  const handleResetSettings = async () => {
    setAlert({ type: null, message: null });
    setIsLoading(true);

    try {
      const payload = {
        highRiskPII: defaultSettings.highRiskPII,
        allowedFields: defaultSettings.allowedFields,
        isAllowedQueries: defaultSettings.isAllowedQueries,
      };

      const response = await fetch("/api/userSetting", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.error || "Failed to reset settings.");
      } // Update local state with the new default values

      setHighRiskPII(defaultSettings.highRiskPII.join(", "));
      setAllowedFields(defaultSettings.allowedFields.join(", "));
      setAllowedQueries(defaultSettings.isAllowedQueries.join(", "));

      setAlert({ type: "success", message: "Settings reset to default!" });
    } catch (error: unknown) {
      console.error("Error resetting settings:", error);
      let message = "Failed to reset settings. Please try again.";
      if (error instanceof Error) {
        message = error.message;
      }
      setAlert({
        type: "error",
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                <CircularProgress sx={{ color: "primary.main" }} />
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
                  placeholder={defaultSettings.highRiskPII.join(", ")}
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
                  placeholder={defaultSettings.allowedFields.join(", ")}
                  sx={{ mb: 3 }}
                />

                <TextField
                  id="allowed-queries"
                  label="Allowed Query Examples (comma-separated)"
                  multiline
                  fullWidth
                  minRows={2}
                  value={allowedQueries}
                  onChange={(e) => setAllowedQueries(e.target.value)}
                  placeholder={defaultSettings.isAllowedQueries.join(", ")}
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
                    }}
                  >
                    Reset to Default
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    sx={{
                      flexGrow: 1,
                      height: 56,
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
