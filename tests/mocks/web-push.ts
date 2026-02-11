import { vi } from 'vitest';

export const sendNotificationMock = vi.fn().mockResolvedValue({});
export const setVapidDetailsMock = vi.fn();

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: setVapidDetailsMock,
    sendNotification: sendNotificationMock,
  },
  setVapidDetails: setVapidDetailsMock,
  sendNotification: sendNotificationMock,
}));
