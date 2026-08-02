import axiosClient from './axiosClient';

const aiApi = {
  getContext: () => axiosClient.get('/admin/ai/context', {timeout: 30000}),
  chat: payload => axiosClient.post('/admin/ai/chat', payload, {timeout: 60000}),
};

export default aiApi;
