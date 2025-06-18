import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Spin,
  Alert,
  Divider,
} from "antd";
import {
  SafetyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AlertOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { useUserStore } from "../store/userStore";
import AIAssistant from "../components/assistant/AIAssistant";
import { fallApi } from "../services/api";
import { FallEvent } from "../store/fallStore";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

const { Title, Paragraph } = Typography;

const Dashboard = () => {
  const user = useUserStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<FallEvent[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    falseAlarm: 0,
    emergency: 0,
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fallApi.getEvents();
        setEvents(response.data);

        // Calculate statistics
        const total = response.data.length;
        const confirmed = response.data.filter(
          (event) => event.status === "confirmed"
        ).length;
        const falseAlarm = response.data.filter(
          (event) => event.status === "false_alarm"
        ).length;
        const emergency = response.data.filter(
          (event) => event.status === "emergency"
        ).length;

        setStats({
          total,
          confirmed,
          falseAlarm,
          emergency,
        });
      } catch (error) {
        console.error("Failed to fetch fall events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Pie chart data
  const pieData = [
    { name: "Confirmed", value: stats.confirmed },
    { name: "False Alarm", value: stats.falseAlarm },
    { name: "Emergency", value: stats.emergency },
  ];

  const COLORS = ["#52c41a", "#faad14", "#f5222d"];

  return (
    <div style={{ padding: 24, minHeight: "100vh" }}>
      <Card
        className="welcome-card"
        style={{
          background: "linear-gradient(135deg, #1890ff 0%, #722ed1 100%)",
          color: "white",
          borderRadius: "12px",
          marginBottom: 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <Row align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Title level={2} style={{ color: "white", margin: 0 }}>
              <SafetyOutlined style={{ marginRight: 12 }} /> Welcome back,
              {user?.username}!
            </Title>
            <Paragraph
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 16,
                marginTop: 12,
              }}
            >
              Our compassionate monitoring system is creating safer community
              spaces for our seniors. Through thoughtful AI technology, we're
              helping protect elderly community members in shared gathering
              places, ensuring they can enjoy social connections with peace of
              mind.
            </Paragraph>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: "center" }}>
            <HeartOutlined
              style={{ fontSize: 80, color: "rgba(255,255,255,0.85)" }}
            />
          </Col>
        </Row>
      </Card>

      {loading ? (
        <Card style={{ textAlign: "center", padding: 24 }}>
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>Loading data...</p>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{
                borderRadius: "8px",
                height: "100%",
                transition: "all 0.3s ease",
                transform: "translateY(0)",
                opacity: 1,
                animation: "fadeIn 0.5s ease-in-out",
              }}
              className="stat-card"
            >
              <Statistic
                title="Total Events"
                value={stats.total}
                prefix={<SafetyOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{
                borderRadius: "8px",
                height: "100%",
                transition: "all 0.3s ease",
                transform: "translateY(0)",
                opacity: 1,
                animation: "fadeIn 0.6s ease-in-out",
              }}
              className="stat-card"
            >
              <Statistic
                title="Confirmed"
                value={stats.confirmed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{
                borderRadius: "8px",
                height: "100%",
                transition: "all 0.3s ease",
                transform: "translateY(0)",
                opacity: 1,
                animation: "fadeIn 0.7s ease-in-out",
              }}
              className="stat-card"
            >
              <Statistic
                title="False Alarm"
                value={stats.falseAlarm}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              style={{
                borderRadius: "8px",
                height: "100%",
                transition: "all 0.3s ease",
                transform: "translateY(0)",
                opacity: 1,
                animation: "fadeIn 0.8s ease-in-out",
              }}
              className="stat-card"
            >
              <Statistic
                title="Emergency Events"
                value={stats.emergency}
                prefix={<AlertOutlined />}
                valueStyle={{ color: "#f5222d" }}
              />
            </Card>
          </Col>

          <Col xs={24}>
            <Card
              title="Distribution of Event Types"
              style={{
                borderRadius: "8px",
                height: "500px",
                width: "100%",
                animation: "fadeIn 1s ease-in-out",
              }}
              hoverable
            >
              {stats.total > 0 ? (
                <div
                  style={{
                    height: "400px",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <PieChart width={800} height={400}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      animationDuration={1000}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <Alert message="暂无事件数据" type="info" />
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      <AIAssistant />
    </div>
  );
};

export default Dashboard;
