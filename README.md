# dsh-whale-locale-ru

Независимый русский companion для **Whale Widget 0.4.2**. Не форк: оригинальный виджет, его код, изображения, иконки и аудио не поставляются. Версия companion: **0.1.2**.

## Требования и установка

Проверено только с **DeepSeek Harness 0.2.1-rc.2 / Whale 0.4.2**. Оригинальный `dsh-whale-widget` необходимо установить отдельно. Также отдельно нужен `dsh-russian-ui` либо совместимый провайдер locale `ru`: companion **не добавляет русский язык** в список языков.

**Desktop:** откройте **Plugins**, установите npm-пакет `dsh-whale-locale-ru`, затем перезапустите приложение. Desktop CLI не требуется. Выберите русский язык у установленного RU-провайдера.

**Web** (CLI DSH, не Desktop):

```sh
dsh plugin --profile web add dsh-whale-locale-ru
```

Альтернативы: [GitHub](https://github.com/pepperfm/dsh-whale-locale-ru) / `github:pepperfm/dsh-whale-locale-ru`, локальный каталог исходников или архив `.tgz` из [GitHub Releases](https://github.com/pepperfm/dsh-whale-locale-ru/releases). Страница пакета: [npm](https://www.npmjs.com/package/dsh-whale-locale-ru). Перезапустите Web DSH и обновите страницу.

## Поведение и границы

Адаптер меняет только DOM-представление при активном `ru` и обнаруженной версии Whale `0.4.2`. Будущие/неподдерживаемые версии — no-op. При смене языка, отключении или удалении эффекта исходные текст и CSS восстанавливаются. CSS ограничен порталами настроек, сохраняет пользовательский масштаб маскота.

Известные точные стандартные фразы переводятся, в том числе пользовательская копия, **полностью совпадающая** с известной стандартной фразой. Сохранённый текст не меняется. Произвольные имена пользователей, пользовательские названия, детали ошибок провайдеров и native alerts не переводятся (известные UI-префиксы ошибок могут переводиться, сами детали сохраняются). Нет runtime-зависимостей, сетевых запросов, доступа к ключам или записи пользовательских данных. Оригинальный виджет может выполнять собственные запросы независимо от companion.

Регрессии 0.1.2 покрывают редактор первого нажатия без заголовка баланса: вложенные подписи рамок, заголовки первого и A/B-нажатий, числовые подписи, стандартные реплики и их размещение в безопасной области. Проверки используют настоящий код Whale с замоканным backend при ширине 1440/630/390; это не гарантия перевода всех возможных сочетаний пользовательских модулей. Произвольный пользовательский текст сохраняется, а очень длинный текст в слишком маленькой пользовательской рамке может не поместиться.

## Разработка

Node 22 или 24. Сборка использует только встроенные модули Node, включая все helper runtimes; результат уже находится в `lib`.

```sh
npm ci --ignore-scripts --cache .npm-cache
npm run build
npm test
npx playwright-core install chromium
npm run test:browser
```

Dev dependencies закреплены: Whale `0.4.2`, `playwright-core` `1.64.1`. Браузерные тесты читают **настоящий runtime** оригинального npm dependency; ничего не копируют в release и не изменяют установленный виджет. `DSH_WHALE_DIR` позволяет задать каталог отдельно установленного Whale 0.4.2. `BROWSER_EXECUTABLE` необязателен; по умолчанию используется Chromium Playwright. Все backend responses замоканы. Скриншоты/отчёты — игнорируемый `test-results/`. Speech source list — замороженный исследовательский fixture. CI: Node 22/24 unit, отдельный Chromium browser job; автоматической публикации нет.

Лицензия собственного кода MIT; источник строк и условия — [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Исходный виджет: [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget). Провайдер русского языка: [dsh-russian-ui](https://github.com/pepperfm/dsh-russian-ui). CI проверяет сборку и тесты, но не публикует пакеты автоматически.

## English summary

Standalone Russian presentation companion, not a Whale fork. Requires the original Whale Widget **0.4.2** and a separately installed RU locale provider (for example `dsh-russian-ui`). Tested only with DSH **0.2.1-rc.2**. Install npm package `dsh-whale-locale-ru` through Desktop Plugins, or use the Web DSH command above, then restart. GitHub source and release archives are alternative installation methods.

Runs only for active `ru` and supported Whale version; future versions are unchanged. Reversible DOM/CSS changes preserve mascot scale and stored content. Exact known default phrases, including identical custom copies, are translated; arbitrary names, provider error details and native alerts are not. No artwork/audio/icons/original widget runtime is redistributed. No runtime dependencies, network, credential access or user-data writes. Development and browser commands above are portable; Chromium can be installed with `npx playwright-core install chromium` or selected through `BROWSER_EXECUTABLE`.
