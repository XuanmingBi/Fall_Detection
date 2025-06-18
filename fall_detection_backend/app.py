from flask import Flask, Response, jsonify
from fall_detection import FallDetector

app = Flask(__name__)
detector = FallDetector()

@app.route('/video_feed')
def video_feed():
    return Response(detector.generate(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/fall_logs')
def get_fall_logs():
    return jsonify(detector.fall_logs)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
