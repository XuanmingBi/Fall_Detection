import { useState, useEffect, useRef } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Input,
  Space,
  Typography,
  message,
  Alert,
} from "antd";
import { useThemeStore } from "../store/themeStore";
import { settingsApi } from "../services/api";
import { AudioOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { webSocketService } from "../services/websocket";

const { Title, Text } = Typography;
const { TextArea } = Input;

const Monitoring = () => {
  const [isFallDetected, setIsFallDetected] = useState(false);
  const [isEmergencyModalVisible, setIsEmergencyModalVisible] = useState(false);
  const [userResponse, setUserResponse] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isAssessing, setIsAssessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { notificationSettings, notifyEmergency } = useThemeStore();

  // 不再需要从API获取通知设置，直接从本地存储获取
  useEffect(() => {
    // 组件初始化逻辑
  }, []);

  // Connect to WebSocket service
  useEffect(() => {
    // No longer need to simulate fall detection events since using a real WebSocket service now
    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  // Initialize video stream and WebSocket connection
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = "http://localhost:5000/video_feed"; // 使用 Flask 提供的视频流地址
    }
  }, []);

  // Add a state to store the ID of the current fall event
  const [currentFallId, setCurrentFallId] = useState<string>("");

  const handleFallDetection = (fallData?: any) => {
    setIsFallDetected(true);
    setIsEmergencyModalVisible(true);

    // If there is fall data, save the fall ID
    if (fallData && fallData.fallId) {
      setCurrentFallId(fallData.fallId);

      // If there is bounding box data, it can be displayed on the UI
      // Here, you can set the position of the bounding box according to fallData.boundingBox
    }

    // Only start the countdown if notifyEmergency is enabled
    if (notifyEmergency) {
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // When the countdown ends, trigger the emergency alert
            clearInterval(countdownTimerRef.current as NodeJS.Timeout);
            triggerEmergencyAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const triggerEmergencyAlert = () => {
    // Only trigger the alert when the notification setting is on
    if (notifyEmergency) {
      message.error(
        "Emergency alert triggered! Notifying emergency contacts..."
      );

      // Send the emergency alert via WebSocket
      if (currentFallId) {
        webSocketService.sendEmergencyAlert(currentFallId);
      }

      // You can add other emergency contact notification logic here
    } else {
      message.info(
        "Notification setting is off. Emergency alert not triggered"
      );
    }
  };

  // Add a state to store the recording object
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        setAudioChunks(chunks);
      };

      recorder.start();
      setIsRecording(true);
      message.info("Start recording...");
    } catch (error) {
      console.error("Failed to access the microphone:", error);
      message.error(
        "Failed to access the microphone. Please check the permission settings"
      );
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      message.info("Recording ended. Analyzing...");
      setIsAssessing(true);

      // In a real project, the recording data would be sent to the backend for speech recognition and AI analysis
      // Here we simulate this process with the audioChunks data
      setTimeout(() => {
        if (audioChunks.length > 0) {
          // Create a blob from the audio chunks
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

          // In a real implementation, we would send this blob to the backend
          console.log(`Audio recording complete: ${audioBlob.size} bytes`);

          // Simulate sending the audio to the backend and getting a response
          message.info("Sending audio to server for analysis...");

          // Mock different responses based on random selection to simulate variety
          const mockResponses = [
            "I fell down, but I can stand up. My right ankle hurts a bit",
            "I slipped and fell, but I'm okay. Just a little shaken",
            "I fell from my chair, but I'm not hurt. I can get up on my own",
            "I tripped and fell. My knee hurts and I might need some help",
          ];

          const recognizedText =
            mockResponses[Math.floor(Math.random() * mockResponses.length)];
          setUserResponse(recognizedText);

          // If there is a fall ID, send the user response
          if (currentFallId) {
            // In a real implementation, we would send the audio blob along with the fall ID
            webSocketService.sendUserResponse(currentFallId, recognizedText);
          }

          // Simulate AI analysis based on the recognized text
          setTimeout(() => {
            // Different AI responses based on the user's response
            let aiResponseText = "";
            if (
              recognizedText.includes("hurt") ||
              recognizedText.includes("pain")
            ) {
              aiResponseText =
                "According to your description, you may have a minor injury. It is recommended that you keep the affected area cold-compressed, elevated, and rest. If the pain persists or worsens, please seek medical attention immediately.";
            } else if (recognizedText.includes("help")) {
              aiResponseText =
                "Based on your situation, it seems you might need assistance. I've notified your emergency contacts. Try to remain calm and still until help arrives.";
            } else {
              aiResponseText =
                "Based on your description, you appear to be okay. However, please monitor for any delayed symptoms such as dizziness, pain, or discomfort. Rest for a while and avoid sudden movements.";
            }

            setAiResponse(aiResponseText);
            setIsAssessing(false);
          }, 1500);
        } else {
          message.error("No audio data recorded. Please try again.");
          setIsAssessing(false);
        }
      }, 1000);
    }
  };

  const handleConfirmOk = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    // Cancel the emergency alert
    if (currentFallId) {
      webSocketService.cancelEmergencyAlert(currentFallId);
    }

    setIsEmergencyModalVisible(false);
    setIsFallDetected(false);
    setUserResponse("");
    setAiResponse("");
    setCountdown(30);
    setCurrentFallId("");
  };

  return (
    <div>
      <Title level={2}>Real-time Monitoring</Title>

      {isFallDetected && (
        <Alert
          message="Fall detection event detected!"
          description="The system has detected a possible fall event. Please confirm your status."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16}>
        <Col span={16}>
          <Card title="Monitoring Screen" bordered={false}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "500px",
                background: "#000",
              }}
            >
              <img
                ref={videoRef}
                src="http://localhost:5000/video_feed"
                alt="Camera feed"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {isFallDetected && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "4px solid red",
                    boxSizing: "border-box",
                    animation: "pulse 1.5s infinite",
                  }}
                />
              )}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title="Status Information"
            bordered={false}
            style={{ marginBottom: 16 }}
          >
            <p>
              <strong>Monitoring Status:</strong>{" "}
              {isFallDetected ? "Fall detected!" : "Normal"}
            </p>
            <p>
              <strong>Camera:</strong> Connected
            </p>
            <p>
              <strong>Microphone:</strong> Connected
            </p>
            <p>
              <strong>AI Analysis:</strong> Enabled
            </p>
          </Card>

          <Card title="Operations" bordered={false}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                type="primary"
                icon={<VideoCameraOutlined />}
                block
                onClick={async () => {
                  try {
                    // Stop the current video stream first
                    webSocketService.stopVideoStream();

                    // Re-initialize the video stream
                    if (videoRef.current) {
                      await webSocketService.startVideoStream(videoRef.current);
                      message.success("Camera reconnected successfully");
                    }
                  } catch (error) {
                    console.error("Failed to reconnect the camera:", error);
                    message.error(
                      "Failed to reconnect the camera. Please check the permission settings"
                    );
                  }
                }}
              >
                Reconnect Camera
              </Button>
              <Button
                type="primary"
                danger
                block
                onClick={() => {
                  // Simulate a fall detection result
                  const mockFallData = {
                    isFallDetected: true,
                    confidence: 0.85,
                    boundingBox: {
                      x: 120,
                      y: 150,
                      width: 200,
                      height: 300,
                    },
                    timestamp: Date.now(),
                    fallId: `mock-fall-${Date.now()}`,
                  };

                  // Call the handling function
                  handleFallDetection(mockFallData);
                  message.warning("Fall event simulated. Confidence: 85%");
                }}
              >
                Simulate Fall Event
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <div
            style={{
              padding: "0 20px 0 0",
              color: "red",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Fall detected!</span>
            {notifyEmergency && countdown > 0 && (
              <div style={{ textAlign: "right" }}>
                <div>If no action is taken, the emergency alert</div>
                <div>{`will be
                  automatically triggered in ${countdown} seconds.`}</div>
              </div>
            )}
          </div>
        }
        open={isEmergencyModalVisible}
        onOk={handleConfirmOk}
        onCancel={handleConfirmOk}
        okText="I'm okay. Cancel the alert"
        cancelText="Confirm"
        width={700}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>
            Please describe your situation, or tell us your status using your
            voice:
          </Text>
        </div>

        <div style={{ marginBottom: 16 }}>
          <TextArea
            rows={4}
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
            placeholder="For example: I fell down, but I can stand up. My right ankle hurts a bit..."
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<AudioOutlined />}
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              danger={isRecording}
            >
              {isRecording ? "Stop Recording" : "Start Voice Description"}
            </Button>
            <Button
              type="primary"
              loading={isAssessing}
              onClick={() => {
                if (!userResponse) return;

                setIsAssessing(true);

                // If there is a fall ID, send the user response
                if (currentFallId) {
                  webSocketService.sendUserResponse(
                    currentFallId,
                    userResponse
                  );
                }

                // Simulate receiving the AI analysis result from the backend
                // In a real project, this should be obtained via WebSocket or API call
                setTimeout(() => {
                  setAiResponse(
                    "According to your description, you may have a minor sprain. It is recommended that you keep it cold-compressed, elevate the injured part, and rest. If the pain persists or worsens, please seek medical attention immediately."
                  );
                  setIsAssessing(false);
                }, 2000);
              }}
              disabled={!userResponse && !isRecording}
            >
              Analyze My Status
            </Button>
          </Space>
        </div>

        {aiResponse && (
          <Alert
            message="AI Assessment Result"
            description={aiResponse}
            type="info"
            showIcon
          />
        )}
      </Modal>
    </div>
  );
};

export default Monitoring;
