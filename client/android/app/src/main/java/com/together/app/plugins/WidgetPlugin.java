package com.together.app.plugins;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.together.app.widget.AnniversaryWidgetProvider;

/**
 * Capacitor 插件：用于同步数据到小部件并触发更新
 */
@CapacitorPlugin(name = "Widget")
public class WidgetPlugin extends Plugin {

    private static final String PREFS_NAME = "CapacitorStorage";
    private static final String KEY_WIDGET_DATA = "widget_data";

    /**
     * 更新小部件数据
     * 接收：anniversaryDate, user1Name, user2Name, user1Avatar, user2Avatar
     */
    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        try {
            String anniversaryDate = call.getString("anniversaryDate");
            String user1Name = call.getString("user1Name");
            String user2Name = call.getString("user2Name");
            String user1Avatar = call.getString("user1Avatar");
            String user2Avatar = call.getString("user2Avatar");

            // 构建 JSON 字符串
            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"anniversaryDate\":").append(toJsonValue(anniversaryDate)).append(",");
            json.append("\"user1Name\":").append(toJsonValue(user1Name)).append(",");
            json.append("\"user2Name\":").append(toJsonValue(user2Name)).append(",");
            json.append("\"user1Avatar\":").append(toJsonValue(user1Avatar)).append(",");
            json.append("\"user2Avatar\":").append(toJsonValue(user2Avatar));
            json.append("}");

            // 保存到 SharedPreferences
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(KEY_WIDGET_DATA, json.toString()).apply();

            // 触发小部件更新
            AnniversaryWidgetProvider.updateAllWidgets(context);

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Failed to update widget data", e);
        }
    }

    /**
     * 手动触发小部件刷新
     */
    @PluginMethod
    public void refreshWidget(PluginCall call) {
        try {
            AnniversaryWidgetProvider.updateAllWidgets(getContext());

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Failed to refresh widget", e);
        }
    }

    /**
     * 清除小部件数据
     */
    @PluginMethod
    public void clearWidgetData(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().remove(KEY_WIDGET_DATA).apply();

            // 触发小部件更新（显示默认状态）
            AnniversaryWidgetProvider.updateAllWidgets(context);

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Failed to clear widget data", e);
        }
    }

    /**
     * 将字符串转换为 JSON 值
     */
    private String toJsonValue(String value) {
        if (value == null) {
            return "null";
        }
        // 转义特殊字符
        String escaped = value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");
        return "\"" + escaped + "\"";
    }
}
