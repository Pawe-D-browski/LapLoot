const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

const fs = require('fs');
const path = require('path');

const ws = require('windows-shortcuts');

module.exports = {
    packagerConfig: {
        name: 'LapLoot',
        asar: true,
        icon: "./app/renderer/logos/logo.ico",
        extraResource: ["./app/resources/fastfetch", "./app/resources/defaultSettings.json", "./app/resources/defaultStorage.json"],
        appCopyright: "Copyright © 2025 Paweł Dąbrowski"
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                "name": "LapLoot",
                "setupIcon": path.join(__dirname + "/app/renderer/logos/logo.ico"),
                "iconUrl": path.join(__dirname + "/app/renderer/logos/logo.ico"),
            },
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
        {
            name: '@electron-forge/maker-deb',
            config: {},
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        },
    ],
    hooks: {
        postPackage: async (forgeConfig, options) => {
            const outPath = path.join(options.outputPaths[0], "..")

            fs.rmSync(path.join(outPath, "./LapLoot"), { recursive: true, force: true });

            fs.mkdirSync(path.join(outPath, "./LapLoot"));
            fs.mkdirSync(path.join(outPath, "./LapLoot/data"));
            fs.mkdirSync(path.join(outPath, "./LapLoot/specifications"));
            fs.mkdirSync(path.join(outPath, "./LapLoot/offers"));

            fs.renameSync(options.outputPaths[0], path.join(outPath, "./LapLoot/app"));

            fs.renameSync(path.join(outPath, "./LapLoot/app/resources/defaultSettings.json"), path.join(outPath, "./LapLoot/data/settings.json"));
            fs.renameSync(path.join(outPath, "./LapLoot/app/resources/defaultStorage.json"), path.join(outPath, "./LapLoot/data/storage.json"));

            fs.copyFileSync(path.join(__dirname, "LICENSE"), path.join(outPath, "./LapLoot/LICENSE.txt"));
            fs.copyFileSync(path.join(__dirname, "/app/renderer/logos/logo.ico"), path.join(outPath, "./LapLoot/app/logo.ico"));

            ws.create(path.join(outPath, "./LapLoot/Run LapLoot.lnk"), {
                target: "%WINDIR%\\system32\\cmd.exe",
                args: '/c start "" "app\\LapLoot.exe"',
                icon: '%SystemRoot%\\System32\\SHELL32.dll',
                iconIndex: 263,
                desc: "Automatically generate sale offers for your devices in seconds.",
            });
        },
    },
    plugins: [
        {
            name: '@electron-forge/plugin-auto-unpack-natives',
            config: {},
        },
        // Fuses are used to enable/disable various Electron functionality
        // at package time, before code signing the application
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
            [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
            [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
        }),
    ],
};
