import axios from 'axios';
import { FallEvent } from '../store/fallStore';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // 实际项目中应该使用环境变量
  timeout: 10000,
});

// 请求拦截器，添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage');
    if (token) {
      try {
        const parsedToken = JSON.parse(token);
        if (parsedToken.state && parsedToken.state.token) {
          config.headers.Authorization = `Bearer ${parsedToken.state.token}`;
        }
      } catch (e) {
        console.error('Failed to parse the token', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 用户相关API
export const userApi = {
  // 登录
  login: async (username: string, password: string) => {
    // 实际项目中应该调用真实API
    // return api.post('/auth/login', { username, password });

    // Mock数据
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      data: {
        user: {
          id: '1',
          username,
          email: `${username}@example.com`,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username,
          phone: '',
          emergencyContacts: []
        },
        token: 'mock-token-' + Date.now()
      }
    };
  },

  // 注册
  register: async (username: string, email: string, password: string) => {
    // 实际项目中应该调用真实API
    // return api.post('/auth/register', { username, email, password });

    // Mock数据
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      data: {
        success: true,
        message: 'Registration successful'
      }
    };
  },

  // 获取用户信息
  getUserInfo: async () => {
    // 实际项目中应该调用真实API
    // return api.get('/user/profile');

    // Mock数据
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      data: {
        id: '1',
        username: 'Community Staff',
        email: 'staff@community.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser',
        phone: '13800138000',
        emergencyContacts: [
          {
            id: '1',
            name: 'Community Management Office',
            phone: '13900139000',
            department: 'Management'
          }
        ]
      }
    };
  },

  // 更新用户信息
  updateUserInfo: async (userData: any) => {
    // 实际项目中应该调用真实API
    // return api.put('/user/profile', userData);

    // Mock数据
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      data: {
        success: true,
        message: 'Update successful',
        user: {
          ...userData,
          id: '1'
        }
      }
    };
  },
};

// 跌倒事件相关API
export const fallApi = {
  // 获取跌倒事件列表
  getEvents: async (dateRange?: [string, string]) => {
    // 实际项目中应该调用真实API
    // return api.get('/fall/events', { params: { startDate, endDate } });

    // Mock数据
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockEvents: FallEvent[] = [
      {
        id: '1',
        timestamp: '2023-11-01 08:30:45',
        status: 'confirmed',
        description: 'Fell down in Area A, with a minor abrasion on the right knee',
        aiResponse: 'It is recommended to clean the wound and use a band-aid. Seek medical attention if the pain worsens',
        imageUrl: 'https://via.placeholder.com/300x200',
      },
      {
        id: '2',
        timestamp: '2023-10-03 15:22:10',
        status: 'false_alarm',
        description: 'Bending down to pick something up was misjudged as a fall',
        aiResponse: 'System false alarm, no action required',
        imageUrl: 'https://via.placeholder.com/300x200',
      },
      {
        id: '3',
        timestamp: '2023-11-05 21:15:33',
        status: 'emergency',
        description: 'Slipped in Area B, unable to stand, hit the head',
        aiResponse: 'Emergency contacts have been notified. It is recommended to stay still and wait for rescue',
        imageUrl: 'https://via.placeholder.com/300x200',
      },
      {
        id: '4',
        timestamp: '2023-12-08 10:45:20',
        status: 'confirmed',
        description: 'Missed a step while going downstairs in Area C, sprained the ankle',
        aiResponse: 'It is recommended to apply ice and elevate the injured part, avoid walking, and seek medical examination if necessary',
        imageUrl: 'https://via.placeholder.com/300x200',
      },
      {
        id: '5',
        timestamp: '2024-01-10 14:05:18',
        status: 'false_alarm',
        description: 'Sitting down quickly was misjudged as a fall',
        aiResponse: 'System false alarm, no action required',
        imageUrl: 'https://via.placeholder.com/300x200',
      },
    ];

    // 如果有日期范围，进行过滤
    let filteredEvents = mockEvents;
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      filteredEvents = mockEvents.filter(event => {
        const eventDate = new Date(event.timestamp);
        return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
      });
    }

    return {
      data: filteredEvents
    };
  },

  // 获取单个跌倒事件详情
  getEventById: async (id: string) => {
    // 实际项目中应该调用真实API
    // return api.get(`/fall/events/${id}`);

    // Mock数据
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockEvent = {
      id,
      timestamp: '2023-11-01 08:30:45',
      status: 'confirmed' as const,
      description: 'Fell down in the living room, with a minor abrasion on the right knee',
      aiResponse: 'It is recommended to clean the wound and use a band-aid. Seek medical attention if the pain worsens',
      imageUrl: 'https://via.placeholder.com/300x200',
      location: 'Living Room',
      duration: 'Approximately 5 seconds',
      severity: 'Minor',
      actionTaken: 'Self-treated',
    };

    return {
      data: mockEvent
    };
  },

  // 删除跌倒事件
  deleteEvent: async (id: string) => {
    // 实际项目中应该调用真实API
    // return api.delete(`/fall/events/${id}`);

    // Mock数据
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      data: {
        success: true,
        message: 'Deletion successful'
      }
    };
  },

  // 更新跌倒事件状态
  updateEventStatus: async (id: string, status: FallEvent['status']) => {
    // 实际项目中应该调用真实API
    // return api.patch(`/fall/events/${id}/status`, { status });

    // Mock数据
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      data: {
        success: true,
        message: 'Status update successful'
      }
    };
  },
};

// 设置相关API
export const settingsApi = {
  // 获取设置
  getSettings: async () => {
    // 实际项目中应该调用真实API
    // return api.get('/settings');

    // Mock数据
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      data: {
        // 监控设置
        sensitivity: 'medium',
        autoRecord: true,

        // 通知设置
        notifyEmergency: true,
        notificationMethod: ['sound', 'popup'],

        // 隐私设置
        dataRetentionPeriod: '30',
        recordingStorage: 'local',

        // 界面设置
        theme: 'light',
      }
    };
  },

  // 更新设置
  updateSettings: async (settings: any) => {
    // 实际项目中应该调用真实API
    // return api.put('/settings', settings);

    // Mock数据
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      data: {
        success: true,
        message: 'Settings update successful'
      }
    };
  },
};

export default api;