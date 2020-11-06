import React, { useEffect, useRef } from "react";
import io from "socket.io-client";
import { FiMicOff, FiVideoOff } from "react-icons/fi";
import { BsFillMicFill, BsFillCameraVideoFill } from "react-icons/bs";
import Checkbox from "@material-ui/core/Checkbox";
import "../css/JoinRoom.css";
import CircularProgress from "@material-ui/core/CircularProgress";

const JoinRoom = ({ match }) => {
  const roomId = match.params.roomId;

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  const localStreamRef = useRef();
  const socketRef = useRef();
  const peerRef = useRef();

  const [audio, setAudio] = React.useState(true);
  const [video, setVideo] = React.useState(true);
  const [haveRemoteStream, setHaveRemoteStream] = React.useState(false);


  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: {
        width:{max:640},
        height:{max:480},
      }, audio: true })
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
      alert("No room exist");
    });
    socketRef.current.on("host left", () => setHaveRemoteStream(false) );

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
  };

  function getOffer(hostID) {
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
    if (event.target.name === "audio") {
      localStreamRef.current.getAudioTracks()[0].enabled = event.target.checked;
      setAudio(event.target.checked);
    } else {
      localStreamRef.current.getVideoTracks()[0].enabled = event.target.checked;
      setVideo(event.target.checked);
    }
  };

  /////////////////////////////////////////////////// WIDGETS /////////////////////////////////////////////////////
  const Loading = () => {
    return (
      <div className="loader">
        <CircularProgress />
        <p>Connectng...</p>
      </div>
    );
  };

  /////////////////////////////////////////////////// WIDGET /////////////////////////////////////////////////////

  return (
    <div className="main">
      {haveRemoteStream || remoteVideoRef.current ? "" : <Loading />}

      <div className="video-container">
        <video
          muted
          ref={localVideoRef}
          autoPlay
          hidden={haveRemoteStream}
        ></video>
        <video ref={remoteVideoRef} autoPlay hidden={!haveRemoteStream}></video>
      </div>

      <div className="toolbar">
        <div>
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
        </div>
        {/* <Button className="btn" variant="contained" color="secondary" >
          LEAVE
        </Button> */}
      </div>
    </div>
  );
};
export default JoinRoom;
