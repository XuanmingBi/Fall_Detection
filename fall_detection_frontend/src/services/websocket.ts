import { io, Socket } from 'socket.io-client';

// 定义跌倒检测结果的接口
export interface FallDetectionResult {
  isFallDetected: boolean;
  confidence: number; // 置信度，0-1之间的值
  boundingBox?: { // 跌倒区域的边界框
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
  fallId?: string; // 如果检测到跌倒，会生成一个唯一ID
}

class WebSocketService {
  private socket: Socket | null = null;
  private videoStream: MediaStream | null = null;
  private captureInterval: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 3000; // 3秒后重连
  private readonly CAPTURE_INTERVAL = 1000; // 每秒捕获一帧
  private readonly WEBSOCKET_URL = 'http://localhost:8080'; // WebSocket服务地址
  private isConnecting: boolean = false;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    this.socket = io(this.WEBSOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: this.RECONNECT_DELAY,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connectionAttempts = 0;
      this.isConnecting = false;
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('fall_detected', (data: FallDetectionResult) => {
      if (data.isFallDetected) {
        this.handleFallDetection(data);
      }
    });
  }

  private handleReconnect() {
    this.isConnecting = false;
    if (this.connectionAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.connectionAttempts++;
      console.log(`尝试重新连接 (${this.connectionAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }

      this.reconnectTimer = setTimeout(() => {
        this.initializeSocket();
      }, this.RECONNECT_DELAY);
    } else {
      console.error('达到最大重连次数，无法连接到服务器');
    }
  }

  public async startVideoStream(videoElement: HTMLVideoElement) {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        }
      });
      videoElement.srcObject = this.videoStream;

      if (!this.socket || !this.socket.connected) {
        this.initializeSocket();
      }

      this.startFrameCapture();
      return true;
    } catch (error) {
      console.error('无法访问摄像头:', error);
      throw new Error('无法访问摄像头，请检查权限设置');
    }
  }

  private startFrameCapture() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
    }

    this.captureInterval = setInterval(() => {
      this.captureAndSendFrame();
    }, this.CAPTURE_INTERVAL);
  }

  private async captureAndSendFrame() {
    if (!this.videoStream || !this.socket?.connected) return;

    try {
      const track = this.videoStream.getVideoTracks()[0];
      if (!track || track.readyState !== 'live') {
        console.error('视频轨道不可用');
        return;
      }

      const imageCapture = new ImageCapture(track);

      try {
        const blob = await imageCapture.takePhoto();
        const base64Image = await this.blobToBase64(blob);

        this.socket.emit('video_frame', {
          frame: base64Image,
          timestamp: Date.now(),
          resolution: {
            width: track.getSettings().width || 640,
            height: track.getSettings().height || 480
          }
        });
      } catch (error) {
        console.error('捕获帧错误:', error);
        try {
          const frame = await imageCapture.grabFrame();
          const canvas = document.createElement('canvas');
          canvas.width = frame.width;
          canvas.height = frame.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(frame, 0, 0);

          const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

          this.socket.emit('video_frame', {
            frame: base64Image,
            timestamp: Date.now(),
            resolution: {
              width: frame.width,
              height: frame.height
            }
          });
        } catch (grabError) {
          console.error('备选帧捕获方法也失败:', grabError);
        }
      }
    } catch (error) {
      console.error('处理视频帧错误:', error);
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]); // 移除前缀
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private handleFallDetection(data: FallDetectionResult) {
    console.log('检测到跌倒事件:', data);

    const fallEvent = new CustomEvent('fallDetected', { 
      detail: {
        ...data,
        detectedAt: new Date().toISOString(),
        fallId: data.fallId || `fall-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      } 
    });

    window.dispatchEvent(fallEvent);
  }

  public sendUserResponse(fallId: string, response: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('user_response', {
        fallId,
        response,
        timestamp: Date.now()
      });
      return true;
    }
    return false;
  }

  public sendEmergencyAlert(fallId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('emergency_alert', {
        fallId,
        timestamp: Date.now()
      });
      return true;
    }
    return false;
  }

  public cancelEmergencyAlert(fallId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('cancel_emergency', {
        fallId,
        timestamp: Date.now()
      });
      return true;
    }
    return false;
  }

  public stopVideoStream() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => {
        track.stop();
      });
      this.videoStream = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnecting = false;
    this.connectionAttempts = 0;
  }
}

export const webSocketService = new WebSocketService();