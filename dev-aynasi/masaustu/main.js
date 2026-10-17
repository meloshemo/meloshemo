// Dev Aynası — masaüstü kabuğu (Electron).
//
// Oyun tarayıcıda çalışan bir canvas oyunu; bu dosya onu kendi penceresinde,
// kendi ikonuyla, tam ekran açılan bir uygulama hâline getirir.
//
//   cd masaustu && npm install && npm start      → dener
//   npm run paketle                              → kurulabilir dosya üretir

const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");

// Oyun dosyaları iki yerde olabilir:
//   geliştirirken  → bir üst klasör (projenin kendisi)
//   paketlendikten → resources/oyun (electron-builder oraya kopyalar)
// Kabuk oyunun kopyasını tutmaz; her iki durumda da tek bir kaynağı açar.
function oyunYolu() {
  const paketli = path.join(process.resourcesPath || "", "oyun", "index.html");
  if (app.isPackaged && require("fs").existsSync(paketli)) return paketli;
  return path.join(__dirname, "..", "index.html");
}

function pencereAc() {
  const pencere = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 860,
    minHeight: 560,
    backgroundColor: "#0a0710",      // oyunun zemini: açılışta beyaz çakma olmasın
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "..", "ikon", "dev-aynasi-512.png"),
    webPreferences: {
      // Oyun hiçbir Node API'si kullanmaz; kabuk da ona açmaz.
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,   // pencere arkadayken de akıcı kalsın
    },
  });

  // Pencere hazır olmadan gösterme: boş bir kare görünmesin.
  pencere.once("ready-to-show", () => pencere.show());
  pencere.loadFile(oyunYolu());

  // Oyunun içindeki dış bağlantılar (varsa) sistem tarayıcısında açılsın.
  pencere.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  return pencere;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);     // oyun kendi arayüzünü taşıyor
  const pencere = pencereAc();

  // F11 tam ekran, F12 geliştirici araçları.
  pencere.webContents.on("before-input-event", (olay, girdi) => {
    if (girdi.type !== "keyDown") return;
    if (girdi.key === "F11") {
      pencere.setFullScreen(!pencere.isFullScreen());
      olay.preventDefault();
    }
    if (girdi.key === "F12") {
      pencere.webContents.toggleDevTools();
      olay.preventDefault();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) pencereAc();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
