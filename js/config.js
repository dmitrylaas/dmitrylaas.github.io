"use strict";
// App configuration & offline fallback
const SITE_CONFIG = {
    githubUsername: "dmitrylaas",
    handle: "@dmitrylaas",
    startYear: 2026,
    excludedRepos: ["dmitrylaas", "dmitrylaas.github.io"],
    excludeForks: true,
    cacheKey: "dmitrylaas_repos_cache_v1",
    cacheTtlMs: 120000, // 2 min local cache window to stay within GitHub's 60 req/hr limit
    links: [
        {
            id: "email",
            labelKey: "linkEmail",
            title: "laasdmitriy@yandex.ru",
            url: "mailto:laasdmitriy@yandex.ru",
            isExternal: false,
            iconSvg: `<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 6l-10 7L2 6" /></svg>`
        },
        {
            id: "github",
            labelKey: "linkGithub",
            url: "https://github.com/dmitrylaas",
            isExternal: true,
            iconSvg: `<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>`
        },
        {
            id: "steam",
            labelKey: "linkSteam",
            url: "https://steamcommunity.com/id/sychdm",
            isExternal: true,
            iconSvg: `<svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><line x1="6" x2="10" y1="11" y2="11" /><line x1="8" x2="8" y1="9" y2="13" /><line x1="15" x2="15.01" y1="12" y2="12" /><line x1="18" x2="18.01" y1="10" y2="10" /><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" /></svg>`
        }
    ]
};

const STATUS_REGISTRY = {
    active: { cssClass: "badge-ok", textKey: "statusActive", order: 0 },
    archived: { cssClass: "badge-warn", textKey: "statusArchived", order: 1 },
    inactive: { cssClass: "badge-inactive", textKey: "statusInactive", order: 2 }
};

const FALLBACK_PROJECTS = [];