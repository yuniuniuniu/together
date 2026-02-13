package com.together.app;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;

public class TogetherApplication extends Application {
    public static final String CHANNEL_ID_HEARTBEAT = "heartbeat_channel";
    public static final String CHANNEL_ID_DEFAULT = "default_channel";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);

            // Heartbeat channel with vibration
            NotificationChannel heartbeatChannel = new NotificationChannel(
                CHANNEL_ID_HEARTBEAT,
                "Heartbeat",
                NotificationManager.IMPORTANCE_HIGH
            );
            heartbeatChannel.setDescription("Partner heartbeat notifications");
            heartbeatChannel.enableVibration(true);
            heartbeatChannel.setVibrationPattern(new long[]{0, 300}); // Single vibration
            heartbeatChannel.enableLights(true);
            manager.createNotificationChannel(heartbeatChannel);

            // Default channel without vibration
            NotificationChannel defaultChannel = new NotificationChannel(
                CHANNEL_ID_DEFAULT,
                "General",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            defaultChannel.setDescription("General notifications");
            defaultChannel.enableVibration(false);
            manager.createNotificationChannel(defaultChannel);
        }
    }
}
