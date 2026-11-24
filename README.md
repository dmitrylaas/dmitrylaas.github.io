# dmitrylaas.github.io

[Русская версия](#русская-версия)

Personal page hosted on [GitHub Pages](https://dmitrylaas.github.io/). Plain HTML, CSS, and JavaScript without frameworks or build tools. Works both on GitHub Pages and when opened directly from disk.

## Structure

```text
.
├── index.html          # Page markup and script/style imports
├── favicon.svg         # Tab icon
├── css/
│   └── styles.css      # Themes, layout, responsive rules, dot grid
└── js/
    ├── config.js       # Profile settings, links, excluded repos, cache TTL
    ├── main.js         # Theme detection, GitHub API fetch, cache, rendering
    └── locales/
        └── en.js       # Static UI strings
```

## How it works

On load, `js/main.js` fetches public repositories for the account specified in `js/config.js` via the GitHub REST API (`per_page=100`, sorted by last push). Forks and names listed in `excludedRepos` are filtered out.

For each repository, the script reads its name, description, topics, and status (`active`, `archived`, or `inactive`). If the repo has a `homepage` URL or GitHub Pages enabled (`has_pages`), clicking the card opens that address. Otherwise, only the `Source` button is clickable. When no public repositories are returned, an empty state card is shown instead.

To stay within GitHub's unauthenticated rate limit (60 requests per hour), responses are cached in `localStorage` for 2 minutes (`cacheTtlMs`) along with the `ETag` header. Follow-up requests send `If-None-Match`, so unchanged `304` replies do not count against the quota. If a request fails and the cache is empty, the page falls back to `FALLBACK_PROJECTS` from `js/config.js`.

The color scheme follows the OS `prefers-color-scheme` setting. Footer copyright years update automatically from `startYear`.

## Editing

- GitHub username, contact links, excluded repos, or cache TTL: `js/config.js`
- Static text anywhere on the page: `js/locales/en.js`
- Colors and layout: `css/styles.css`

Keep the script order in `index.html` intact: `config.js`, then `locales/en.js`, then `main.js`.

---

## Русская версия

Личная страница-визитка для [GitHub Pages](https://dmitrylaas.github.io/). Собрана на обычных HTML, CSS и JS без фреймворков и сборщиков. Открывается и на хостинге, и напрямую с диска.

### Структура

```text
.
├── index.html          # Разметка страницы и подключение ресурсов
├── favicon.svg         # Иконка вкладки
├── css/
│   └── styles.css      # Стили, светлая и тёмная темы, адаптивность, сетка на фоне
└── js/
    ├── config.js       # Настройки профиля, ссылки, исключения, параметры кэша
    ├── main.js         # Автотема, запросы к GitHub API, кэш, рендер карточек
    └── locales/
        └── en.js       # Статические тексты интерфейса
```

### Как это работает

После загрузки `js/main.js` забирает список публичных репозиториев аккаунта из `js/config.js` через GitHub REST API (до 100 штук, сортировка по последнему пушу). Форки и репозитории из массива `excludedRepos` пропускаются.

Из каждого репозитория подтягиваются название, описание, теги (topics) и статус (`active`, `archived` или `inactive`). Если в репозитории заполнен `homepage` или включён GitHub Pages (`has_pages`), сама карточка ведёт на сайт проекта. Если сайта нет, кликабельной остаётся только кнопка `Source`. Когда репозиториев нет, вместо списка показывается карточка-заглушка.

Чтобы не упираться в анонимный лимит GitHub API (60 запросов в час), ответ хранится в `localStorage` 2 минуты (`cacheTtlMs`) вместе с `ETag`. Повторные запросы уходят с заголовком `If-None-Match`: если ничего не менялось, GitHub отвечает `304`, и лимит не расходуется. При сбое сети и пустом кэше используется массив `FALLBACK_PROJECTS` из `js/config.js`.

Тема подстраивается под системную (`prefers-color-scheme`). Год в футере считается автоматически от `startYear`.

### Где что менять

- Ник на GitHub, ссылки, исключённые репозитории, время жизни кэша: `js/config.js`
- Любые статические подписи на странице: `js/locales/en.js`
- Цвета и вёрстка: `css/styles.css`

Порядок подключения скриптов в `index.html` менять нельзя: сначала `config.js`, затем `locales/en.js`, в конце `main.js`.
