package uz.turkceyol.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Ilovaning oʻz plagini (bosh ekran vidjeti) — npm plaginlaridan farqli, qoʻlda roʻyxatga olinadi
        registerPlugin(TyWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
