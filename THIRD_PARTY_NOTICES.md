# Third-party notices

AttestDock is an independent community project. It scans JavaScript and TypeScript applications integrating Primus zkTLS. It is not affiliated with or endorsed by Primus Labs.

This file records verified license metadata and notices for the versions pinned in pnpm-lock.yaml on 2026-11-08. The source repository does not vendor node_modules or dist. A package's presence in the lockfile does not mean its code is present in every distributed artifact. Keep the required license and copyright text with any dependency code or asset that you distribute. Review a hosted build or downloadable archive separately before release.

## Current dependency check (2026-11-17)

`pnpm licenses list --json` reported 199 installed package entries on the Windows development host. It lists `@primuslabs/zktls-js-sdk` 0.3.15 and `text-encoding-utf-8` 1.0.2 as `Unknown`, and `rpc-websockets` 9.3.9 as `LGPL-3.0-only`. This command does not cover packages absent from this host or decide which code is included in a hosted build. The inventory below remains the earlier 146-entry audit and must not be read as a complete current inventory.

The [official Primus SDK repository](https://github.com/primus-labs/zktls-js-sdk) currently shows no root license file, and its [package.json](https://github.com/primus-labs/zktls-js-sdk/blob/main/package.json) has no `license` field. Confirm the SDK redistribution terms with Primus Labs before hosting or distributing a build that includes it. Review the other unknown package and the LGPL package against the exact release artifact. This is a release check, not a conclusion that local development is forbidden.

## New Primus integration dependency review (2026-11-09)

The local X integration adds `@primuslabs/zktls-js-sdk` 0.3.15 and `ethers` 5.7.2. The installed Primus SDK package has no `license` field and no bundled license file. The [official source repository](https://github.com/primus-labs/zktls-js-sdk) also shows no license file in its root listing. **Its redistribution permission is not verified. Do not publish a build that includes this SDK until Primus Labs confirms the applicable license or grants permission.** Public source availability and npm installation do not by themselves grant redistribution rights.

The installed `ethers` 5.7.2 package declares MIT. Its `LICENSE.md` credits Richard Moore, 2019, and requires the MIT copyright and permission notice to accompany copies or substantial portions. The new SDK also brings additional transitive packages. The complete lockfile inventory below is the earlier 2026-11-08 audit and does not cover those new entries. Reaudit the full lockfile and redistributed bundle before public release. No license is inferred for the Primus SDK.

## Lucide icons and Feather portions

The UI imports 13 icons from lucide-react 0.468.0. Its installed LICENSE file declares ISC and credits Cole Bemis for Feather portions. The full installed Lucide license notice appears below. [Lucide's license page](https://lucide.dev/license) lists icons derived from Feather and shows the Feather MIT notice. Of the icons imported here, ArrowDown, ArrowUpRight, Check, ChevronDown, Download, and Upload match names on that derived-icon list. The other imported icons are not identified as Feather-derived by that list.

The installed package notice states that portions of Lucide are held by Cole Bemis, 2013-2022, as part of Feather (MIT), and that other Lucide copyright is held by Lucide Contributors, 2022. The [Feather repository license](https://github.com/feathericons/feather/blob/master/LICENSE) names Cole Bemis and uses MIT. These notices apply to icons rendered in the application and visible in screenshots. The ISC and MIT terms require preservation of their copyright and permission notices in copies or substantial portions, as applicable. Keep both notices with redistributed icon assets. The exact installed Lucide license text follows:


```text
ISC License

Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2022.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

The Feather MIT notice below uses the copyright line in the [Feather repository license](https://github.com/feathericons/feather/blob/master/LICENSE). The rest is the standard MIT text already present in this repository. It is included for the Feather-derived icon portions, not as a change to AttestDock's LICENSE.

```text
The MIT License (MIT)

Copyright (c) 2013-2023 Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Other identified licenses and duties

| Package or group | Pinned license | Notice or attribution requirement |
| --- | --- | --- |
| TypeScript 5.9.3; baseline-browser-mapping 2.11.35; detect-libc 2.1.2; expect-type 1.4.0 | Apache-2.0 | Preserve the [Apache-2.0 license](https://www.apache.org/licenses/LICENSE-2.0.html), copyright notices, and any applicable NOTICE content when redistributing covered code. The installed TypeScript package has LICENSE.txt and ThirdPartyNoticeText.txt. TypeScript is imported by the scanner and is included in the browser worker build. |
| caniuse-lite 1.0.30001823 | CC-BY-4.0 | Its [README](https://github.com/browserslist/caniuse-lite#license) asks for attribution to [caniuse.com](https://caniuse.com/) when its data is used. If that data is redistributed, provide attribution, a [CC-BY-4.0 license link](https://creativecommons.org/licenses/by/4.0/), and an indication of changes when applicable. |
| Lightning CSS 1.33.0 and 11 platform variants | MPL-2.0 | Build-tool packages. If covered files or executable forms are redistributed, follow the [MPL-2.0](https://www.mozilla.org/en-US/MPL/2.0/) source and notice terms. The installed Windows package and main package contain LICENSE files; license files for packages absent on this host were not inspected. |
| source-map-js 1.2.2 | BSD-3-Clause | Preserve its copyright, conditions, and disclaimer in source copies or accompanying binary documentation. The installed LICENSE credits Mozilla Foundation and contributors, 2009-2011. |
| electron-to-chromium 1.5.478; graceful-fs 4.2.11; lru-cache 5.1.1; picocolors 1.1.1; semver 6.3.2; siginfo 2.0.0; yallist 3.1.1 | ISC | Preserve each package's own copyright and permission notice when redistributing covered code. Lucide is listed separately above. |
| MIT packages in the inventory below | MIT | Preserve each package's own copyright and MIT permission notice in copies or substantial portions. The AttestDock MIT file does not replace their notices. |

No GPL, AGPL, commercial-only, non-commercial, or unknown declared license was found in the 146 audited lockfile entries. This metadata check does not prove that all copyright notices are complete. The 35 packages absent on this Windows host were checked through published npm version manifests. Their exact license files remain unverified.

## Other assets

- public/favicon.svg is a custom shield/check drawing made for this project with AI assistance. No official Primus logo or file was used. Its ownership and trademark similarity still need human confirmation.
- screenshots/desktop.png, screenshots/mobile.png, and screenshots/tablet.png are captures of the AttestDock interface. They contain Lucide icons. Their branding must match the current application before publication.
- The CSS names Segoe UI, Arial, and Consolas as system fonts. No font binary is included in the repository.
- Official Primus SDK names and documentation links are factual technical references. No official Primus image asset is included. This notice does not grant a right to use any Primus trademark.

## Complete lockfile license inventory

The table records declared licenses, not all copyright holders. “Installed” means the package was available on the audited Windows host. “Manifest” means the published npm version manifest was checked because the platform package was absent. Preserve exact package license files if dependency code is included in a future release.

| Package | Version | Scope | License | Evidence |
| --- | --- | --- | --- | --- |
| [@babel/code-frame](https://registry.npmjs.org/%40babel%2Fcode-frame/7.29.7) | 7.29.7 | Transitive | MIT | Installed |
| [@babel/compat-data](https://registry.npmjs.org/%40babel%2Fcompat-data/7.29.7) | 7.29.7 | Transitive | MIT | Installed |
| [@babel/core](https://registry.npmjs.org/%40babel%2Fcore/7.29.13) | 7.29.13 | Transitive | MIT | Installed |
| [@babel/generator](https://registry.npmjs.org/%40babel%2Fgenerator/7.29.13) | 7.29.13 | Transitive | MIT | Installed |
| [@babel/helper-compilation-targets](https://registry.npmjs.org/%40babel%2Fhelper-compilation-targets/7.29.13) | 7.29.13 | Transitive | MIT | Installed |
| [@babel/helper-globals](https://registry.npmjs.org/%40babel%2Fhelper-globals/7.29.7) | 7.29.7 | Transitive | MIT | Installed |
| [@babel/helper-module-imports](https://registry.npmjs.org/%40babel%2Fhelper-module-imports/7.29.7) | 7.29.7 | Transitive | MIT | Installed |
| [@babel/helper-module-transforms](https://registry.npmjs.org/%40babel%2Fhelper-module-transforms/7.29.13) | 7.29.13 | Transitive | MIT | Installed |
| [@babel/helper-plugin-utils](https://registry.npmjs.org/%40babel%2Fhelper-plugin-utils/7.29.7) | 7.29.7 | Transitive | MIT | Installed |
| [@babel/helper-string-parser](https://registry.npmjs.org/%40babel%2Fhelper-string-parser/7.29.13) | 7.29.13 | Transitive | MIT | Installed |
| [@babel/helper-validator-identifier](https://registry.npmjs.org/%40babel%2Fhelper-validator-identifier/7.29.7) | 7.29.7 | Transitive | MIT | Installed |
| [@babel/helper-validator-option](https://registry.npmjs.org/%40babel%2Fhelper-validator-option/7.29.7) | 7.29.7 | Transitive | MIT | Installed |
| [@babel/helpers](https://registry.npmjs.org/%40babel%2Fhelpers/7.29.13) | 7.29.13 | Transitive | MIT | Installed |
| [@babel/parser](https://registry.npmjs.org/%40babel%2Fparser/7.29.13) | 7.29.13 | Transitive | MIT | Installed |
| [@babel/plugin-transform-react-jsx-self](https://registry.npmjs.org/%40babel%2Fplugin-transform-react-jsx-self/7.29.7) | 7.29.7 | Transitive | MIT | Installed |
| [@babel/plugin-transform-react-jsx-source](https://registry.npmjs.org/%40babel%2Fplugin-transform-react-jsx-source/7.29.7) | 7.29.7 | Transitive | MIT | Installed |
| [@babel/template](https://registry.npmjs.org/%40babel%2Ftemplate/7.29.7) | 7.29.7 | Transitive | MIT | Installed |
| [@babel/traverse](https://registry.npmjs.org/%40babel%2Ftraverse/7.29.13) | 7.29.13 | Transitive | MIT | Installed |
| [@babel/types](https://registry.npmjs.org/%40babel%2Ftypes/7.29.11) | 7.29.11 | Transitive | MIT | Installed |
| [@jridgewell/gen-mapping](https://registry.npmjs.org/%40jridgewell%2Fgen-mapping/0.3.13) | 0.3.13 | Transitive | MIT | Installed |
| [@jridgewell/remapping](https://registry.npmjs.org/%40jridgewell%2Fremapping/2.3.5) | 2.3.5 | Transitive | MIT | Installed |
| [@jridgewell/resolve-uri](https://registry.npmjs.org/%40jridgewell%2Fresolve-uri/3.1.2) | 3.1.2 | Transitive | MIT | Installed |
| [@jridgewell/sourcemap-codec](https://registry.npmjs.org/%40jridgewell%2Fsourcemap-codec/1.6.0) | 1.6.0 | Transitive | MIT | Installed |
| [@jridgewell/trace-mapping](https://registry.npmjs.org/%40jridgewell%2Ftrace-mapping/0.3.31) | 0.3.31 | Transitive | MIT | Installed |
| [@oxc-project/types](https://registry.npmjs.org/%40oxc-project%2Ftypes/0.156.0) | 0.156.0 | Transitive | MIT | Installed |
| [@rolldown/binding-android-arm-eabi](https://registry.npmjs.org/%40rolldown%2Fbinding-android-arm-eabi/1.2.16) | 1.2.16 | Transitive | MIT | Manifest |
| [@rolldown/binding-android-arm64](https://registry.npmjs.org/%40rolldown%2Fbinding-android-arm64/1.2.16) | 1.2.16 | Transitive | MIT | Manifest |
| [@rolldown/binding-darwin-arm64](https://registry.npmjs.org/%40rolldown%2Fbinding-darwin-arm64/1.2.16) | 1.2.16 | Transitive | MIT | Manifest |
| [@rolldown/binding-darwin-x64](https://registry.npmjs.org/%40rolldown%2Fbinding-darwin-x64/1.2.16) | 1.2.16 | Transitive | MIT | Manifest |
| [@rolldown/binding-freebsd-x64](https://registry.npmjs.org/%40rolldown%2Fbinding-freebsd-x64/1.2.16) | 1.2.16 | Transitive | MIT | Manifest |
| [@rolldown/binding-linux-arm-gnueabihf](https://registry.npmjs.org/%40rolldown%2Fbinding-linux-arm-gnueabihf/1.2.16) | 1.2.16 | Transitive | MIT | Manifest |
| [@rolldown/binding-linux-arm64-gnu](https://registry.npmjs.org/%40rolldown%2Fbinding-linux-arm64-gnu/1.2.16) | 1.2.16 | Transitive | MIT | Manifest |
| [@rolldown/binding-linux-arm64-musl](https://registry.npmjs.org/%40rolldown%2Fbinding-linux-arm64-musl/1.2.16) | 1.2.16 | Transitive | MIT | Manifest |
| [@rolldown/binding-linux-ppc64-gnu](https://registry.npmjs.org/%40rolldown%2Fbinding-linux-ppc64-gnu/1.2.16) | 1.2.16 | Transitive | MIT | Manifest |
| [@rolldown/binding-linux-s390x-gnu](https://registry.npmjs.org/%40rolldown%2Fbinding-linux-s390x-gnu/1.2.16) | 1.2.16 | Transitive | MIT | Manifest |
| [@rolldown/binding-linux-x64-gnu](https://registry.npmjs.org/%40rolldown%2Fbinding-linux-x64-gnu/1.2.16) | 1.2.16 | Transitive | MIT | Manifest |
| [@rolldown/binding-linux-x64-musl](https://registry.npmjs.org/%40rolldown%2Fbinding-linux-x64-musl/1.2.16) | 1.2.16 | Transitive | MIT | Manifest |
| [@rolldown/binding-openharmony-arm64](https://registry.npmjs.org/%40rolldown%2Fbinding-openharmony-arm64/1.2.16) | 1.2.16 | Transitive | MIT | Manifest |
| [@rolldown/binding-win32-arm64-msvc](https://registry.npmjs.org/%40rolldown%2Fbinding-win32-arm64-msvc/1.2.16) | 1.2.16 | Transitive | MIT | Manifest |
| [@rolldown/binding-win32-x64-msvc](https://registry.npmjs.org/%40rolldown%2Fbinding-win32-x64-msvc/1.2.16) | 1.2.16 | Transitive | MIT | Installed |
| [@rolldown/pluginutils](https://registry.npmjs.org/%40rolldown%2Fpluginutils/1.0.0-rc.3) | 1.0.0-rc.3 | Transitive | MIT | Installed |
| [@rolldown/pluginutils](https://registry.npmjs.org/%40rolldown%2Fpluginutils/1.0.1) | 1.0.1 | Transitive | MIT | Installed |
| [@standard-schema/spec](https://registry.npmjs.org/%40standard-schema%2Fspec/1.1.0) | 1.1.0 | Transitive | MIT | Installed |
| [@tailwindcss/node](https://registry.npmjs.org/%40tailwindcss%2Fnode/4.3.5) | 4.3.5 | Transitive | MIT | Installed |
| [@tailwindcss/oxide](https://registry.npmjs.org/%40tailwindcss%2Foxide/4.3.5) | 4.3.5 | Transitive | MIT | Installed |
| [@tailwindcss/oxide-android-arm64](https://registry.npmjs.org/%40tailwindcss%2Foxide-android-arm64/4.3.5) | 4.3.5 | Transitive | MIT | Manifest |
| [@tailwindcss/oxide-darwin-arm64](https://registry.npmjs.org/%40tailwindcss%2Foxide-darwin-arm64/4.3.5) | 4.3.5 | Transitive | MIT | Manifest |
| [@tailwindcss/oxide-darwin-x64](https://registry.npmjs.org/%40tailwindcss%2Foxide-darwin-x64/4.3.5) | 4.3.5 | Transitive | MIT | Manifest |
| [@tailwindcss/oxide-freebsd-x64](https://registry.npmjs.org/%40tailwindcss%2Foxide-freebsd-x64/4.3.5) | 4.3.5 | Transitive | MIT | Manifest |
| [@tailwindcss/oxide-linux-arm-gnueabihf](https://registry.npmjs.org/%40tailwindcss%2Foxide-linux-arm-gnueabihf/4.3.5) | 4.3.5 | Transitive | MIT | Manifest |
| [@tailwindcss/oxide-linux-arm64-gnu](https://registry.npmjs.org/%40tailwindcss%2Foxide-linux-arm64-gnu/4.3.5) | 4.3.5 | Transitive | MIT | Manifest |
| [@tailwindcss/oxide-linux-arm64-musl](https://registry.npmjs.org/%40tailwindcss%2Foxide-linux-arm64-musl/4.3.5) | 4.3.5 | Transitive | MIT | Manifest |
| [@tailwindcss/oxide-linux-x64-gnu](https://registry.npmjs.org/%40tailwindcss%2Foxide-linux-x64-gnu/4.3.5) | 4.3.5 | Transitive | MIT | Manifest |
| [@tailwindcss/oxide-linux-x64-musl](https://registry.npmjs.org/%40tailwindcss%2Foxide-linux-x64-musl/4.3.5) | 4.3.5 | Transitive | MIT | Manifest |
| [@tailwindcss/oxide-wasm32-wasi](https://registry.npmjs.org/%40tailwindcss%2Foxide-wasm32-wasi/4.3.5) | 4.3.5 | Transitive | MIT | Installed |
| [@tailwindcss/oxide-win32-arm64-msvc](https://registry.npmjs.org/%40tailwindcss%2Foxide-win32-arm64-msvc/4.3.5) | 4.3.5 | Transitive | MIT | Manifest |
| [@tailwindcss/oxide-win32-x64-msvc](https://registry.npmjs.org/%40tailwindcss%2Foxide-win32-x64-msvc/4.3.5) | 4.3.5 | Transitive | MIT | Installed |
| [@tailwindcss/vite](https://registry.npmjs.org/%40tailwindcss%2Fvite/4.3.5) | 4.3.5 | Direct development | MIT | Installed |
| [@types/babel__core](https://registry.npmjs.org/%40types%2Fbabel__core/7.20.5) | 7.20.5 | Transitive | MIT | Installed |
| [@types/babel__generator](https://registry.npmjs.org/%40types%2Fbabel__generator/7.27.0) | 7.27.0 | Transitive | MIT | Installed |
| [@types/babel__template](https://registry.npmjs.org/%40types%2Fbabel__template/7.4.4) | 7.4.4 | Transitive | MIT | Installed |
| [@types/babel__traverse](https://registry.npmjs.org/%40types%2Fbabel__traverse/7.28.0) | 7.28.0 | Transitive | MIT | Installed |
| [@types/chai](https://registry.npmjs.org/%40types%2Fchai/5.2.3) | 5.2.3 | Transitive | MIT | Installed |
| [@types/deep-eql](https://registry.npmjs.org/%40types%2Fdeep-eql/4.0.2) | 4.0.2 | Transitive | MIT | Installed |
| [@types/estree](https://registry.npmjs.org/%40types%2Festree/1.0.10) | 1.0.10 | Transitive | MIT | Installed |
| [@types/react](https://registry.npmjs.org/%40types%2Freact/19.3.0) | 19.3.0 | Direct development | MIT | Installed |
| [@types/node](https://registry.npmjs.org/%40types%2Fnode/24.19.2) | 24.19.2 | Direct development | MIT | Installed |
| [@types/react-dom](https://registry.npmjs.org/%40types%2Freact-dom/19.3.0) | 19.3.0 | Direct development | MIT | Installed |
| [@vitejs/plugin-react](https://registry.npmjs.org/%40vitejs%2Fplugin-react/5.2.0) | 5.2.0 | Direct development | MIT | Installed |
| [@vitest/expect](https://registry.npmjs.org/%40vitest%2Fexpect/4.1.12) | 4.1.12 | Transitive | MIT | Installed |
| [@vitest/mocker](https://registry.npmjs.org/%40vitest%2Fmocker/4.1.12) | 4.1.12 | Transitive | MIT | Installed |
| [@vitest/pretty-format](https://registry.npmjs.org/%40vitest%2Fpretty-format/4.1.12) | 4.1.12 | Transitive | MIT | Installed |
| [@vitest/runner](https://registry.npmjs.org/%40vitest%2Frunner/4.1.12) | 4.1.12 | Transitive | MIT | Installed |
| [@vitest/snapshot](https://registry.npmjs.org/%40vitest%2Fsnapshot/4.1.12) | 4.1.12 | Transitive | MIT | Installed |
| [@vitest/spy](https://registry.npmjs.org/%40vitest%2Fspy/4.1.12) | 4.1.12 | Transitive | MIT | Installed |
| [@vitest/utils](https://registry.npmjs.org/%40vitest%2Futils/4.1.12) | 4.1.12 | Transitive | MIT | Installed |
| [assertion-error](https://registry.npmjs.org/assertion-error/2.0.1) | 2.0.1 | Transitive | MIT | Installed |
| [baseline-browser-mapping](https://registry.npmjs.org/baseline-browser-mapping/2.11.35) | 2.11.35 | Transitive | Apache-2.0 | Installed |
| [browserslist](https://registry.npmjs.org/browserslist/4.29.5) | 4.29.5 | Transitive | MIT | Installed |
| [caniuse-lite](https://registry.npmjs.org/caniuse-lite/1.0.30001823) | 1.0.30001823 | Transitive | CC-BY-4.0 | Installed |
| [chai](https://registry.npmjs.org/chai/6.3.0) | 6.3.0 | Transitive | MIT | Installed |
| [convert-source-map](https://registry.npmjs.org/convert-source-map/2.0.0) | 2.0.0 | Transitive | MIT | Installed |
| [csstype](https://registry.npmjs.org/csstype/3.2.3) | 3.2.3 | Transitive | MIT | Installed |
| [debug](https://registry.npmjs.org/debug/4.4.3) | 4.4.3 | Transitive | MIT | Installed |
| [detect-libc](https://registry.npmjs.org/detect-libc/2.1.2) | 2.1.2 | Transitive | Apache-2.0 | Installed |
| [electron-to-chromium](https://registry.npmjs.org/electron-to-chromium/1.5.478) | 1.5.478 | Transitive | ISC | Installed |
| [enhanced-resolve](https://registry.npmjs.org/enhanced-resolve/5.26.1) | 5.26.1 | Transitive | MIT | Installed |
| [es-module-lexer](https://registry.npmjs.org/es-module-lexer/2.3.2) | 2.3.2 | Transitive | MIT | Installed |
| [escalade](https://registry.npmjs.org/escalade/3.2.0) | 3.2.0 | Transitive | MIT | Installed |
| [estree-walker](https://registry.npmjs.org/estree-walker/3.0.3) | 3.0.3 | Transitive | MIT | Installed |
| [expect-type](https://registry.npmjs.org/expect-type/1.4.0) | 1.4.0 | Transitive | Apache-2.0 | Installed |
| [fdir](https://registry.npmjs.org/fdir/6.5.0) | 6.5.0 | Transitive | MIT | Installed |
| [fsevents](https://registry.npmjs.org/fsevents/2.3.3) | 2.3.3 | Transitive | MIT | Manifest |
| [gensync](https://registry.npmjs.org/gensync/1.0.0-beta.2) | 1.0.0-beta.2 | Transitive | MIT | Installed |
| [graceful-fs](https://registry.npmjs.org/graceful-fs/4.2.11) | 4.2.11 | Transitive | ISC | Installed |
| [jiti](https://registry.npmjs.org/jiti/2.7.0) | 2.7.0 | Transitive | MIT | Installed |
| [js-tokens](https://registry.npmjs.org/js-tokens/4.0.0) | 4.0.0 | Transitive | MIT | Installed |
| [jsesc](https://registry.npmjs.org/jsesc/3.1.0) | 3.1.0 | Transitive | MIT | Installed |
| [json5](https://registry.npmjs.org/json5/2.2.3) | 2.2.3 | Transitive | MIT | Installed |
| [lightningcss](https://registry.npmjs.org/lightningcss/1.33.0) | 1.33.0 | Transitive | MPL-2.0 | Installed |
| [lightningcss-android-arm64](https://registry.npmjs.org/lightningcss-android-arm64/1.33.0) | 1.33.0 | Transitive | MPL-2.0 | Manifest |
| [lightningcss-darwin-arm64](https://registry.npmjs.org/lightningcss-darwin-arm64/1.33.0) | 1.33.0 | Transitive | MPL-2.0 | Manifest |
| [lightningcss-darwin-x64](https://registry.npmjs.org/lightningcss-darwin-x64/1.33.0) | 1.33.0 | Transitive | MPL-2.0 | Manifest |
| [lightningcss-freebsd-x64](https://registry.npmjs.org/lightningcss-freebsd-x64/1.33.0) | 1.33.0 | Transitive | MPL-2.0 | Manifest |
| [lightningcss-linux-arm-gnueabihf](https://registry.npmjs.org/lightningcss-linux-arm-gnueabihf/1.33.0) | 1.33.0 | Transitive | MPL-2.0 | Manifest |
| [lightningcss-linux-arm64-gnu](https://registry.npmjs.org/lightningcss-linux-arm64-gnu/1.33.0) | 1.33.0 | Transitive | MPL-2.0 | Manifest |
| [lightningcss-linux-arm64-musl](https://registry.npmjs.org/lightningcss-linux-arm64-musl/1.33.0) | 1.33.0 | Transitive | MPL-2.0 | Manifest |
| [lightningcss-linux-x64-gnu](https://registry.npmjs.org/lightningcss-linux-x64-gnu/1.33.0) | 1.33.0 | Transitive | MPL-2.0 | Manifest |
| [lightningcss-linux-x64-musl](https://registry.npmjs.org/lightningcss-linux-x64-musl/1.33.0) | 1.33.0 | Transitive | MPL-2.0 | Manifest |
| [lightningcss-win32-arm64-msvc](https://registry.npmjs.org/lightningcss-win32-arm64-msvc/1.33.0) | 1.33.0 | Transitive | MPL-2.0 | Manifest |
| [lightningcss-win32-x64-msvc](https://registry.npmjs.org/lightningcss-win32-x64-msvc/1.33.0) | 1.33.0 | Transitive | MPL-2.0 | Installed |
| [lru-cache](https://registry.npmjs.org/lru-cache/5.1.1) | 5.1.1 | Transitive | ISC | Installed |
| [lucide-react](https://registry.npmjs.org/lucide-react/0.468.0) | 0.468.0 | Direct runtime | ISC | Installed |
| [magic-string](https://registry.npmjs.org/magic-string/0.30.21) | 0.30.21 | Transitive | MIT | Installed |
| [magic-string](https://registry.npmjs.org/magic-string/1.4.5) | 1.4.5 | Transitive | MIT | Installed |
| [ms](https://registry.npmjs.org/ms/2.1.3) | 2.1.3 | Transitive | MIT | Installed |
| [nanoid](https://registry.npmjs.org/nanoid/3.3.20) | 3.3.20 | Transitive | MIT | Installed |
| [node-releases](https://registry.npmjs.org/node-releases/2.0.63) | 2.0.63 | Transitive | MIT | Installed |
| [obug](https://registry.npmjs.org/obug/2.2.1) | 2.2.1 | Transitive | MIT | Installed |
| [pathe](https://registry.npmjs.org/pathe/2.0.3) | 2.0.3 | Transitive | MIT | Installed |
| [picocolors](https://registry.npmjs.org/picocolors/1.1.1) | 1.1.1 | Transitive | ISC | Installed |
| [picomatch](https://registry.npmjs.org/picomatch/4.0.7) | 4.0.7 | Transitive | MIT | Installed |
| [postcss](https://registry.npmjs.org/postcss/8.5.32) | 8.5.32 | Transitive | MIT | Installed |
| [react](https://registry.npmjs.org/react/19.3.1) | 19.3.1 | Direct runtime | MIT | Installed |
| [react-dom](https://registry.npmjs.org/react-dom/19.3.1) | 19.3.1 | Direct runtime | MIT | Installed |
| [react-refresh](https://registry.npmjs.org/react-refresh/0.18.0) | 0.18.0 | Transitive | MIT | Installed |
| [rolldown](https://registry.npmjs.org/rolldown/1.2.16) | 1.2.16 | Transitive | MIT | Installed |
| [scheduler](https://registry.npmjs.org/scheduler/0.28.0) | 0.28.0 | Transitive | MIT | Installed |
| [semver](https://registry.npmjs.org/semver/6.3.2) | 6.3.2 | Transitive | ISC | Installed |
| [siginfo](https://registry.npmjs.org/siginfo/2.0.0) | 2.0.0 | Transitive | ISC | Installed |
| [source-map-js](https://registry.npmjs.org/source-map-js/1.2.2) | 1.2.2 | Transitive | BSD-3-Clause | Installed |
| [stackback](https://registry.npmjs.org/stackback/0.0.2) | 0.0.2 | Transitive | MIT | Installed |
| [std-env](https://registry.npmjs.org/std-env/4.3.0) | 4.3.0 | Transitive | MIT | Installed |
| [tailwindcss](https://registry.npmjs.org/tailwindcss/4.3.5) | 4.3.5 | Direct development | MIT | Installed |
| [tapable](https://registry.npmjs.org/tapable/2.3.3) | 2.3.3 | Transitive | MIT | Installed |
| [tinybench](https://registry.npmjs.org/tinybench/2.9.0) | 2.9.0 | Transitive | MIT | Installed |
| [tinyexec](https://registry.npmjs.org/tinyexec/1.3.1) | 1.3.1 | Transitive | MIT | Installed |
| [tinyglobby](https://registry.npmjs.org/tinyglobby/0.2.17) | 0.2.17 | Transitive | MIT | Installed |
| [tinyrainbow](https://registry.npmjs.org/tinyrainbow/3.2.0) | 3.2.0 | Transitive | MIT | Installed |
| [typescript](https://registry.npmjs.org/typescript/5.9.3) | 5.9.3 | Direct development | Apache-2.0 | Installed |
| [undici-types](https://registry.npmjs.org/undici-types/7.24.6) | 7.24.6 | Transitive | MIT | Installed |
| [update-browserslist-db](https://registry.npmjs.org/update-browserslist-db/1.3.4) | 1.3.4 | Transitive | MIT | Installed |
| [vite](https://registry.npmjs.org/vite/8.3.6) | 8.3.6 | Direct development | MIT | Installed |
| [vitest](https://registry.npmjs.org/vitest/4.1.12) | 4.1.12 | Direct development | MIT | Installed |
| [why-is-node-running](https://registry.npmjs.org/why-is-node-running/2.3.0) | 2.3.0 | Transitive | MIT | Installed |
| [yallist](https://registry.npmjs.org/yallist/3.1.1) | 3.1.1 | Transitive | ISC | Installed |
