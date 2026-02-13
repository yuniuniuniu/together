package com.together.app.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.os.Handler;
import android.os.Looper;
import android.widget.RemoteViews;

import com.together.app.MainActivity;
import com.together.app.R;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * 纪念日倒计时小部件
 * 显示两人头像、在一起的天数和起始日期
 */
public class AnniversaryWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String KEY_WIDGET_DATA = "widget_data";

    private static final ExecutorService executor = Executors.newCachedThreadPool();
    private static final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onEnabled(Context context) {
        // 小部件首次添加时触发
    }

    @Override
    public void onDisabled(Context context) {
        // 最后一个小部件被移除时触发
    }

    /**
     * 更新单个小部件
     */
    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // 获取存储的小部件数据
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String widgetDataJson = prefs.getString(KEY_WIDGET_DATA, null);

        // 创建 RemoteViews
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_anniversary);

        // 设置点击事件
        setupClickIntent(context, views);

        if (widgetDataJson != null && !widgetDataJson.isEmpty()) {
            try {
                // 简单解析 JSON
                WidgetData data = parseWidgetData(widgetDataJson);

                if (data != null && data.anniversaryDate != null) {
                    // 计算在一起的天数
                    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
                    Date anniversaryDate = sdf.parse(data.anniversaryDate.split("T")[0]);

                    if (anniversaryDate != null) {
                        long daysTogether = calculateDaysBetween(anniversaryDate, new Date());

                        // 设置天数
                        views.setTextViewText(R.id.widget_days, String.valueOf(daysTogether));

                        // 设置 "Since" 日期
                        String sinceText = formatSinceDate(anniversaryDate);
                        views.setTextViewText(R.id.widget_since_date, sinceText);
                    }

                    // 先更新文本
                    appWidgetManager.updateAppWidget(appWidgetId, views);

                    // 异步加载头像
                    loadAvatarAsync(context, appWidgetManager, appWidgetId, views,
                        data.user1Avatar, R.id.widget_avatar1);
                    loadAvatarAsync(context, appWidgetManager, appWidgetId, views,
                        data.user2Avatar, R.id.widget_avatar2);

                    return;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // 没有数据或解析失败
        views.setTextViewText(R.id.widget_days, "--");
        views.setTextViewText(R.id.widget_since_date, "请在应用中设置");

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    /**
     * 格式化 "Since" 日期，如 "Since Oct 14"
     */
    private static String formatSinceDate(Date date) {
        SimpleDateFormat monthFormat = new SimpleDateFormat("MMM", Locale.ENGLISH);
        SimpleDateFormat dayFormat = new SimpleDateFormat("d", Locale.getDefault());

        String month = monthFormat.format(date);
        String day = dayFormat.format(date);

        return "Since " + month + " " + day;
    }

    /**
     * 设置点击打开应用的 Intent
     */
    private static void setupClickIntent(Context context, RemoteViews views) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);
    }

    /**
     * 异步加载头像
     */
    private static void loadAvatarAsync(Context context, AppWidgetManager appWidgetManager,
            int appWidgetId, RemoteViews views, String avatarUrl, int imageViewId) {
        if (avatarUrl == null || avatarUrl.isEmpty()) {
            return;
        }

        executor.execute(() -> {
            try {
                Bitmap bitmap = downloadBitmap(avatarUrl);
                if (bitmap != null) {
                    // 裁剪为圆形
                    Bitmap circularBitmap = getCircularBitmap(bitmap);

                    mainHandler.post(() -> {
                        views.setImageViewBitmap(imageViewId, circularBitmap);
                        setupClickIntent(context, views);
                        appWidgetManager.updateAppWidget(appWidgetId, views);
                    });
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    /**
     * 下载图片
     */
    private static Bitmap downloadBitmap(String urlString) {
        try {
            URL url = new URL(urlString);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setDoInput(true);
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            connection.connect();

            InputStream input = connection.getInputStream();
            Bitmap bitmap = BitmapFactory.decodeStream(input);
            input.close();
            connection.disconnect();

            return bitmap;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 将 Bitmap 裁剪为圆形
     */
    private static Bitmap getCircularBitmap(Bitmap bitmap) {
        int size = Math.min(bitmap.getWidth(), bitmap.getHeight());
        Bitmap output = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);

        Canvas canvas = new Canvas(output);

        final Paint paint = new Paint();
        final Rect rect = new Rect(0, 0, size, size);

        paint.setAntiAlias(true);
        canvas.drawARGB(0, 0, 0, 0);
        canvas.drawCircle(size / 2f, size / 2f, size / 2f, paint);

        paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));

        // 居中裁剪
        int left = (bitmap.getWidth() - size) / 2;
        int top = (bitmap.getHeight() - size) / 2;
        Rect srcRect = new Rect(left, top, left + size, top + size);

        canvas.drawBitmap(bitmap, srcRect, rect, paint);

        return output;
    }

    /**
     * 计算两个日期之间的天数
     */
    private static long calculateDaysBetween(Date startDate, Date endDate) {
        long diffInMillis = endDate.getTime() - startDate.getTime();
        return TimeUnit.DAYS.convert(diffInMillis, TimeUnit.MILLISECONDS);
    }

    /**
     * 简单的 JSON 解析
     */
    private static WidgetData parseWidgetData(String json) {
        try {
            WidgetData data = new WidgetData();

            data.anniversaryDate = extractJsonString(json, "anniversaryDate");
            data.user1Name = extractJsonString(json, "user1Name");
            data.user2Name = extractJsonString(json, "user2Name");
            data.user1Avatar = extractJsonString(json, "user1Avatar");
            data.user2Avatar = extractJsonString(json, "user2Avatar");

            return data;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 从 JSON 字符串中提取指定 key 的值
     */
    private static String extractJsonString(String json, String key) {
        String searchKey = "\"" + key + "\":";
        int keyIndex = json.indexOf(searchKey);
        if (keyIndex == -1) return null;

        int valueStart = keyIndex + searchKey.length();
        // 跳过空白
        while (valueStart < json.length() && Character.isWhitespace(json.charAt(valueStart))) {
            valueStart++;
        }

        if (valueStart >= json.length()) return null;

        char firstChar = json.charAt(valueStart);

        // null 值
        if (json.substring(valueStart).startsWith("null")) {
            return null;
        }

        // 字符串值
        if (firstChar == '"') {
            int valueEnd = json.indexOf('"', valueStart + 1);
            if (valueEnd == -1) return null;
            return json.substring(valueStart + 1, valueEnd);
        }

        return null;
    }

    /**
     * 静态方法：从其他地方触发更新所有小部件
     */
    public static void updateAllWidgets(Context context) {
        Intent intent = new Intent(context, AnniversaryWidgetProvider.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);

        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(
            new android.content.ComponentName(context, AnniversaryWidgetProvider.class)
        );

        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, appWidgetIds);
        context.sendBroadcast(intent);
    }

    /**
     * 小部件数据类
     */
    private static class WidgetData {
        String anniversaryDate;
        String user1Name;
        String user2Name;
        String user1Avatar;
        String user2Avatar;
    }
}
