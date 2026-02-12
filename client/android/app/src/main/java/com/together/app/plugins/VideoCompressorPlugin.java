package com.together.app.plugins;

import android.net.Uri;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "VideoCompressor")
public class VideoCompressorPlugin extends Plugin {
    private static final String TAG = "VideoCompressor";

    @PluginMethod
    public void compress(PluginCall call) {
        String path = call.getString("path");
        String quality = call.getString("quality", "medium");

        if (path == null || path.isEmpty()) {
            call.reject("Path is required");
            return;
        }

        Log.d(TAG, "Starting compression: path=" + path + ", quality=" + quality);

        // Get compression settings based on quality
        VideoCompressor.Settings settings = getSettings(quality);

        // Run compression in background thread
        getActivity().runOnUiThread(() -> {
            new Thread(() -> {
                try {
                    Uri inputUri = parseUri(path);
                    File outputFile = createOutputFile();

                    VideoCompressor compressor = new VideoCompressor(getContext());
                    VideoCompressor.Result result = compressor.compress(inputUri, outputFile, settings);

                    JSObject ret = new JSObject();
                    ret.put("path", outputFile.getAbsolutePath());
                    ret.put("size", result.size);
                    ret.put("duration", result.duration);

                    Log.d(TAG, "Compression complete: size=" + result.size + ", duration=" + result.duration);
                    call.resolve(ret);
                } catch (Exception e) {
                    Log.e(TAG, "Compression failed", e);
                    call.reject("Compression failed: " + e.getMessage(), e);
                }
            }).start();
        });
    }

    private Uri parseUri(String path) {
        if (path.startsWith("content://") || path.startsWith("file://")) {
            return Uri.parse(path);
        }
        // Assume it's a file path
        return Uri.fromFile(new File(path));
    }

    private File createOutputFile() {
        File cacheDir = getContext().getCacheDir();
        String filename = "compressed_" + System.currentTimeMillis() + ".mp4";
        return new File(cacheDir, filename);
    }

    private VideoCompressor.Settings getSettings(String quality) {
        switch (quality) {
            case "low":
                return new VideoCompressor.Settings(640, 360, 1_000_000, 64_000);
            case "high":
                return new VideoCompressor.Settings(1920, 1080, 5_000_000, 192_000);
            case "medium":
            default:
                return new VideoCompressor.Settings(1280, 720, 2_500_000, 128_000);
        }
    }
}
