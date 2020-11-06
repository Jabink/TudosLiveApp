import React, { useEffect, useRef, useState } from "react";
import Box from "@material-ui/core/Box";
import io from "socket.io-client";
import "../css/CreateRoom.css";
import useDynamicRefs from "use-dynamic-refs";
import { Button, IconButton, Tooltip } from "@material-ui/core";
import { FaBorderAll, FaExpand } from "react-icons/fa";
import { FiMicOff, FiVideoOff } from "react-icons/fi";
import { CgScreenMirror } from "react-icons/cg";
import { BsFillMicFill, BsFillCameraVideoFill } from "react-icons/bs";
import Checkbox from "@material-ui/core/Checkbox";
import WhiteBoard from "./WhiteBoard";
import { MdClear } from "react-icons/md"; 


const CreateRoom = ({ match }) => {
  const roomId = match.params.roomId;

  const localVideoRef = useRef();

  const localStreamRef = useRef();
  const screenShareStreamRef = useRef(null);
  const socketRef = useRef();

  const peerRef = useRef([]);
  const senders = useRef([]);

  const [getRef, setRef] = useDynamicRefs();

  const [audio, setAudio] = React.useState(true);
  const [video, setVideo] = React.useState(true);
  const [onLive, setOnLive] = React.useState(false);
  const [isShowingVideo, setIsShowingVideo] = useState(true);
  const [newJoinee, setNewJoinee] = useState();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        localStreamRef.current = stream;
      })
      .catch((err) => {
        alert(`Error:${err}`);
      });
  }, []);

  ///////////////////////////////////////SOCKET LISTENERS AND SENDERS ////////////////////////////
  const goLive = () => {
    socketRef.current = io.connect("/");
    socketRef.current.emit("create room", roomId);
    socketRef.current.on("offer", handleReceiveOffer);
    socketRef.current.on("ice-candidate", (data) => {
      const candidate = new RTCIceCandidate(data.val);
      const peers = peerRef.current.filter(
        (peer) => peer.userID === data.userID
      );
      if (peers.length !== 0) {
        const peer = peers[0].peer;
        peer
          .addIceCandidate(candidate)
          .then(() => {
            console.log("Added");
          })
          .catch((e) => {
            console.log(`candidate error:${e}`);
          });
      }
    });
    socketRef.current.on("user left", (joineeId) => {
      const data = peerRef.current.filter((item) => item.userID !== joineeId);
      peerRef.current = [...data];
      setNewJoinee(joineeId + "disconnected");
    });
    setOnLive(true);
  };

  ///////////////////////////////////PEER CONNECTION SETUP/////////////////////////////////////
  function handleReceiveOffer(joineeData) {
    // console.log(`REMOTE OFFER`);
    const peer = createPeer(joineeData.from);
    const desc = new RTCSessionDescription(joineeData.sdp);
    peer
      .setRemoteDescription(desc)
      .then(() => {
        localStreamRef.current
          .getTracks()
          .forEach((track) => {
            const mTrack = peer.addTrack(track, localStreamRef.current);
            if(track.kind==="video"){
            senders.current.push(mTrack);
              if(screenShareStreamRef.current!=null){
                mTrack.replaceTrack(screenShareStreamRef.current)
              }
            }           
          });
      })
      .then(() => {
        return peer.createAnswer();
      })
      .then((answer) => {
        peer.setLocalDescription(answer);
      })
      .then(() => {
        socketRef.current.emit("answer", {
          to: joineeData.from,
          sdp: peer.localDescription,
        });
      });

    peerRef.current.push({ userID: joineeData.from, peer });
    setNewJoinee(joineeData.from);
  }



  function createPeer(userID) {
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
    const peer = new RTCPeerConnection(configuration);
    peer.onicecandidate = (e) => {
      handleIceCandidate(e, userID);
    };
    peer.ontrack = (e) => {
      handleTrack(e, userID);
    };
    peer.onsignalingstatechange = (e) => {
      console.log(`SIGNAL STATE:${e.target.signalingState}`);
    };
    peer.onnegotiationneeded = handleNegotiation;
    return peer;
  }
  function handleIceCandidate(e, joinee) {
    if (e.candidate) {
      socketRef.current.emit("ice-candidate", {
        to: joinee,
        candidate: e.candidate,
      });
    }
  }
  function handleTrack(e, userID) {
    getRef(userID).current.srcObject = e.streams[0];
  }
  function handleNegotiation() {
    console.log("handleNegotiation");
  }

  //////////////////////////////////////////////////WIDGET FUNCTION HANDLERS///////////////////////////////
  const handleChange = (event) => {
    const toggle = event.target.checked;
    setIsShowingVideo(toggle);
  };

  const leaveRoom = () => {
    socketRef.current.disconnect();
    peerRef.current = [];
    setNewJoinee("callEnd");
    setOnLive(false);
  };

  const handleMediaChange = (event) => {
    if (event.target.name === "audio") {
      localStreamRef.current.getAudioTracks()[0].enabled = event.target.checked;
      setAudio(event.target.checked);
    } else {
      localStreamRef.current.getVideoTracks()[0].enabled = event.target.checked;
      setVideo(event.target.checked);
    }
  };
  const shareScreen=()=>{
    navigator.mediaDevices.getDisplayMedia({cursor:true}).then(stream=>{
      const screenTrack = stream.getTracks()[0];
      screenShareStreamRef.current = screenTrack;
      screenTrack.onended = ()=>{
        screenShareStreamRef.current = null;
        senders.current.forEach(sender=>{
          sender.replaceTrack(localStreamRef.current.getVideoTracks()[0])
        })
      }
      if(peerRef.current.length!==0){
        senders.current.forEach(sender=>{
          sender.replaceTrack(screenTrack)
        })
      }
    })
  }

  ///////////////////////////////////////////////////WIDGET////////////////////////////////////////////////////////////////
  return (
    <Box
      width="100vw"
      height="100vh"
      bgcolor="black"
      className="createRoom"
      display="flex"
      flexDirection="column"
    >
      {/* <Box
        width="100%"
        color="white"
        position="absolute"
        bgcolor="rgb(25 25 25)"
      >
        Top Banner
      </Box> */}

      {/* middle banner */}
      <Box
        width="100vw"
        height="100vh"
        color="white"
        flexGrow="1"
        paddingBottom="10vh"
      >
        <Box
          width="100%"
          height="100%"
          hidden={isShowingVideo}
          bgcolor="white"
          color="black"
        >
        <WhiteBoard></WhiteBoard>
        </Box>

        <Box
          width="100%"
          height="100%"
          hidden={!isShowingVideo}
          style={{ overflowY: "scroll" }}
        >
          <video
            height="100%"
            muted
            autoPlay
            ref={localVideoRef}
            className="MyVideo"
          ></video>
          {peerRef.current.map((item) => (
            <video
              key={item.userID}
              autoPlay
              ref={setRef(item.userID)}
              className="MyVideo"
            ></video>
          ))}
        </Box>
      </Box>
      {/* bottom banner */}
      <Box
        position="absolute"
        bottom="0"
        width="100%"
        height="10vh"
        color="white"
        padding="0em 1em 0.5em 1em"
        bgcolor="rgb(25 25 25)"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <div>
          <Checkbox
            checked={isShowingVideo}
            icon={<FaExpand color="white" />}
            checkedIcon={<FaBorderAll color="white" />}
            onChange={handleChange}
          />

          { 
<React.Fragment>



<Tooltip title="Share screen">
  <IconButton color="primary" aria-label="upload picture" component="span"  onClick={shareScreen}>
    <CgScreenMirror color="white"/>
    </IconButton></Tooltip>



</React.Fragment> } 
        </div>

        <div>
          <Checkbox
            checkedIcon={<BsFillMicFill color="white" />}
            icon={<FiMicOff color="white" />}
            checked={audio}
            name="audio"
            onChange={handleMediaChange}
          />

          <Checkbox
            checkedIcon={<BsFillCameraVideoFill color="white" />}
            icon={<FiVideoOff color="white" />}
            checked={video}
            name="video"
            onChange={handleMediaChange}
          />
        </div>

        <div>
          {onLive ? (
            <Button
              className="btn"
              size="small"
              variant="contained"
              color="secondary"
              onClick={leaveRoom}
            >
              LEAVE
            </Button>
          ) : (
            <Button
              className="btn"
              size="small"
              variant="contained"
              color="secondary"
              onClick={goLive}
            >
              Go live
            </Button>
          )}
        </div>
      </Box>
    </Box>
  );
};
export default CreateRoom;
