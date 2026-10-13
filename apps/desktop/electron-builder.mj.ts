/**
 * Electron Builder Configuration - Superset MJ (fork build)
 *
 * Installs and runs beside the official app. Build with `bun run package:mj`,
 * which also bakes SUPERSET_WORKSPACE_NAME=mj (home ~/.superset-mj, scheme
 * superset-mj://) and its own notifications port into the bundle.
 */

import { join } from "node:path";
import type { Configuration } from "electron-builder";
import baseConfig from "./electron-builder";
import pkg from "./package.json";

// No "Superset (…)": upstream cleanup deletes app data dirs of that shape.
const productName = "Superset MJ";

const config: Configuration = {
	...baseConfig,
	appId: "com.superset.desktop.mj",
	productName,
	// Electron names the app (and its userData dir and single-instance lock)
	// from the packaged package.json, not from this config.
	extraMetadata: { ...baseConfig.extraMetadata, productName },
	publish: null,
	protocols: { name: productName, schemes: ["superset-mj"] },

	mac: {
		...baseConfig.mac,
		icon: join(pkg.resources, "build/icons/icon-dev.icns"),
		// A stable identity keeps macOS privacy grants across rebuilds; an
		// ad-hoc signature changes with every build.
		identity: "Apple Development: manav.mj.jain@gmail.com (7G8BFW87E6)",
		notarize: false,
		artifactName: `Superset-MJ-\${version}-\${arch}.\${ext}`,
		extendInfo: {
			...baseConfig.mac?.extendInfo,
			CFBundleName: productName,
			CFBundleDisplayName: productName,
		},
	},

	linux: {
		...baseConfig.linux,
		icon: join(pkg.resources, "build/icons/icon-dev.png"),
		executableName: "superset-mj",
		artifactName: `superset-mj-\${version}-\${arch}.\${ext}`,
	},

	win: {
		...baseConfig.win,
		icon: join(pkg.resources, "build/icons/icon-dev.ico"),
		artifactName: `Superset-MJ-\${version}-\${arch}.\${ext}`,
	},
};

export default config;
