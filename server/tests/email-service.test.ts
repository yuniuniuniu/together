import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Email Service', () => {
  const mockVerify = vi.fn();
  const mockSendMail = vi.fn();

  // Reset modules and setup mocks before each test
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockVerify.mockReset();
    mockSendMail.mockReset();

    // Mock nodemailer
    vi.doMock('nodemailer', () => ({
      default: {
        createTransport: vi.fn(() => ({
          verify: mockVerify,
          sendMail: mockSendMail,
        })),
      },
    }));
  });

  describe('verifyEmailConfig', () => {
    it('should return true when SMTP connection is successful', async () => {
      mockVerify.mockResolvedValue(true);

      const { verifyEmailConfig } = await import('../src/services/emailService.js');
      const result = await verifyEmailConfig();

      expect(result).toBe(true);
    });

    it('should return false when SMTP connection fails', async () => {
      mockVerify.mockRejectedValue(new Error('Connection failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { verifyEmailConfig } = await import('../src/services/emailService.js');
      const result = await verifyEmailConfig();

      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send email with correct parameters', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      const { sendVerificationEmail } = await import('../src/services/emailService.js');
      await sendVerificationEmail('test@example.com', '123456');

      expect(mockSendMail).toHaveBeenCalledTimes(1);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('test@example.com');
      expect(callArgs.subject).toContain('Sanctuary');
      expect(callArgs.html).toContain('123456');
      expect(callArgs.text).toContain('123456');
    });

    it('should include expiry information in email', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      const { sendVerificationEmail } = await import('../src/services/emailService.js');
      await sendVerificationEmail('test@example.com', '654321');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('5 minutes');
      expect(callArgs.text).toContain('5 minutes');
    });

    it('should throw error when sending fails', async () => {
      mockSendMail.mockRejectedValue(new Error('Send failed'));

      const { sendVerificationEmail } = await import('../src/services/emailService.js');

      await expect(sendVerificationEmail('test@example.com', '123456'))
        .rejects.toThrow('Send failed');
    });

    it('should use correct sender name', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      const { sendVerificationEmail } = await import('../src/services/emailService.js');
      await sendVerificationEmail('test@example.com', '123456');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.from).toContain('Sanctuary');
    });

    it('should include both HTML and plain text versions', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-id' });

      const { sendVerificationEmail } = await import('../src/services/emailService.js');
      await sendVerificationEmail('test@example.com', '123456');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toBeDefined();
      expect(callArgs.text).toBeDefined();
      expect(callArgs.html.length).toBeGreaterThan(0);
      expect(callArgs.text.length).toBeGreaterThan(0);
    });
  });

  describe('Transporter Configuration', () => {
    it('should create transporter with expected configuration', async () => {
      const nodemailer = await import('nodemailer');

      // Import the service to trigger transporter creation
      await import('../src/services/emailService.js');

      expect(nodemailer.default.createTransport).toHaveBeenCalled();
    });
  });
});
