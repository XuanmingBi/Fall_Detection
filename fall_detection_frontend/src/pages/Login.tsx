import { useState } from "react";
import { Form, Input, Button, Card, Typography, message, Spin } from "antd";
import { UserOutlined, LockOutlined, HeartOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useUserStore } from "../store/userStore";
import { userApi } from "../services/api";
import "../styles/Auth.css";

const { Title } = Typography;

interface LoginFormValues {
  username: string;
  password: string;
}

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const userLogin = useUserStore((state) => state.login);

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      // 调用API服务进行登录
      const response = await userApi.login(values.username, values.password);
      const { user, token } = response.data;

      // 更新authStore
      login(user, token);

      // 更新userStore
      userLogin({
        id: user.id,
        username: user.username,
      });

      message.success("Login successful");
      navigate("/");
    } catch (error) {
      message.error("Login failed. Please check your username and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Animated background elements */}
      <div className="bg-animation">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <Spin spinning={loading}>
        <Card className="auth-card">
          <div className="auth-header">
            <Title level={2}>Community Guardian: Fall Detection</Title>
            <Title level={4}>Welcome Back</Title>
            <p>
              Sign in to access our advanced monitoring system for detecting and
              responding to elderly falls in public spaces such as parks,
              community centers, and residential facilities.
            </p>
          </div>

          <Form
            name="login"
            className="auth-form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "Please input your username!" },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="username" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="auth-button">
                Login
              </Button>
            </Form.Item>

            <div className="auth-links">
              <span>Don't have an account yet? </span>
              <Link to="/register">Register now </Link>
            </div>
          </Form>
        </Card>
      </Spin>
    </div>
  );
};

export default Login;
