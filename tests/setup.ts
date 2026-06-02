import "@testing-library/jest-dom/vitest";

process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.AUTH_SECRET = "dummy-secret-at-least-16-chars-long";
process.env.SMTP_HOST = "localhost";
process.env.SMTP_PORT = "587";
process.env.SMTP_FROM = "test@example.com";
process.env.SUPPORT_ALERT_EMAIL = "admin@example.com";
