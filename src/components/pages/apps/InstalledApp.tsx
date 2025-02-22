import React, { useState, Fragment, useEffect } from "react";
import waziup, { App } from "waziup";
// import { TimeComp } from "../Time";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";

import _wazigateLogo from "../../../img/wazigate.svg";
const wazigateLogo = `dist/${_wazigateLogo}`;

import _defaultLogo from "../../../img/default-app-logo.svg";
const defaultLogo = `dist/${_defaultLogo}`;

import {
  makeStyles,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  FormGroup,
  CircularProgress,
  DialogActions,
  // Typography,
  FormControlLabel,
  Switch,
  // LinearProgress,
  Fade,
  Tooltip,
} from "@material-ui/core";
import { green } from "@material-ui/core/colors";

import DeleteIcon from '@material-ui/icons/Delete';
import SettingsIcon from '@material-ui/icons/Settings';
import UpdateIcon from '@material-ui/icons/Update';
import StopIcon from '@material-ui/icons/Stop';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import DetailsRoundedIcon from '@material-ui/icons/DetailsRounded';

export declare type AppConfig = {
  action?: "start" | "stop" | "uninstal";
  restart?: "always" | "on-failure" | "unless-stopped" | "no";
};

interface Props {
  appInfo: App;
  className?: string;
}

const useStyles = makeStyles((theme) => ({
  page: {
    marginTop: "64px",
  },
  modal: {
    marginLeft: 0,
    [theme.breakpoints.up("sm")]: {
      marginLeft: 240,
    },
  },
  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12,
  },
  wrapper: {
    margin: theme.spacing(1),
    position: "relative",
  },
  logo: {
    display: "inline-flex",
    height: "2rem",
    marginRight: 16,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  textarea: {
    backgroundColor: "#000",
    color: "#FFD",
    borderRadius: "5px",
    width: "100%",
  },
  orange: {
    background: "#f35e19",
    color: "white",
    outline: "none",
    "&:hover": {
      background: "#f38c5c",
    },
  },
  boldCap: {
    fontWeight: 500,
    textTransform: "capitalize",
  },
}));

type UninstallConfig = {
  keepConfig: boolean;
};

type UpdateConfig = {};

type SettingsConfig = {};

type UpdateStatus = {
  logs: string;
  isChecking: boolean;
  hasCheckedUpdates: boolean;
  hasUpdate: boolean;
  newVersion: string;
};

