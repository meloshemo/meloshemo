package com.meloshemo.devaynasi;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

/**
 * Dev Aynası — Android kabuğu.
 *
 * Üç şey yapar, üçü de oyunun kendisiyle ilgili:
 *
 * 1. Tam ekran (immersive): durum ve gezinme çubukları gizlenir. Karanlık bir
 *    ayna salonunda yürürken ekranın üstünde saat ve pil göstergesi durması
 *    atmosferi bozuyor; ayrıca gezinme çubuğu, oyuncunun parmağını
 *    sürüklediği alanın tam altında duruyor ve kazara dokunuşla oyundan
 *    çıkartıyordu.
 *
 * 2. Ekran uyumaz: oyuncu aynaları incelerken ekrana dokunmadan uzun süre
 *    durabiliyor (XVII. bölüm bunu şart koşuyor — orada durgunluk oyunun
 *    kuralı). Ekranın kendi kendine kapanması oyunu bitirirdi.
 *
 * 3. Geri tuşu iki basışta çıkarır. Tek basışta çıkmak, 20.000 aynalık bir
 *    salonun ortasında kazara dokunuşla her şeyi kaybetmek demekti.
 */
public class MainActivity extends BridgeActivity {

    /** İlk geri basışının zamanı; ikincisi bu kadar süre içinde gelirse çıkılır. */
    private static final long CIKIS_PENCERESI_MS = 2000;

    private long sonGeriBasisi = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        tamEkran();
        geriTusunuBagla();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Oyuncu bildirim panelini aşağı çekip kapatınca çubuklar geri
        // geliyor; her dönüşte yeniden gizlenir.
        tamEkran();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            tamEkran();
        }
    }

    /**
     * Geri tuşu, `onBackPressed()` ile değil geri dağıtıcısıyla karşılanır.
     * Nedeni: hedef API 36 ve Android 15'ten (API 35) beri öngörülü geri
     * (predictive back) varsayılan olarak açık; o durumda `onBackPressed()`
     * hiç çağrılmıyor. Eski yöntemde çift basış sessizce çalışmaz, oyuncu
     * tek dokunuşta oyundan düşerdi. Dağıtıcı her iki dünyada da çalışır.
     */
    private void geriTusunuBagla() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                long now = System.currentTimeMillis();
                if (now - sonGeriBasisi < CIKIS_PENCERESI_MS) {
                    // Kendimizi devre dışı bırakıp geri olayını yeniden
                    // yollarız: sıradaki karşılayıcı (sistem) uygulamayı
                    // kapatır.
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                    return;
                }
                sonGeriBasisi = now;
                Toast.makeText(MainActivity.this, R.string.cikmak_icin_tekrar, Toast.LENGTH_SHORT).show();
            }
        });
    }

    /**
     * Çubukları gizler ve kaydırmayla geri geldiklerinde kendiliğinden
     * yeniden gizlenmelerini söyler. Android 11'de API değişti; ikisi de
     * destekleniyor çünkü minSdk 24.
     */
    private void tamEkran() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            final WindowInsetsController denetleyici = getWindow().getInsetsController();
            if (denetleyici != null) {
                denetleyici.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                denetleyici.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
            getWindow().setDecorFitsSystemWindows(false);
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        }
    }
}
