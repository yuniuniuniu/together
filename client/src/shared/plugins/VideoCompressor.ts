import { registerPlugin } from '@capacitor/core';

export interface CompressOptions {
  /** 视频文件路径 (content:// 或 file://) */
  path: string;
  /** 压缩质量: low (640x360), medium (1280x720), high (1920x1080) */
  quality?: 'low' | 'medium' | 'high';
}

export interface CompressResult {
  /** 压缩后的文件路径 */
  path: string;
  /** 压缩后文件大小 (bytes) */
  size: number;
  /** 视频时长 (秒) */
  duration: number;
}

export interface VideoCompressorPlugin {
  compress(options: CompressOptions): Promise<CompressResult>;
}

const VideoCompressor = registerPlugin<VideoCompressorPlugin>('VideoCompressor');

export default VideoCompressor;
