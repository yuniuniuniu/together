package com.together.app.plugins;

import android.content.Context;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMetadataRetriever;
import android.media.MediaMuxer;
import android.net.Uri;
import android.util.Log;
import android.view.Surface;

import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;

public class VideoCompressor {
    private static final String TAG = "VideoCompressor";
    private static final String MIME_TYPE_VIDEO = "video/avc";
    private static final String MIME_TYPE_AUDIO = "audio/mp4a-latm";
    private static final int TIMEOUT_US = 10000;
    private static final int I_FRAME_INTERVAL = 1;

    private final Context context;

    public VideoCompressor(Context context) {
        this.context = context;
    }

    public static class Settings {
        public final int maxWidth;
        public final int maxHeight;
        public final int videoBitrate;
        public final int audioBitrate;

        public Settings(int maxWidth, int maxHeight, int videoBitrate, int audioBitrate) {
            this.maxWidth = maxWidth;
            this.maxHeight = maxHeight;
            this.videoBitrate = videoBitrate;
            this.audioBitrate = audioBitrate;
        }
    }

    public static class Result {
        public final long size;
        public final double duration;

        public Result(long size, double duration) {
            this.size = size;
            this.duration = duration;
        }
    }

    public Result compress(Uri inputUri, File outputFile, Settings settings) throws IOException {
        MediaMetadataRetriever retriever = new MediaMetadataRetriever();
        try {
            retriever.setDataSource(context, inputUri);

            String widthStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH);
            String heightStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT);
            String durationStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
            String rotationStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION);

            int originalWidth = widthStr != null ? Integer.parseInt(widthStr) : 1920;
            int originalHeight = heightStr != null ? Integer.parseInt(heightStr) : 1080;
            long durationMs = durationStr != null ? Long.parseLong(durationStr) : 0;
            int rotation = rotationStr != null ? Integer.parseInt(rotationStr) : 0;

            // Handle rotation - swap dimensions if rotated 90 or 270
            if (rotation == 90 || rotation == 270) {
                int temp = originalWidth;
                originalWidth = originalHeight;
                originalHeight = temp;
            }

            Log.d(TAG, "Original video: " + originalWidth + "x" + originalHeight + ", duration=" + durationMs + "ms, rotation=" + rotation);

            // Calculate output dimensions maintaining aspect ratio
            int[] outputDims = calculateOutputDimensions(originalWidth, originalHeight, settings.maxWidth, settings.maxHeight);
            int outputWidth = outputDims[0];
            int outputHeight = outputDims[1];

            Log.d(TAG, "Output dimensions: " + outputWidth + "x" + outputHeight);

            // Perform transcoding
            transcodeVideo(inputUri, outputFile, outputWidth, outputHeight, rotation, settings);

            return new Result(outputFile.length(), durationMs / 1000.0);
        } finally {
            retriever.release();
        }
    }

    private int[] calculateOutputDimensions(int width, int height, int maxWidth, int maxHeight) {
        // If video is already smaller than max, keep original dimensions
        if (width <= maxWidth && height <= maxHeight) {
            // Ensure dimensions are even (required by encoder)
            return new int[]{width & ~1, height & ~1};
        }

        float widthRatio = (float) maxWidth / width;
        float heightRatio = (float) maxHeight / height;
        float ratio = Math.min(widthRatio, heightRatio);

        int newWidth = (int) (width * ratio);
        int newHeight = (int) (height * ratio);

        // Ensure dimensions are even (required by encoder)
        newWidth = newWidth & ~1;
        newHeight = newHeight & ~1;

        return new int[]{newWidth, newHeight};
    }

    private void transcodeVideo(Uri inputUri, File outputFile, int outputWidth, int outputHeight, int rotation, Settings settings) throws IOException {
        MediaExtractor videoExtractor = new MediaExtractor();
        MediaExtractor audioExtractor = new MediaExtractor();
        MediaMuxer muxer = null;
        MediaCodec videoDecoder = null;
        MediaCodec videoEncoder = null;
        MediaCodec audioDecoder = null;
        MediaCodec audioEncoder = null;

        try {
            videoExtractor.setDataSource(context, inputUri, null);
            audioExtractor.setDataSource(context, inputUri, null);

            // Find video and audio tracks
            int videoTrackIndex = findTrack(videoExtractor, "video/");
            int audioTrackIndex = findTrack(audioExtractor, "audio/");

            if (videoTrackIndex < 0) {
                throw new IOException("No video track found");
            }

            // Setup video
            videoExtractor.selectTrack(videoTrackIndex);
            MediaFormat inputVideoFormat = videoExtractor.getTrackFormat(videoTrackIndex);

            // Create encoder format
            MediaFormat outputVideoFormat = MediaFormat.createVideoFormat(MIME_TYPE_VIDEO, outputWidth, outputHeight);
            outputVideoFormat.setInteger(MediaFormat.KEY_BIT_RATE, settings.videoBitrate);
            outputVideoFormat.setInteger(MediaFormat.KEY_FRAME_RATE, 30);
            outputVideoFormat.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, I_FRAME_INTERVAL);
            outputVideoFormat.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface);

            // Create video encoder
            videoEncoder = MediaCodec.createEncoderByType(MIME_TYPE_VIDEO);
            videoEncoder.configure(outputVideoFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE);
            Surface encoderSurface = videoEncoder.createInputSurface();
            videoEncoder.start();

            // Create video decoder
            videoDecoder = MediaCodec.createDecoderByType(inputVideoFormat.getString(MediaFormat.KEY_MIME));
            videoDecoder.configure(inputVideoFormat, encoderSurface, null, 0);
            videoDecoder.start();

            // Create muxer
            muxer = new MediaMuxer(outputFile.getAbsolutePath(), MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
            if (rotation != 0) {
                muxer.setOrientationHint(rotation);
            }

            // Process video
            int outputVideoTrack = -1;
            int outputAudioTrack = -1;
            boolean muxerStarted = false;

            // Transcode video
            boolean videoInputDone = false;
            boolean videoDecoderDone = false;
            boolean videoEncoderDone = false;

            MediaCodec.BufferInfo decoderInfo = new MediaCodec.BufferInfo();
            MediaCodec.BufferInfo encoderInfo = new MediaCodec.BufferInfo();

            while (!videoEncoderDone) {
                // Feed input to decoder
                if (!videoInputDone) {
                    int inputIndex = videoDecoder.dequeueInputBuffer(TIMEOUT_US);
                    if (inputIndex >= 0) {
                        ByteBuffer inputBuffer = videoDecoder.getInputBuffer(inputIndex);
                        int sampleSize = videoExtractor.readSampleData(inputBuffer, 0);
                        if (sampleSize < 0) {
                            videoDecoder.queueInputBuffer(inputIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                            videoInputDone = true;
                        } else {
                            long presentationTime = videoExtractor.getSampleTime();
                            videoDecoder.queueInputBuffer(inputIndex, 0, sampleSize, presentationTime, 0);
                            videoExtractor.advance();
                        }
                    }
                }

                // Get decoder output
                if (!videoDecoderDone) {
                    int outputIndex = videoDecoder.dequeueOutputBuffer(decoderInfo, TIMEOUT_US);
                    if (outputIndex >= 0) {
                        boolean endOfStream = (decoderInfo.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0;
                        videoDecoder.releaseOutputBuffer(outputIndex, true);
                        if (endOfStream) {
                            videoEncoder.signalEndOfInputStream();
                            videoDecoderDone = true;
                        }
                    }
                }

                // Get encoder output
                int outputIndex = videoEncoder.dequeueOutputBuffer(encoderInfo, TIMEOUT_US);
                if (outputIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                    outputVideoTrack = muxer.addTrack(videoEncoder.getOutputFormat());

                    // Add audio track if exists
                    if (audioTrackIndex >= 0) {
                        audioExtractor.selectTrack(audioTrackIndex);
                        MediaFormat audioFormat = audioExtractor.getTrackFormat(audioTrackIndex);
                        outputAudioTrack = muxer.addTrack(audioFormat);
                    }

                    muxer.start();
                    muxerStarted = true;
                } else if (outputIndex >= 0) {
                    ByteBuffer outputBuffer = videoEncoder.getOutputBuffer(outputIndex);
                    if (muxerStarted && outputBuffer != null && encoderInfo.size > 0) {
                        outputBuffer.position(encoderInfo.offset);
                        outputBuffer.limit(encoderInfo.offset + encoderInfo.size);
                        muxer.writeSampleData(outputVideoTrack, outputBuffer, encoderInfo);
                    }
                    videoEncoder.releaseOutputBuffer(outputIndex, false);
                    if ((encoderInfo.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                        videoEncoderDone = true;
                    }
                }
            }

            // Copy audio track directly (no re-encoding)
            if (audioTrackIndex >= 0 && outputAudioTrack >= 0 && muxerStarted) {
                audioExtractor.seekTo(0, MediaExtractor.SEEK_TO_CLOSEST_SYNC);
                ByteBuffer audioBuffer = ByteBuffer.allocate(1024 * 1024);
                MediaCodec.BufferInfo audioInfo = new MediaCodec.BufferInfo();

                while (true) {
                    int sampleSize = audioExtractor.readSampleData(audioBuffer, 0);
                    if (sampleSize < 0) {
                        break;
                    }
                    audioInfo.offset = 0;
                    audioInfo.size = sampleSize;
                    audioInfo.presentationTimeUs = audioExtractor.getSampleTime();
                    audioInfo.flags = audioExtractor.getSampleFlags();
                    muxer.writeSampleData(outputAudioTrack, audioBuffer, audioInfo);
                    audioExtractor.advance();
                }
            }

        } finally {
            // Release resources
            if (videoDecoder != null) {
                videoDecoder.stop();
                videoDecoder.release();
            }
            if (videoEncoder != null) {
                videoEncoder.stop();
                videoEncoder.release();
            }
            if (audioDecoder != null) {
                audioDecoder.stop();
                audioDecoder.release();
            }
            if (audioEncoder != null) {
                audioEncoder.stop();
                audioEncoder.release();
            }
            if (muxer != null) {
                try {
                    muxer.stop();
                    muxer.release();
                } catch (Exception e) {
                    Log.w(TAG, "Error stopping muxer", e);
                }
            }
            videoExtractor.release();
            audioExtractor.release();
        }
    }

    private int findTrack(MediaExtractor extractor, String mimePrefix) {
        int trackCount = extractor.getTrackCount();
        for (int i = 0; i < trackCount; i++) {
            MediaFormat format = extractor.getTrackFormat(i);
            String mime = format.getString(MediaFormat.KEY_MIME);
            if (mime != null && mime.startsWith(mimePrefix)) {
                return i;
            }
        }
        return -1;
    }
}
