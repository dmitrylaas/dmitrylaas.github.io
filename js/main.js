"use strict";
// Main application engine
const AVATAR_FALLBACK_URI =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Crect width='256' height='256' fill='%231A1A1E'/%3E%3Ctext x='50%25' y='52%25' dominant-baseline='middle' text-anchor='middle' fill='%23F4F4F5' font-family='monospace' font-size='88' font-weight='700'%3EDL%3C/text%3E%3C/svg%3E";

function getLocale() {
    return (window.LOCALES && window.LOCALES.en) || {};
}

function applyTheme(theme) {
    const normalized = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", normalized);
}

function initAutoTheme() {
    if (!window.matchMedia) {
        applyTheme("light");
        return;
    }
    const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    applyTheme(darkMediaQuery.matches ? "dark" : "light");

    const handleThemeChange = (e) => {
        applyTheme(e.matches ? "dark" : "light");
    };
    if (typeof darkMediaQuery.addEventListener === "function") {
        darkMediaQuery.addEventListener("change", handleThemeChange);
    } else if (typeof darkMediaQuery.addListener === "function") {
        darkMediaQuery.addListener(handleThemeChange);
    }
}

function formatCounter(count) {
    return String(Math.max(0, Number(count) || 0)).padStart(2, "0");
}

function normalizeExternalUrl(rawUrl) {
    if (typeof rawUrl !== "string") return "";
    const trimmed = rawUrl.trim();
    if (!trimmed) return "";
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
        const parsed = new URL(candidate);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return parsed.href;
        }
    } catch (_) { }
    return "";
}

function formatRepoName(rawName) {
    return String(rawName || "").replace(/[-_]+/g, " ").trim();
}

// Detects live web URL from repo homepage or enabled GitHub Pages
function resolveLiveUrl(repo) {
    const homepageUrl = normalizeExternalUrl(repo.homepage);
    if (homepageUrl) return homepageUrl;

    if (repo.has_pages === true && typeof repo.name === "string" && repo.name.trim()) {
        const owner = (repo.owner && repo.owner.login) ? repo.owner.login : SITE_CONFIG.githubUsername;
        const repoName = repo.name.trim();
        if (repoName.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
            return `https://${owner.toLowerCase()}.github.io/`;
        }
        return `https://${owner.toLowerCase()}.github.io/${encodeURIComponent(repoName)}/`;
    }

    return "";
}

function parseGithubRepos(rawRepos) {
    if (!Array.isArray(rawRepos)) return [];
    const excluded = new Set(
        (SITE_CONFIG.excludedRepos || []).map((name) => String(name).toLowerCase())
    );

    return rawRepos
        .filter((repo) => {
            if (!repo || !repo.name || repo.private === true) return false;
            if (SITE_CONFIG.excludeForks && repo.fork === true) return false;
            return !excluded.has(String(repo.name).toLowerCase());
        })
        .map((repo) => {
            let status = "active";
            if (repo.archived === true) {
                status = "archived";
            } else if (repo.disabled === true) {
                status = "inactive";
            }

            return {
                id: String(repo.id || repo.name),
                name: formatRepoName(repo.name),
                description: typeof repo.description === "string" ? repo.description.trim() : "",
                liveUrl: resolveLiveUrl(repo),
                repoUrl: normalizeExternalUrl(repo.html_url),
                status,
                tags: Array.isArray(repo.topics)
                    ? repo.topics.map((tag) => String(tag).trim()).filter(Boolean)
                    : [],
                updatedTs: Date.parse(repo.pushed_at || repo.updated_at || "") || 0
            };
        })
        .sort((a, b) => {
            const orderA = (STATUS_REGISTRY[a.status] || STATUS_REGISTRY.active).order;
            const orderB = (STATUS_REGISTRY[b.status] || STATUS_REGISTRY.active).order;
            if (orderA !== orderB) return orderA - orderB;
            return b.updatedTs - a.updatedTs;
        });
}

function readReposCache() {
    try {
        const raw = localStorage.getItem(SITE_CONFIG.cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.projects)) return null;
        return parsed;
    } catch (_) {
        return null;
    }
}

function writeReposCache(projects, etag) {
    try {
        localStorage.setItem(
            SITE_CONFIG.cacheKey,
            JSON.stringify({
                projects,
                etag: etag || "",
                fetchedAt: Date.now()
            })
        );
    } catch (_) { }
}

function renderLoadingCard() {
    const projectsList = document.getElementById("projectsList");
    if (!projectsList) return;
    const t = getLocale();
    projectsList.innerHTML = "";
    const card = document.createElement("div");
    card.className = "projects-loading-card";
    card.textContent = t.loadingProjects || "";
    projectsList.appendChild(card);
}