export default function InstalledApp({ appInfo, className }: Props) {
  const classes = useStyles();

  /*------------ */
  // Run stuff on load
  useEffect(
    () => {
      checkUpdates(false);
    },
    [] /* This makes it to run only once*/
  );

  /*------------ */

  const [app, setApp] = useState<App>(appInfo);
  const load = () => {
    wazigate.getApp(app.id).then(setApp, (error) => {
      alert("There was an error loading the app info:\n" + error);
    });
  };

  /*------------ */

  const [uninstallModal, setUninstallModal] = useState<UninstallConfig>(null);

  const showModalUninstall = () => {
    setUninstallModal({
      keepConfig: true,
    });
    hideModalSettings();
  };

  const hideModalUninstall = () => {
    setUninstallModal(null);
  };

  const handleKeepConfigChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUninstallModal({
      keepConfig: event.target.checked,
    });
  };

  /*------------ */

  const [updateModal, setUpdateModal] = useState<UpdateConfig>(null);

  const showModalUpdate = () => {
    setUpdateModal({
      keepConfig: false,
    });
    hideModalSettings();
  };

  const hideModalUpdate = () => {
    setUpdateModal(null);
  };

  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(null);

  /*------------ */

  const [settingsModal, setSettingsModal] = useState<SettingsConfig>(null);

  const showModalSettings = () => {
    // console.log(app);
    setSettingsModal({
      /// ?
      keepConfig: false,
    });
  };

  const hideModalSettings = () => {
    setSettingsModal(null);
  };

  /*------------ */

  const [isUninstalling, setUninstLoader] = useState<boolean>(false);
  const uninstall = () => {
    if (!confirm("Do you want to uninstall the App?")) return;
    setUninstLoader(true);
    wazigate.uninstallApp(app.id, uninstallModal.keepConfig).then(
      (res) => {
        setUninstLoader(false);
        load();
        alert(
          "The app [ " + (app?.name || app.id) + " ] has been uninstalled."
        );
        hideModalUninstall();
        setTimeout(function () { window.location.reload() }, 1000);
      },
      (error) => {
        setUninstLoader(false);
        alert(
          "There was an error uninstalling the app [ " +
          (app?.name || app.id) +
          " ]:\n" +
          error
        );
      }
    );
  };

  /*------------ */

  const checkUpdates = (showAlert: boolean = false) => {
    type AppUpdate = {
      newUpdate: string;
    };
    setUpdateStatus({
      logs: null,
      isChecking: true,
      hasCheckedUpdates: false,
      hasUpdate: false,
      newVersion: null,
    });
    wazigate.get<AppUpdate>(`update/${app.id}`).then(
      (res) => {
        if (res.newUpdate) {
          setUpdateStatus((status) => ({
            logs: status.logs,
            isChecking: false,
            hasCheckedUpdates: true,
            hasUpdate: true,
            newVersion: res.newUpdate,
          }));
        } else {
          setUpdateStatus((status) => ({
            logs: status.logs,
            isChecking: false,
            hasCheckedUpdates: true,
            hasUpdate: false,
            newVersion: null,
          }));
          if (showAlert) alert("The latest version is already installed.");
        }
      },
      (error) => {
        if (showAlert)
          alert("There was an error checking for updates:\n" + error);
      }
    );
  };

  const [hideLogBox, setHideLogBox] = useState(true);

  const update = () => {
    setUpdateStatus({
      logs: "Please wait...",
      isChecking: true,
      hasCheckedUpdates: false,
      hasUpdate: updateStatus?.hasUpdate,
      newVersion: null,
    });

    type InstallStatus = {
      log: string;
      done: boolean;
    };

    const pollStatus = () => {
      wazigate.get<InstallStatus>(`apps/${app.id}?install_logs`).then(
        (res) => {
          setUpdateStatus((status) => ({
            ...status,
            logs: res?.log,
          }));
          if (timeout !== null) {
            timeout = setTimeout(pollStatus, 1000);
          }
        },
        (error) => {
          console.log("There was an error getting the update status:", error);
        }
      );
    };

    var timeout = setTimeout(pollStatus, 1000);

    wazigate.set<any>("update/" + app.id, {}).then(
      () => {
        setUpdateStatus((status) => ({
          ...status,
          isChecking: false,
          hasUpdate: false,
        }));
        clearTimeout(timeout);
        timeout = null;
        load(); // Load again to see new version and looks
      },
      (error) => {
        setUpdateStatus((status) => ({
          ...status,
          isChecking: false,
        }));
        alert("There was an error updating the app:\n" + error);
        clearTimeout(timeout);
        timeout = null;
      }
    );
  };

  //

  const [stopping, setStopping] = useState(false);

  const stop = () => {
    setStopping(true);
    wazigate.setAppConfig(app.id, { action: "stop" } as AppConfig).then(
      (res) => {
        setStopping(false);
        load();
      },
      (error) => {
        setStopping(false);
        alert("Can not perform action:\n" + error);
      }
    );
  };

  /*----------*/

  const [starting, setStarting] = useState(false);

  const start = () => {
    setStarting(true);

    var startAction = app?.state?.startedAt == "" ? "up -d --no-build" : "start";
    wazigate.setAppConfig(app.id, { action: startAction } as AppConfig).then(
      (res) => {
        setStarting(false);
        load();
      },
      (error) => {
        setStarting(false);
        alert("Can not perform action:\n" + error);
      }
    );
  };

  /*----------*/

  const [rePolicyChaing, setResPolicyLoader] = React.useState(false);
  const restartPolicyChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    if (rePolicyChaing) return; // Already on progress
    var newPolicy = event.target.value as string;

    if (!newPolicy || newPolicy == "0") return;

    setResPolicyLoader(true);
    wazigate.setAppConfig(app.id, { restart: newPolicy } as AppConfig).then(
      (res) => {
        setResPolicyLoader(false);
        load();
      },
      (error) => {
        setResPolicyLoader(false);
      }
    );
  };

  /*----------*/

  var fallbackIcon = 0;
  const getDefaultAppIcon = (event: React.ChangeEvent<HTMLImageElement>) => {
    if (fallbackIcon > 1) return; // we try twice to be sure
    event.target.src = defaultLogo;
    fallbackIcon++;
  };

  /*----------*/

  // If I get uninstalled, I hide myself ;)
  if (!app) {
    return <span></span>;
  }

  /*----------*/

  const running = !!app?.state?.running;
  const isSysApp =
    app?.id == "wazigate-edge" || app?.id == "waziup.wazigate-system";

  /*----------*/

  return (
    <Fragment>
      <Card className={className}>
        <CardHeader
          avatar={
            <img
              className={classes.logo}
              src={
                app.id == "wazigate-edge"
                  ? wazigateLogo
                  : wazigate.toProxyURL(app.id, (app as any)?.waziapp?.icon)
              }
              onError={getDefaultAppIcon}
            />
          }
          title={app?.name}
          subheader={
            <a
              href={
                app.homepage ||
                "https://hub.docker.com/r/" + app.id.replace(".", "/")
              }
              target={"_blank"}
            >
              {app.id}
            </a>
          }
        />
        <CardContent>
          {app.state ? (
            <span>
              Status:{" "}
              <span className={classes.boldCap}>
                {app.state.status || "Disabled"}
              </span>
            </span>
          ) : null}
          <p>{`${(app as any)?.description || "."}`}</p>
        </CardContent>
        <CardActions>
          {/* <Tooltip title={updateStatus?.isChecking ? "Checking for new updates..." : (updateStatus?.hasUpdate ? "New update available" : "")}>
            <div>
              <Button
                className={updateStatus?.hasUpdate ? classes.orange :
                  (updateStatus?.isChecking ? "animate-flicker" : "")}
                variant={updateStatus?.hasUpdate ? "contained" : "text"}
                // title={updateStatus?.hasUpdate ? "New update available" : ""}
                startIcon={<UpdateIcon />}
                onClick={showModalUpdate}
              >
                Update
              </Button>
            </div>
          </Tooltip> */}
          <Button startIcon={<SettingsIcon />} onClick={showModalSettings}>
            Settings
          </Button>
          <Tooltip title={isSysApp ? "Not allowed for the system Apps" : ""}>
            <div>
              <Button
                startIcon={<DeleteIcon />}
                disabled={isSysApp}
                onClick={showModalUninstall}
                className={isUninstalling ? "animate-flicker" : ""}
              >
                Uninstall
              </Button>
            </div>
          </Tooltip>
        </CardActions>
      </Card>

      <Fade in={uninstallModal != null}>
        <Dialog
          onClose={hideModalUninstall}
          // open={uninstallModal !== null}
          open={true}
          fullWidth={true}
          maxWidth="xl"
          className={classes.modal}
        >
          <DialogTitle>Uninstall [ {app?.name} ]</DialogTitle>
          <DialogContent dividers>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    onChange={handleKeepConfigChange}
                    checked={!!uninstallModal?.keepConfig}
                  />
                }
                value={!!uninstallModal?.keepConfig}
                label="Keep Config"
              />
            </FormGroup>
            {/* {isUninstalling && <LinearProgress />} */}
          </DialogContent>
          <DialogActions>
            <Tooltip title={isSysApp ? "Not allowed for the system Apps" : ""}>
              <div className={classes.wrapper}>
                <Button
                  onClick={uninstall}
                  color="primary"
                  disabled={isSysApp || isUninstalling}
                  startIcon={<DeleteIcon />}
                >
                  Uninstall now
              </Button>
                {isUninstalling && (
                  <CircularProgress
                    size={24}
                    className={classes.buttonProgress}
                  />
                )}
              </div></Tooltip>
          </DialogActions>
        </Dialog>
      </Fade>

      <Fade in={updateModal != null}>
        <Dialog
          onClose={hideModalUpdate}
          open={true}
          fullWidth={true}
          maxWidth="xl"
          className={classes.modal}
        >
          <DialogTitle>Update [ {app?.name} ]</DialogTitle>
          <DialogContent dividers>
            Current Version:{" "}
            <span className={classes.boldCap}>{app?.version}
              {updateStatus?.hasUpdate ? " (New update available)" :
                (updateStatus?.hasCheckedUpdates ? " (Latest)" : "")}
            </span>
            <br />
            <textarea
              rows={14}
              className={classes.textarea}
              // spellCheck={false}
              // contentEditable={false}
              readOnly={true}
              hidden={hideLogBox || !updateStatus?.logs}
              value={updateStatus?.logs || "."}
            ></textarea>
            <div className={classes.wrapper}>
              {hideLogBox && updateStatus?.logs ? (
                <Button
                  onClick={() => setHideLogBox(false)}
                  color="primary"
                  // variant="contained"
                  startIcon={<DetailsRoundedIcon />}

                >
                  See details
                </Button>) : ""}
            </div>

          </DialogContent>
          <DialogActions>
            <div className={classes.wrapper}>
              {!updateStatus?.hasUpdate ? (
                <Button
                  onClick={() => checkUpdates()}
                  color="primary"
                  startIcon={<UpdateIcon />}
                  disabled={updateStatus?.isChecking}
                >
                  Check for Updates
                </Button>
              ) : (
                  <Button
                    onClick={update}
                    color="primary"
                    variant="contained"
                    startIcon={<UpdateIcon />}
                    disabled={updateStatus?.isChecking}
                  >
                    Update Now
                  </Button>
                )}
              {updateStatus?.isChecking && (
                <CircularProgress
                  size={34}
                  className={classes.buttonProgress}
                />
              )}
            </div>
          </DialogActions>
        </Dialog>
      </Fade>

      <Fade in={settingsModal != null}>
        <Dialog
          onClose={hideModalSettings}
          open={true}
          fullWidth={true}
          maxWidth="xl"
          className={classes.modal}
        >
          <DialogTitle>Settings [ {app?.name} ]</DialogTitle>
          <DialogContent dividers>
            {/* <p>Status: {running ? "Running" : "Stopped"}</p> */}
            <p>
              Status:
              <span className={classes.boldCap}>{" "}
                {`${app?.state?.status || "Unknown"}`}
              </span>
            </p>
            <p>
              Current Version:{" "}
              <span className={classes.boldCap}>{`${app?.version || "Unknown"
                }`}</span>
              {updateStatus?.hasUpdate ? " (New update available)" : (updateStatus?.hasCheckedUpdates ? " (Latest)" : "")}
            </p>
            <p>
              Author:{" "}
              <span className={classes.boldCap}>{`${app?.author?.name || "Unknown"
                }`}</span>
            </p>
            <p>
              Health:{" "}
              <span className={classes.boldCap}>{`${app?.state?.health || "Unknown"
                }`}</span>
            </p>
            <p className="text-capitalize">
              Restart policy:{" "}
              <span className={classes.boldCap}>{`${app?.state?.restartPolicy || "Unknown"
                }`}</span>
            </p>
            <p>{`${(app as any)?.description || ""}`}</p>
          </DialogContent>
          <DialogActions>
            {/* <InputLabel id="restartPolicy">Restart Policy</InputLabel> */}
            <Tooltip title={isSysApp ? "Not allowed for the system Apps" : ""}>


              <div className={classes.wrapper}>
                <Select
                  disabled={isSysApp}
                  // labelId="restartPolicy"
                  id="select-restart-policy"
                  value={app?.state?.restartPolicy || "0"}
                  onChange={restartPolicyChange}
                  color="primary"
                >
                  <MenuItem value="0">Restart Policy</MenuItem>
                  <MenuItem value="always">Always</MenuItem>
                  <MenuItem value="on-failure">On-Failure</MenuItem>
                  <MenuItem value="unless-stopped">Unless-Stopped</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
                {rePolicyChaing && (
                  <CircularProgress
                    size={24}
                    className={classes.buttonProgress}
                  />
                )}
              </div>
            </Tooltip>

            {/* <Button //deactived updates, because they do not work as intended 
              onClick={showModalUpdate}
              color="primary"
              startIcon={<UpdateIcon />}
            >
              Update
            </Button> */}
            <Tooltip title={isSysApp ? "Not allowed for the system Apps" : ""}>

              <div><Button
                onClick={showModalUninstall}
                disabled={isSysApp}
                color="primary"
                startIcon={<DeleteIcon />}
              >
                Uninstall
            </Button></div>
            </Tooltip>
            <Tooltip title={isSysApp ? "Not allowed for the system Apps" : ""}>
              <div className={classes.wrapper}>

                <Button
                  disabled={stopping || !running || isSysApp}
                  onClick={stop}

                  color="primary"
                  startIcon={<StopIcon />}
                >
                  Stop
              </Button>
                {stopping && (
                  <CircularProgress
                    size={24}
                    className={classes.buttonProgress}
                  />
                )}
              </div>
            </Tooltip>
            <div className={classes.wrapper}>
              <Button
                disabled={starting || running}
                onClick={start}
                color="primary"
                startIcon={<PlayArrowIcon />}
              >
                Start
              </Button>
              {starting && (
                <CircularProgress
                  size={24}
                  className={classes.buttonProgress}
                />
              )}
            </div>


          </DialogActions>
        </Dialog>
      </Fade>
    </Fragment>
  );
}
