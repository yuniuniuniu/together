package com.together.app;

import com.getcapacitor.BridgeActivity;
import com.together.app.plugins.VideoCompressorPlugin;
import com.together.app.plugins.WidgetPlugin;
import android.os.Bundle;
import androidx.core.view.WindowCompat;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VideoCompressorPlugin.class);
        registerPlugin(WidgetPlugin.class);
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
