import { useState, useEffect } from "react";
import {
  Table,
  Card,
  DatePicker,
  Button,
  Space,
  Tag,
  Modal,
  Typography,
  Descriptions,
  Image,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";
import dayjs from "dayjs";
import { fallApi } from "../services/api";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface FallEvent {
  id: string;
  timestamp: string;
  status: "confirmed" | "false_alarm" | "emergency";
  description: string;
  aiResponse: string;
  imageUrl: string;
}

const History = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FallEvent[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FallEvent | null>(null);

  useEffect(() => {
    // Fetch data from the API
    const fetchData = async () => {
      setLoading(true);
      try {
        // Use fallApi to get event data
        const dateRangeStrings = dateRange
          ? ([
              dateRange[0].format("YYYY-MM-DD"),
              dateRange[1].format("YYYY-MM-DD"),
            ] as [string, string])
          : undefined;

        const response = await fallApi.getEvents(dateRangeStrings);
        setData(response.data);
      } catch (error) {
        console.error("Failed to obtain the historical records.", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Filter data according to the date range
      if (dateRange) {
        const dateRangeStrings = [
          dateRange[0].format("YYYY-MM-DD"),
          dateRange[1].format("YYYY-MM-DD"),
        ] as [string, string];

        const response = await fallApi.getEvents(dateRangeStrings);
        setData(response.data);
      } else {
        // If there is no date range, get all data
        const response = await fallApi.getEvents();
        setData(response.data);
      }
    } catch (error) {
      console.error("Failed to search the historical records.", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (record: FallEvent) => {
    setSelectedEvent(record);
    setDetailModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Confirm Deletion",
      icon: <ExclamationCircleOutlined />,
      content:
        "Are you sure you want to delete this record? This operation cannot be undone.",
      okText: "Confirm",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          // Call the API to delete the event
          await fallApi.deleteEvent(id);
          // Update local data
          setData(data.filter((item) => item.id !== id));
        } catch (error) {
          console.error("Failed to delete the record:", error);
        }
      },
    });
  };

  const columns: TableProps<FallEvent>["columns"] = [
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      sorter: (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "green";
        let text = "Confirmed";

        if (status === "false_alarm") {
          color = "orange";
          text = "False Alarm";
        } else if (status === "emergency") {
          color = "red";
          text = "Emergency";
        }

        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: "Confirmed", value: "confirmed" },
        { text: "False Alarm", value: "false_alarm" },
        { text: "Emergency", value: "emergency" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "AI Response",
      dataIndex: "aiResponse",
      key: "aiResponse",
      ellipsis: true,
    },
    {
      title: "Actions",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleViewDetail(record)}>
            View Details
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            <DeleteOutlined /> Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{minHeight:"100vh"}}>
      <Title level={2}>Fall Event History Records</Title>

      {/* <Card style={{ marginBottom: 16 }}>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) =>
              setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
            }
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            Search
          </Button>
        </Space>
      </Card> */}

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Fall Event Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedEvent && (
          <>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Time">
                {selectedEvent.timestamp}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {selectedEvent.status === "confirmed" && (
                  <Tag color="green">Confirmed</Tag>
                )}
                {selectedEvent.status === "false_alarm" && (
                  <Tag color="orange">False Alarm</Tag>
                )}
                {selectedEvent.status === "emergency" && (
                  <Tag color="red">Emergency</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {selectedEvent.description}
              </Descriptions.Item>
              <Descriptions.Item label="AI Response">
                {selectedEvent.aiResponse}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Text strong>Event Screenshot:</Text>
              <div style={{ marginTop: 8, textAlign: "center" }}>
                <Image
                  src={selectedEvent.imageUrl}
                  alt="Fall event screenshot"
                  style={{ maxWidth: "100%" }}
                />
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default History;
