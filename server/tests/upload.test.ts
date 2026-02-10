import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// Mock R2 service before importing app
vi.mock('../src/services/r2Service.js', () => ({
  isR2Configured: () => true,
  uploadToR2: vi.fn().mockImplementation(async (_buffer: Buffer, originalFilename: string, folder: string) => {
    const ext = originalFilename.split('.').pop();
    const key = `${folder}/mock-uuid.${ext}`;
    return {
      url: `https://files.example.com/${key}`,
      key,
    };
  }),
  deleteFromR2: vi.fn().mockResolvedValue(undefined),
  deleteFromR2ByUrl: vi.fn().mockResolvedValue(undefined),
  getPresignedUploadUrl: vi.fn().mockResolvedValue({
    uploadUrl: 'https://example.r2.cloudflarestorage.com/presigned',
    key: 'uploads/mock-uuid.png',
    publicUrl: 'https://files.example.com/uploads/mock-uuid.png',
  }),
}));

import app from '../src/app.js';

describe('Upload Routes', () => {
  let token: string;

  // Helper to create test image buffer
  const createTestImageBuffer = () => {
    // Create a minimal valid PNG (1x1 pixel transparent)
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, // IEND chunk
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82,
    ]);
    return png;
  };

  beforeAll(async () => {
    // Create a test user and get token
    const sendResponse = await request(app)
      .post('/api/auth/send-code')
      .send({ phone: '+1234567890' });

    const verifyResponse = await request(app)
      .post('/api/auth/verify')
      .send({ phone: '+1234567890', code: sendResponse.body.data.code });

    token = verifyResponse.body.data.token;
  });

  describe('POST /api/upload', () => {
    it('should upload a single image file to R2', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', createTestImageBuffer(), {
          filename: 'test.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.url).toContain('https://');
      expect(response.body.data.filename).toBeDefined();
      expect(response.body.data.originalName).toBe('test.png');
      expect(response.body.data.mimetype).toBe('image/png');
      expect(response.body.data.size).toBeGreaterThan(0);
    });

    it('should reject upload without authentication', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', createTestImageBuffer(), {
          filename: 'test.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject upload without file', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_FILE');
    });

    it('should reject non-image files', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('plain text content'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        });

      expect(response.status).toBe(500); // multer error
    });

    it('should accept JPEG images', async () => {
      // Minimal valid JPEG
      const jpeg = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
        0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c,
        0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
        0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d,
        0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
        0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
        0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
        0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34,
        0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
        0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
        0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
        0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff,
        0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
        0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04,
        0x00, 0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00,
        0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
        0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
        0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1,
        0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
        0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a,
        0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35,
        0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
        0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55,
        0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65,
        0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
        0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85,
        0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94,
        0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
        0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2,
        0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba,
        0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
        0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8,
        0xd9, 0xda, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6,
        0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
        0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xff, 0xda,
        0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
        0xfb, 0xd5, 0xff, 0xd9,
      ]);

      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', jpeg, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.mimetype).toBe('image/jpeg');
    });

    it('should generate unique filenames', async () => {
      const response1 = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', createTestImageBuffer(), {
          filename: 'same-name.png',
          contentType: 'image/png',
        });

      const response2 = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', createTestImageBuffer(), {
          filename: 'same-name.png',
          contentType: 'image/png',
        });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      // Both should succeed (R2 handles unique keys)
      expect(response1.body.data.url).toBeDefined();
      expect(response2.body.data.url).toBeDefined();
    });
  });

  describe('POST /api/upload/multiple', () => {
    it('should upload multiple image files to R2', async () => {
      const response = await request(app)
        .post('/api/upload/multiple')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', createTestImageBuffer(), {
          filename: 'test1.png',
          contentType: 'image/png',
        })
        .attach('files', createTestImageBuffer(), {
          filename: 'test2.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(2);

      response.body.data.forEach((file: any, index: number) => {
        expect(file.url).toContain('https://');
        expect(file.filename).toBeDefined();
        expect(file.originalName).toBe(`test${index + 1}.png`);
        expect(file.mimetype).toBe('image/png');
      });
    });

    it('should reject upload without authentication', async () => {
      const response = await request(app)
        .post('/api/upload/multiple')
        .attach('files', createTestImageBuffer(), {
          filename: 'test.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject upload without files', async () => {
      const response = await request(app)
        .post('/api/upload/multiple')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_FILES');
    });

    it('should handle single file in multiple endpoint', async () => {
      const response = await request(app)
        .post('/api/upload/multiple')
        .set('Authorization', `Bearer ${token}`)
        .attach('files', createTestImageBuffer(), {
          filename: 'single.png',
          contentType: 'image/png',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });
});