function renderEmptyProjectsCard() {
    const projectsList = document.getElementById("projectsList");
    if (!projectsList) return;
    const t = getLocale();
    projectsList.innerHTML = "";

    const card = document.createElement("div");
    card.className = "empty-state-card";

    const shrugEl = document.createElement("div");
    shrugEl.className = "empty-shrug";
    shrugEl.setAttribute("aria-hidden", "true");
    shrugEl.textContent = t.emptyShrug || "";
    card.appendChild(shrugEl);

    const titleEl = document.createElement("div");
    titleEl.className = "empty-title";
    titleEl.textContent = t.emptyTitle || "";
    card.appendChild(titleEl);

    const descEl = document.createElement("p");
    descEl.className = "empty-desc";
    descEl.textContent = t.emptyDescription || "";
    card.appendChild(descEl);

    projectsList.appendChild(card);
}

function renderProjects(projects) {
    const t = getLocale();
    const list = Array.isArray(projects) ? projects : [];
    const projectsCountBadge = document.getElementById("projectsCountBadge");
    if (projectsCountBadge) {
        projectsCountBadge.textContent = formatCounter(list.length);
    }

    if (list.length === 0) {
        renderEmptyProjectsCard();
        return;
    }

    const projectsList = document.getElementById("projectsList");
    if (!projectsList) return;
    projectsList.innerHTML = "";

    list.forEach((project) => {
        const liveUrl = normalizeExternalUrl(project.liveUrl);
        const hasLiveUrl = liveUrl.length > 0;

        const card = document.createElement("div");
        card.className = hasLiveUrl ? "project-card has-live" : "project-card";

        const mainContainer = document.createElement(hasLiveUrl ? "a" : "div");
        mainContainer.className = hasLiveUrl ? "project-main-link" : "project-main-link is-static";
        if (hasLiveUrl) {
            mainContainer.href = liveUrl;
            mainContainer.target = "_blank";
            mainContainer.rel = "noopener noreferrer";
            mainContainer.title = t.openAppTitle || "";
        }

        const headRow = document.createElement("div");
        headRow.className = "project-head-row";

        const nameWrap = document.createElement("div");
        nameWrap.className = "project-name-wrap";

        const nameEl = document.createElement("span");
        nameEl.className = "project-name";
        nameEl.textContent = project.name || "";
        nameWrap.appendChild(nameEl);

        const statusMeta = STATUS_REGISTRY[project.status] || STATUS_REGISTRY.active;
        const badgeEl = document.createElement("span");
        badgeEl.className = `badge-capsule ${statusMeta.cssClass}`;
        badgeEl.textContent = t[statusMeta.textKey] || t.statusActive || "";
        nameWrap.appendChild(badgeEl);

        headRow.appendChild(nameWrap);

        if (hasLiveUrl) {
            const arrowEl = document.createElement("span");
            arrowEl.className = "project-arrow";
            arrowEl.setAttribute("aria-hidden", "true");
            arrowEl.innerHTML = `<svg class="icon-svg icon-sm" viewBox="0 0 24 24"><path d="M7 17L17 7" /><path d="M8 7h9v9" /></svg>`;
            headRow.appendChild(arrowEl);
        }

        mainContainer.appendChild(headRow);

        const descriptionText = typeof project.description === "string" ? project.description.trim() : "";
        if (descriptionText) {
            const descEl = document.createElement("p");
            descEl.className = "project-desc";
            descEl.textContent = descriptionText;
            mainContainer.appendChild(descEl);
        }

        card.appendChild(mainContainer);

        const tags = Array.isArray(project.tags) ? project.tags : [];
        const repoUrl = normalizeExternalUrl(project.repoUrl);
        const hasRepoUrl = repoUrl.length > 0;

        if (tags.length > 0 || hasRepoUrl) {
            const footerRow = document.createElement("div");
            footerRow.className = "project-footer-row";

            const tagsWrap = document.createElement("div");
            tagsWrap.className = "project-tags";
            tags.forEach((tagText) => {
                const tagEl = document.createElement("span");
                tagEl.className = "tech-tag";
                tagEl.textContent = tagText;
                tagsWrap.appendChild(tagEl);
            });
            footerRow.appendChild(tagsWrap);

            if (hasRepoUrl) {
                const repoLabel = t.repoBtnLabel || "";
                const repoLink = document.createElement("a");
                repoLink.className = "repo-btn";
                repoLink.href = repoUrl;
                repoLink.target = "_blank";
                repoLink.rel = "noopener noreferrer";
                repoLink.setAttribute("aria-label", `${project.name} — ${repoLabel}`);

                const repoTextEl = document.createElement("span");
                repoTextEl.textContent = repoLabel;
                repoLink.appendChild(repoTextEl);
                repoLink.insertAdjacentHTML(
                    "beforeend",
                    `<svg class="icon-svg icon-xs" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7" /><path d="M8 7h9v9" /></svg>`
                );
                footerRow.appendChild(repoLink);
            }

            card.appendChild(footerRow);
        }

        projectsList.appendChild(card);
    });
}

