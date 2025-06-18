import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Typography,
  Tabs,
  List,
  Divider,
  Space,
  message,
  Modal,
  Spin,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../store/authStore";
import { userApi } from "../services/api";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  phone: string;
  emergencyContacts: EmergencyContact[];
}

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const { user, updateUser } = useAuthStore();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await userApi.getUserInfo();
      setUserProfile(response.data);
      profileForm.setFieldsValue({
        username: response.data.username,
        email: response.data.email,
        phone: response.data.phone,
      });
    } catch (error) {
      console.error("Failed to fetch user information:", error);
      message.error("Failed to fetch user information");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      const response = await userApi.updateUserInfo({
        ...values,
        id: userProfile?.id,
      });

      if (response.data.success) {
        message.success("Personal information updated successfully");
        // Update the global state
        updateUser({
          username: values.username,
          email: values.email,
        });
        // Refresh the user profile
        fetchUserProfile();
      } else {
        message.error(response.data.message || "Update failed");
      }
    } catch (error) {
      console.error("Failed to update user information:", error);
      message.error("Failed to update user information");
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (values: any) => {
    setLoading(true);
    try {
      // In a real project, here should call the API to add an emergency contact
      // Here use mock data
      const newContact: EmergencyContact = {
        id: Date.now().toString(),
        name: values.name,
        phone: values.phone,
        relationship: values.relationship,
      };

      if (userProfile) {
        const updatedProfile = {
          ...userProfile,
          emergencyContacts: [...userProfile.emergencyContacts, newContact],
        };

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        setUserProfile(updatedProfile);
        message.success("Emergency contact added successfully");
        setContactModalVisible(false);
        contactForm.resetFields();
      }
    } catch (error) {
      console.error("Failed to add an emergency contact:", error);
      message.error("Failed to add an emergency contact");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    Modal.confirm({
      title: "Confirm Deletion",
      content: "Are you sure you want to delete this emergency contact?",
      okText: "Confirm",
      cancelText: "Cancel",
      onOk: async () => {
        setLoading(true);
        try {
          // In a real project, here should call the API to delete an emergency contact
          // Here use mock data
          if (userProfile) {
            const updatedContacts = userProfile.emergencyContacts.filter(
              (contact) => contact.id !== contactId
            );

            const updatedProfile = {
              ...userProfile,
              emergencyContacts: updatedContacts,
            };

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 500));

            setUserProfile(updatedProfile);
            message.success("Emergency contact deleted successfully");
          }
        } catch (error) {
          console.error("Failed to delete an emergency contact:", error);
          message.error("Failed to delete an emergency contact");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div style={{ padding: "0 24px", minHeight: "100vh" }}>
      <Spin spinning={loading}>
        <Title level={2}>Personal Center</Title>

        <Tabs defaultActiveKey="profile">
          <TabPane tab="Basic Information" key="profile">
            <Card>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Avatar
                  size={100}
                  src={userProfile?.avatar}
                  icon={<UserOutlined />}
                />
                <Title level={4} style={{ marginTop: 16 }}>
                  {userProfile?.username}
                </Title>
                <Text type="secondary">{userProfile?.email}</Text>
              </div>

              <Divider />

              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleProfileUpdate}
              >
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[
                    { required: true, message: "Please enter your username" },
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Username" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: "Please enter your email" },
                    {
                      type: "email",
                      message: "Please enter a valid email address",
                    },
                  ]}
                >
                  <Input placeholder="Email" />
                </Form.Item>

                <Form.Item name="phone" label="Phone Number">
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="Phone Number"
                  />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Save Changes
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </TabPane>

          <TabPane tab="Emergency Contacts" key="contacts">
            <Card
              title="Emergency Contact List"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setContactModalVisible(true)}
                >
                  Add Contact
                </Button>
              }
            >
              {userProfile?.emergencyContacts &&
              userProfile.emergencyContacts.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={userProfile.emergencyContacts}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteContact(item.id)}
                        >
                          Delete
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={item.name}
                        description={
                          <Space direction="vertical">
                            <Text>Relationship: {item.relationship}</Text>
                            <Text>Phone: {item.phone}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <Text type="secondary">No emergency contacts yet</Text>
                </div>
              )}
            </Card>
          </TabPane>
        </Tabs>

        <Modal
          title="Add Emergency Contact"
          open={contactModalVisible}
          onCancel={() => setContactModalVisible(false)}
          footer={null}
        >
          <Form
            form={contactForm}
            layout="vertical"
            onFinish={handleAddContact}
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[
                { required: true, message: "Please enter the contact's name" },
              ]}
            >
              <Input placeholder="Contact's Name" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone"
              rules={[
                {
                  required: true,
                  message: "Please enter the contact's phone number",
                },
              ]}
            >
              <Input placeholder="Contact's Phone Number" />
            </Form.Item>

            <Form.Item
              name="relationship"
              label="Relationship"
              rules={[
                {
                  required: true,
                  message: "Please enter the relationship with the contact",
                },
              ]}
            >
              <Input placeholder="For example: Relative, Friend, Neighbor" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
                <Button onClick={() => setContactModalVisible(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Spin>
    </div>
  );
};

export default Profile;
