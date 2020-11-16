import React, { useEffect, useRef, useState } from "react";
import FaculitySideBar from "./FaculitySideBar";
import FacultyBottomToolbar from "./FacultyBottomToolbar";
import io from "socket.io-client";
import { Box, Slider, Tooltip } from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import { MdClear } from "react-icons/md";
import { BiEraser, BiPen } from "react-icons/bi";
import { BsCircle, BsSquare, BsTriangle } from "react-icons/bs";
import useDynamicRefs from "use-dynamic-refs";




export default function FaculityRoom({ match }) {
  // refs
  const socketRef = useRef(null);
  const dragStartLocation = useRef(null);
  const drawType = useRef("hand");
  const localVideoRef = useRef();
  const localStreamRef = useRef();
  const [getRef, setRef] = useDynamicRefs();
  // state
  const [peers,setPeers] = useState([])
  const [audio, setAudio] = useState(true);
  const [video, setVideo] = useState(true);
  const [image, setImage] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [open, setOpen] = useState(false);
  const [view, setview] = useState(1); ///face camera,tools,whiteboard
  // vals
  const totalViews = 3;
  const hand = "hand";
  const circle = "circle";
  const triangle = "triangle";
  const square = "square";

  const toggleLive = (isStartLive) =>
    isStartLive
      ? goLive()
      : endLive()

  const endLive=()=>{
    socketRef.current !== null && socketRef.current.disconnect();
    setPeers([]);
    setOpen(false); 
  }    
  const goLive = () => {
    socketRef.current = io.connect("/");
    socketRef.current.emit("create room", match.params.roomId);
    socketRef.current.on("offer", handleReceiveOffer);
    socketRef.current.on("new-message", (data) => {
      setDoubts((prevDoubts) => prevDoubts.concat(data));
    });
    socketRef.current.on("ice-candidate", (data) => {
      const candidate = new RTCIceCandidate(data.val);
      const mpeers = peers.filter((peer) => peer.userID === data.userID);
      if (mpeers.length !== 0) {
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
      setPeers((prevPeers) => prevPeers.filter((item) => item.userID !== joineeId));
    });
  };
  //////////////////SOCKET FUNCTIONS
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
    setPeers(prevPeers=>prevPeers.concat({ userID: joineeData.from, peer }))
  }
  //PEER CONNECTION
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
  //PEER CALLBACK
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

  

  const switchView = () => {
    const viewCount = view + 1;
    viewCount > totalViews ? setview(1) : setview(viewCount);
  };
  const closeImage = () => {
    setImage(null);
    if (view === 2) setview(1);
  };
  const toggleParticipantsPopup = () => setOpen(!open);
  const unMuteUser = (id, userId) => unMuteOrReplyMsg("unMute", id, userId);
  const replyMsg = (data) => unMuteOrReplyMsg("replyMsg", data.msgID, data);

  const unMuteOrReplyMsg = (emitEventName, id, data) => {
    socketRef.current.emit(emitEventName, data);
    setDoubts((prevDoubts) => prevDoubts.filter((item) => item.id !== id));
  };
  ///LOCAL VIDEO
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        localStreamRef.current = stream;
      })
      .catch((err) => {
        alert("Accessing camera is denied in your device")
      });
  }, []);
  const handleMediaChange = (event) => {
    if (event.target.name === "audio") {
      localStreamRef.current.getAudioTracks()[0].enabled = event.target.checked;
      setAudio(event.target.checked);
    } else {
      localStreamRef.current.getVideoTracks()[0].enabled = event.target.checked;
      setVideo(event.target.checked);
    }
  };
  /////SHARE SCREEN
  const screenShareStreamRef = useRef(null);
  const senders = useRef([]);
  const shareScreen = () => {
    navigator.mediaDevices.getDisplayMedia({ cursor: true }).then((stream) => {
      const screenTrack = stream.getTracks()[0];
      screenShareStreamRef.current = screenTrack;
      screenTrack.onended = () => {
        screenShareStreamRef.current = null;
        senders.current.forEach((sender) => {
          sender.replaceTrack(localStreamRef.current.getVideoTracks()[0]);
        });
      };
      if (peers.length !== 0) {
        senders.current.forEach((sender) => {
          sender.replaceTrack(screenTrack);
        });
      }
    });
  };
  /////Canvas
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const colorPicker = useRef(null);
  const [isDrawing, setisDrawing] = useState(false);
  const [value, setValue] = useState(1);
  const inkColor = useRef("#111");
  
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.strokeStyle = inkColor.current;
    context.fillStyle = inkColor.current;
    context.lineWidth = 2;
    contextRef.current = context;
  }, []);

  const handleColorPick = (e) => {
    contextRef.current.strokeStyle = e.target.value;
    contextRef.current.fillStyle = e.target.value;
    inkColor.current = e.target.value;
  };
  const eraseDrawing = () => (contextRef.current.strokeStyle = "#fff");
  const handleChange = (event, newValue) => {
    contextRef.current.lineWidth = newValue;
    setValue(newValue);
  };
  const clear = () => {
    contextRef.current.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    setPen();
  };
  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    dragStartLocation.current = { offsetX, offsetY };
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setisDrawing(true);
  };
  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    if (drawType.current === hand) {
      freeHandDraw(offsetX, offsetY);
    } else if (drawType.current === square) {
      drawSquare(offsetX, offsetY);
    } else if (drawType.current === circle) {
      drawCircle(offsetX, offsetY);
    } else if (drawType.current === triangle) {
      drawTriangle(offsetX, offsetY);
    }
  };
  const finishDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.closePath();
    if (drawType.current === circle) {
      drawCircle(offsetX, offsetY);
    } else if (drawType.current === square) {
      drawSquare(offsetX, offsetY);
    } else if (drawType.current === triangle) {
      drawTriangle(offsetX, offsetY);
    }
    setisDrawing(false);
  };
  // Drawing types
  const drawSquare = (x, y) => {
    const distance =
      dragStartLocation.current.offsetX -
      x +
      dragStartLocation.current.offsetY -
      y;
    contextRef.current.fillRect(x, y, distance, distance);
  };
  const drawCircle = (x, y) => {
    const radius = Math.sqrt(
      Math.pow(dragStartLocation.current.offsetX - x, 2) +
        Math.pow(dragStartLocation.current.offsetY - y, 2),
      2
    );
    contextRef.current.arc(
      dragStartLocation.current.offsetX,
      dragStartLocation.current.offsetY,
      radius,
      0,
      2 * Math.PI,
      false
    );
    contextRef.current.fill();
  };
  const drawTriangle = (x, y) => {
    // contextRef.current.lineTo(dragStartLocation.current.offsetX+x,dragStartLocation.current.offsetY)
    // contextRef.current.lineTo(dragStartLocation.current.offsetX,y+dragStartLocation.current.offsetY)
    // contextRef.current.fill();
  };
  const freeHandDraw = (x, y) => {
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };
  //change drawing type
  const addSquare = () => (drawType.current = square);
  const addCircle = () => (drawType.current = circle);
  const addTriangle = () => (drawType.current = triangle);
  const setPen = () => {
    drawType.current = hand;
    contextRef.current.strokeStyle = colorPicker.current.value;
  };
  //popup
  const openPopup = {transition: "all 0.3s",top:0}
  const closePopup = {transition: "all 0.3s",top:"-100%"}
  function getPopupStyle(){
    return open ? openPopup : closePopup;
  }

  ///////////////////////////////////////////// widget
  return (
    <div>
      <Box width="100%" height="100%" bgcolor="white" position="absolute">
        <canvas
          style={{ position: "absolute" }}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          ref={canvasRef}
        />
        <Box position="absolute" right="0" display="flex" alignItems="center">
          <span>Stroke</span>
          <Slider
            value={value}
            min={1}
            max={30}
            onChange={handleChange}
            style={{ minWidth: "200px", margin: "0px 8px" }}
          />

          <IconButton color="primary" onClick={addSquare}>
            <BsSquare />
          </IconButton>
          <IconButton color="primary" onClick={addCircle}>
            <BsCircle />
          </IconButton>
          {/* <IconButton color="primary" onClick={addTriangle}>
            <BsTriangle />
          </IconButton> */}
          <input
            ref={colorPicker}
            type="color"
            onChange={handleColorPick}
            style={{ minWidth: "24px" }}
          />

          <Tooltip title="Pen">
            <IconButton color="primary" onClick={setPen}>
              <BiPen />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eraser">
            <IconButton color="primary" onClick={eraseDrawing}>
              <BiEraser />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear">
            <IconButton color="primary" onClick={clear}>
              <MdClear />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <FaculitySideBar
        localVideoRef={localVideoRef}
        qns={doubts}
        viewType={view}
        unMuteUser={unMuteUser}
        replyMsg={replyMsg}
        video={video}
      ></FaculitySideBar>

      <FacultyBottomToolbar
        shareScreen={shareScreen}
        audio={audio}
        video={video}
        handleMediaChange={handleMediaChange}
        setImage={setImage}
        toggleLive={toggleLive}
        viewType={view}
        switchView={switchView}
        toggleParticipantsPopup={toggleParticipantsPopup}
      ></FacultyBottomToolbar>

      {/* image wrapper */}
      <Box
        hidden={image === null}
        bgcolor="black"
        position="fixed"
        zIndex="30"
        right="0"
        color="black"
        height="90vh"
      >
        <IconButton onClick={closeImage} aria-label="close">
          <MdClear color="white" />
        </IconButton>
      </Box>

      <Box
        hidden={image === null}
        bgcolor="#121212"
        height="90vh"
        width={view === 3 ? "100%" : "80%"}
        position="absolute"
        zIndex="20"
        right="0"
      >
        <img
          src={image}
          alt="IMG"
          style={{
            height: "100%",
            width: "100%",
            objectFit: "contain",
          }}
        />
      </Box>
      {/* participants popup */}
      <Box
      width="100%"
      height="100%"
      position="absolute"
      zIndex="100"  
      style={getPopupStyle()}     
      >
        <IconButton
          style={{ position: "fixed" }}
          onClick={toggleParticipantsPopup}
          aria-label="close"
        >
          <MdClear color="white" />
        </IconButton>
        <Box bgcolor="black" height="100%" width="100%" color="white" paddingTop="3%">
        {peers.map((item) => (
            <video
              key={item.userID}
              autoPlay
              ref={setRef(item.userID)}
              className="MyVideo"
            ></video>
          ))}
        </Box>
      </Box>

      
    </div>
  );
}
