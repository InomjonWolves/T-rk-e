package uz.turkceyol.app;

import android.content.Context;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Ilovadan vidjetga maʼlumot: app.js → nativePlugin("TyWidget").update({day, last, streak, xp, goal, words}) */
@CapacitorPlugin(name = "TyWidget")
public class TyWidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        JSObject data = call.getData();
        Context ctx = getContext();
        ctx.getSharedPreferences(TyWidget.PREFS, Context.MODE_PRIVATE).edit().putString("data", data.toString()).apply();
        TyWidget.refresh(ctx);
        call.resolve();
    }
}
