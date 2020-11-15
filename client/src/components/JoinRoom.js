import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { FiMicOff, FiVideoOff } from "react-icons/fi";
import { FaHandPaper } from "react-icons/fa";
import {
  BsFillMicFill,
  BsFillCameraVideoFill,
  BsChatDotsFill,
  BsFillReplyFill,
} from "react-icons/bs";
import Checkbox from "@material-ui/core/Checkbox";
import "../css/JoinRoom.css";
import { Box, Dialog, IconButton, Slide, Typography } from "@material-ui/core";
import Snackbar from "@material-ui/core/Snackbar";
import { MdClear } from "react-icons/md";
import { v4 as uuid } from "uuid";

const JoinRoom = ({ match }) => {
  const roomId = match.params.roomId;
  const name = match.params.name;

  const HOSTID = useRef(0);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const localStreamRef = useRef(null);
  const socketRef = useRef();
  const peerRef = useRef();
  const msg = useRef("Connecting...");
  const snackbarTime = useRef(60000);
  const snackbarPosition = useRef("bottom");
  const unMuteAudioPermissionEnabled = useRef(false);
  const chatMsgs = useRef([]);
  const [reply, setreply] = useState("");

  const [audio, setAudio] = React.useState(false);
  const [video, setVideo] = React.useState(true);
  const [openSnackBar, setOpenSnackBar] = React.useState(true);
  const [openChat, setOpenChat] = React.useState(false);
  const [haveRemoteStream, setHaveRemoteStream] = React.useState(false);
  const [chats, setchats] = useState([]);

  const riseHandMsg = "Rise hand";
  const askDoubtMsg = "Ask doubt now";
  const normalTime = 1500;
  const noAudioPermission = "Your audio is muted!";

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { max: 640 },
          height: { max: 480 },
        },
        audio: true,
      })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        localStreamRef.current = stream;
        socketConfig();
      })
      .catch((err) => {
        alert(`Error:${err}`);
      });
  }, []);

  /////////////////////////////////////////////////////////SOCKET SERVER LISTENERS AND SENDERS /////////////////////////////////////
  const socketConfig = () => {
    socketRef.current = io.connect("/");
    socketRef.current.emit("join room", roomId);
    socketRef.current.on("hostId", getOffer);
    socketRef.current.on("answer", handleReceiveAnswer);
    socketRef.current.on("no room", () => {
      setOpenSnackBar(false);
      alert("No class going on.");
    });
    socketRef.current.on("host left", () => setHaveRemoteStream(false));
    socketRef.current.on("ice-candidate", (data) => {
      const candidate = new RTCIceCandidate(data.val);
      peerRef.current
        .addIceCandidate(candidate)
        .then(() => {
          console.log("Added");
        })
        .catch((e) => {
          console.log(`candidate error:${e}`);
        });
    });
    socketRef.current.on("unMute", () => {
      toggleSnackBar(askDoubtMsg, normalTime, true);
      unMuteAudioPermissionEnabled.current = true;
      toggleAudio(true);
    });
    socketRef.current.on("replyMsg", (data) =>
      updateChat({id:data.id,isSend: false, message: data.msg })
    );
  };

  function getOffer(hostID) {
    setOpenSnackBar(false);
    HOSTID.current = hostID;
    const configuration = {
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
    };
    peerRef.current = new RTCPeerConnection(configuration);

    localStreamRef.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, localStreamRef.current);
    });

    peerRef.current.onicecandidate = (e) => {
      handleIceCandidate(e, hostID);
    };
    peerRef.current.ontrack = handleTrack;
    peerRef.current.onnegotiationneeded = () => {
      handleNegotiation(hostID);
    };
    peerRef.current.onsignalingstatechange = (e) => {
      console.log(`SIGNAL STATE:${e.target.signalingState}`);
    };
  }

  ////////////////////////////////////PEER CONNECTION CALLBACKS/////////////////////////////////////////////
  function handleIceCandidate(e, host) {
    if (e.candidate) {
      const data = {
        to: host,
        candidate: e.candidate,
      };
      socketRef.current.emit("ice-candidate", data);
    }
  }
  function handleTrack(e) {
    setOpenSnackBar(false);
    setHaveRemoteStream(true);
    remoteVideoRef.current.srcObject = e.streams[0];
  }

  function handleNegotiation(hostid) {
    // console.log("handleNegotiation")
    peerRef.current
      .createOffer()
      .then((offer) => {
        peerRef.current.setLocalDescription(offer);
      })
      .then(() => {
        const data = {
          to: hostid,
          sdp: peerRef.current.localDescription,
        };
        socketRef.current.emit("offer", data);
      })
      .catch((e) => {
        alert(`Error occured : ${e}`);
      });
  }

  function handleReceiveAnswer(hostData) {
    const desc = new RTCSessionDescription(hostData.sdp);
    peerRef.current
      .setRemoteDescription(desc)
      .catch((e) => alert(`Error:${e}`));
  }

  /////////////////////////////////////////////////// FUNCTIONS /////////////////////////////////////////////////////

  const handleChange = (event) => {
    if (localStreamRef.current != null) {
      if (event.target.name === "audio") toggleAudio(event.target.checked);
      else toggleVideo(event.target.checked);
    }
  };
  function toggleAudio(isEnabled) {
    if (unMuteAudioPermissionEnabled.current) {
      localStreamRef.current.getAudioTracks()[0].enabled = isEnabled;
      setAudio(isEnabled);
      return;
    }
    toggleSnackBar(noAudioPermission, normalTime, true);
  }
  function toggleVideo(isEnabled) {
    localStreamRef.current.getVideoTracks()[0].enabled = isEnabled;
    setVideo(isEnabled);
  }

  const toggleSnackBar = (msgToShow, time, isOpen) => {
    msg.current = msgToShow;
    snackbarTime.current = time;
    setOpenSnackBar(isOpen);
  };

  const askDoubt = () => {
    if (localStreamRef.current != null) {
      sendNewDoubt(true);
      toggleSnackBar(riseHandMsg, normalTime, true);
    }
  };
  const sendMsg = () => {
    if (reply !== "") {
      sendNewDoubt(false);
      setreply("");
    }
  };

  const updateChat = (data) => {
    chatMsgs.current.push(data);
    setchats([...chats, data]);
  };
  const closeChatPopup = (event, reason) => setOpenChat(false);
  const handleReplyChange = (e) => setreply(e.target.value);
  const openChatPopup = () => setOpenChat(true);
  const closeSnackBar = (event, reason) => {
    reason !== "clickaway" && setOpenSnackBar(false);
  };
  const sendNewDoubt = (isQnTypeAudio) => {
    const uniqueID = uuid();
    socketRef.current.emit("new-message", {
      id: uniqueID,
      name: name,
      isQnTypeAudio: isQnTypeAudio,
      qn: reply,
      userID: "",
      hostId: HOSTID.current,
    });
    !isQnTypeAudio && updateChat({id:uniqueID,isSend: true, message: reply });
  };
  /////////////////////////////////////////////////// WIDGET /////////////////////////////////////////////////////

  return (
    <div className="main">
      <div className="video-container">
        <video
          muted
          ref={localVideoRef}
          autoPlay
          hidden={haveRemoteStream}
        ></video>
        <video ref={remoteVideoRef} autoPlay hidden={!haveRemoteStream}></video>
      </div>

      {/* //////////////////////////////////////////////////toolbar///////////////////////////////////////////////////////// */}
      {haveRemoteStream ? (
        <Box
          bgcolor="rgb(25 25 25)"
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          {/* ///////////  */}
          <Box>
            <Checkbox
              checkedIcon={<BsFillMicFill color="white" size="32" />}
              icon={<FiMicOff color="white" size="32" />}
              checked={audio}
              name="audio"
              onChange={handleChange}
              inputProps={{ "aria-label": "primary checkbox" }}
            />

            <Checkbox
              checkedIcon={<BsFillCameraVideoFill color="white" size="32" />}
              icon={<FiVideoOff color="white" size="32" />}
              checked={video}
              name="video"
              onChange={handleChange}
              inputProps={{ "aria-label": "primary checkbox" }}
            />
          </Box>

          {/* /////////////////////////////////////////////*/}
          <Box>
            <IconButton
              onClick={askDoubt}
              aria-label="upload picture"
              component="span"
            >
              <FaHandPaper color="white" />
            </IconButton>
            <IconButton
              onClick={openChatPopup}
              aria-label="upload picture"
              component="span"
            >
              {" "}
              <BsChatDotsFill color="white" />
            </IconButton>
          </Box>
        </Box>
      ) : (
        ""
      )}
      {/* ///////toolbar end////// */}

      <Snackbar
        anchorOrigin={{
          vertical: snackbarPosition.current,
          horizontal: "center",
        }}
        open={openSnackBar}
        autoHideDuration={snackbarTime.current}
        message={msg.current}
        TransitionComponent={Slide}
        onClose={closeSnackBar}
      />

      <Dialog
        fullScreen
        open={openChat}
        onClose={closeChatPopup}
        TransitionComponent={Slide}
      >
        <Box
          bgcolor="black"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          color="white"
          paddingLeft="16px"
        >
          <Typography onClick={closeChatPopup}>
            <b>Chat</b>
          </Typography>
          <IconButton onClick={closeChatPopup} aria-label="close">
            <MdClear color="white" />
          </IconButton>
        </Box>

        <Box height="100%" overflow="scroll">
          {chatMsgs.current.map((msg) => {
            return (
              <Box key={msg.id} textAlign={msg.isSend ? "end" : "start"}>
                <span  className="chatItem">{msg.message}</span>
              </Box>
            );
          })}
        </Box>

        <Box bgcolor="black" display="flex">
          <input
            className="inputStyle"
            type="text"
            required
            onChange={handleReplyChange}
            value={reply}
          />
          <IconButton
            onClick={sendMsg}
            color="primary"
            aria-label="upload picture"
            component="span"
          >
            <BsFillReplyFill color="white" />
          </IconButton>
        </Box>
      </Dialog>
    </div>
  );
};
export default JoinRoom;
