package uz.turkceyol.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

/**
 * Bosh ekran vidjeti: seriya (kun ketma-ket), bugungi XP / maqsad va bugungi soʻz.
 * Maʼlumotni ilova (app.js → widgetSync) TyWidgetPlugin orqali SharedPreferences'ga yozadi.
 * Kun almashganini vidjetning oʻzi hisoblaydi: bugun mashq qilinmagan boʻlsa XP 0, kecha ham qilinmagan boʻlsa seriya 0.
 */
public class TyWidget extends AppWidgetProvider {
    static final String PREFS = "ty_widget";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager manager, int[] ids) {
        RemoteViews v = views(ctx);
        for (int id : ids) manager.updateAppWidget(id, v);
    }

    static void refresh(Context ctx) {
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        int[] ids = m.getAppWidgetIds(new ComponentName(ctx, TyWidget.class));
        if (ids != null && ids.length > 0) m.updateAppWidget(ids, views(ctx));
    }

    static String day(int offset) {
        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_YEAR, offset);
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(c.getTime());
    }

    static RemoteViews views(Context ctx) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.ty_widget);
        JSONObject d;
        try {
            d = new JSONObject(ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("data", "{}"));
        } catch (JSONException e) {
            d = new JSONObject();
        }
        String today = day(0), last = d.optString("last", "");
        boolean done = today.equals(last);
        int streak = (done || day(-1).equals(last)) ? d.optInt("streak", 0) : 0;
        int goal = Math.max(1, d.optInt("goal", 50));
        int xp = today.equals(d.optString("day", "")) ? Math.max(0, d.optInt("xp", 0)) : 0;
        v.setTextViewText(R.id.w_streak, String.valueOf(streak));
        v.setTextViewText(R.id.w_xp, xp + "/" + goal + " XP");
        v.setProgressBar(R.id.w_bar, goal, Math.min(xp, goal), false);
        v.setTextViewText(R.id.w_state, done ? (xp >= goal ? "Bugungi maqsad bajarildi!" : "Bugun mashq qildingiz — barakalla!")
                : streak > 0 ? "Seriyani saqlang — 5 daqiqa yetadi" : "Bugun 5 daqiqa turk tili?");
        String tr = "merhaba", uz = "salom";
        JSONArray words = d.optJSONArray("words");
        if (words != null) {
            for (int i = 0; i < words.length(); i++) {
                JSONArray w = words.optJSONArray(i);
                if (w != null && today.equals(w.optString(0))) {
                    tr = w.optString(1, tr);
                    uz = w.optString(2, uz);
                    break;
                }
            }
        }
        v.setTextViewText(R.id.w_tr, tr);
        v.setTextViewText(R.id.w_uz, uz);
        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.w_root, pi);
        return v;
    }
}