async function syncGithubProjects(force = false) {
    const cached = readReposCache();

    if (cached) {
        renderProjects(cached.projects);
        const isFresh = Date.now() - (cached.fetchedAt || 0) < SITE_CONFIG.cacheTtlMs;
        if (!force && isFresh) return;
    } else {
        renderLoadingCard();
    }

    const apiUrl = `https://api.github.com/users/${encodeURIComponent(SITE_CONFIG.githubUsername)}/repos?per_page=100&sort=pushed`;
    const headers = { Accept: "application/vnd.github+json" };

    // Conditional ETag request returns 304 without counting against the rate limit
    if (!force && cached && cached.etag) {
        headers["If-None-Match"] = cached.etag;
    }

    try {
        const res = await fetch(apiUrl, { headers });

        if (res.status === 304 && cached) {
            writeReposCache(cached.projects, cached.etag);
            return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const rawRepos = await res.json();
        const projects = parseGithubRepos(rawRepos);
        const nextEtag = res.headers.get("ETag") || "";
        writeReposCache(projects, nextEtag);
        renderProjects(projects);
    } catch (_) {
        if (!cached) {
            renderProjects(FALLBACK_PROJECTS);
        }
    }
}

function renderStaticShell() {
    const t = getLocale();
    document.documentElement.lang = "en";
    document.title = t.pageTitle || "";

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && t.metaDescription) {
        metaDesc.setAttribute("content", t.metaDescription);
    }

    const mainCardEl = document.getElementById("mainCard");
    if (mainCardEl) mainCardEl.setAttribute("aria-label", t.cardAriaLabel || "");

    const elName = document.getElementById("profileName");
    if (elName) elName.textContent = t.displayName || "";

    const elHandle = document.getElementById("profileHandle");
    if (elHandle) elHandle.textContent = SITE_CONFIG.handle;

    const elLinksTxt = document.getElementById("txtSectionLinks");
    if (elLinksTxt) elLinksTxt.textContent = t.sectionLinks || "";

    const elProjectsTxt = document.getElementById("txtSectionProjects");
    if (elProjectsTxt) elProjectsTxt.textContent = t.sectionProjects || "";

    const avatarImg = document.getElementById("githubAvatar");
    if (avatarImg) {
        const expectedSrc = `https://github.com/${SITE_CONFIG.githubUsername}.png?size=256`;
        avatarImg.onerror = () => {
            avatarImg.onerror = null;
            avatarImg.src = AVATAR_FALLBACK_URI;
        };
        if (avatarImg.getAttribute("src") !== expectedSrc) {
            avatarImg.src = expectedSrc;
        } else if (avatarImg.complete && avatarImg.naturalWidth === 0) {
            avatarImg.src = AVATAR_FALLBACK_URI;
        }
        avatarImg.alt = t.displayName || "";
    }

    const linksGrid = document.getElementById("linksGrid");
    if (linksGrid) {
        linksGrid.setAttribute("aria-label", t.sectionLinks || "");
        linksGrid.innerHTML = "";
        (SITE_CONFIG.links || []).forEach((item) => {
            const resolvedLabel = t[item.labelKey] || "";
            const anchor = document.createElement("a");
            anchor.className = "link-btn";
            anchor.href = item.url;
            if (item.isExternal !== false && !item.url.startsWith("mailto:")) {
                anchor.target = "_blank";
                anchor.rel = "noopener noreferrer";
            }
            if (item.title) {
                anchor.title = item.title;
            }
            anchor.setAttribute("aria-label", item.title ? `${resolvedLabel}: ${item.title}` : resolvedLabel);
            anchor.innerHTML = item.iconSvg || "";

            const labelEl = document.createElement("span");
            labelEl.className = "link-label";
            labelEl.textContent = resolvedLabel;
            anchor.appendChild(labelEl);

            linksGrid.appendChild(anchor);
        });
    }

    const footerEl = document.getElementById("lblFooterCopy");
    if (footerEl) {
        const startYear = SITE_CONFIG.startYear;
        const currentYear = new Date().getFullYear();
        const yearStr = currentYear > startYear ? `${startYear}–${currentYear}` : `${startYear}`;
        footerEl.textContent = (t.footerCopy || "").replace("{YEAR}", yearStr);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    try {
        initAutoTheme();
        renderStaticShell();
        syncGithubProjects();
        window.addEventListener("online", () => syncGithubProjects(true));
    } catch (err) {
        console.error("[app] Initialization error:", err);
    }
});