// electron-builder afterPack hook.
//
// electron-builder leaves the default Electron "linker-signed" ad-hoc
// signature (Identifier=Electron, Sealed Resources=none) which macOS
// Gatekeeper rejects as "damaged" on double-click. We re-sign the whole
// bundle deeply with an ad-hoc signature so the seal is valid and the app
// launches locally. (Real distribution still needs a Developer ID +
// notarization — this only fixes the "damaged" error.)
const { execFileSync } = require("child_process");
const path = require("path");

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") return;

  const appName = `${context.packager.appInfo.productFilename}.app`;
  const appPath = path.join(context.appOutDir, appName);

  console.log(`  • afterPack: deep ad-hoc signing ${appName}`);
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", appPath], {
    stdio: "inherit",
  });
};
