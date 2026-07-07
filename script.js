// Navbar Scroll and Sticky Logic
const navbar = document.querySelector('.navbar');
const backToTopBtn = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
    // Sticky Navbar transition
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Back to top button visibility
    if (window.scrollY > 500) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
});

// Back to Top click behavior
backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Mobile Hamburger Menu Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close mobile menu when nav link is clicked
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
}

// GitHub Dynamic Repositories Fetching & Rendering Engine
const repoGrid = document.getElementById('github-repos-grid');
const spinner = document.getElementById('github-spinner');
const loadMoreBtn = document.getElementById('load-more-btn');
const loadMoreContainer = document.getElementById('load-more-container');

const searchInput = document.getElementById('repo-search');
const langFilter = document.getElementById('repo-lang-filter');
const sortSelect = document.getElementById('repo-sort');

let allRepos = [];
let filteredRepos = [];
let currentPage = 1;
const reposPerPage = 6;

// Github language colors map
const langColors = {
    'javascript': '#f1e05a',
    'typescript': '#3178c6',
    'html': '#e34c26',
    'css': '#563d7c',
    'python': '#3572a5',
    'shell': '#89e051',
    'c++': '#f34b7d',
    'c': '#555555',
    'java': '#b07219'
};

// Format API date to friendly Month Year
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Cache-backed Github Fetch
async function fetchGithubRepos(username) {
    const CACHE_KEY = 'github_repos_data';
    const CACHE_TIME_KEY = 'github_repos_timestamp';
    const cacheLimit = 10 * 60 * 1000; // 10 minutes

    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

    if (cachedData && cachedTime && (Date.now() - cachedTime < cacheLimit)) {
        return JSON.parse(cachedData);
    }

    // Call actual API
    const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`);
    if (!response.ok) {
        throw new Error('Failed to fetch repositories from GitHub API');
    }
    const data = await response.json();
    
    // Store in cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    
    return data;
}

// Populate the languages drop-down filter
function populateLanguageFilter(repos) {
    const languages = new Set();
    repos.forEach(repo => {
        if (repo.language) {
            languages.add(repo.language);
        }
    });

    // Clear existing option list except 'All Languages'
    langFilter.innerHTML = '<option value="all">All Languages</option>';
    
    // Add unique language options
    Array.from(languages).sort().forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.toLowerCase();
        option.textContent = lang;
        langFilter.appendChild(option);
    });
}

// Filter, Sort, and Render logic
function filterAndSortRepos() {
    const searchVal = searchInput.value.toLowerCase().trim();
    const langVal = langFilter.value;
    const sortVal = sortSelect.value;

    // Apply Filters
    filteredRepos = allRepos.filter(repo => {
        // Match Search query
        const matchSearch = repo.name.toLowerCase().includes(searchVal) || 
                            (repo.description && repo.description.toLowerCase().includes(searchVal));
        
        // Match Selected Language
        const matchLang = langVal === 'all' || 
                          (repo.language && repo.language.toLowerCase() === langVal);
        
        return matchSearch && matchLang;
    });

    // Apply Sorting
    filteredRepos.sort((a, b) => {
        if (sortVal === 'stars') {
            return b.stargazers_count - a.stargazers_count;
        } else if (sortVal === 'name') {
            return a.name.localeCompare(b.name);
        } else { // default: updated
            return new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at);
        }
    });

    currentPage = 1;
    renderRepos();
}

// Render dynamic repo cards to the grid
function renderRepos() {
    repoGrid.innerHTML = '';
    
    const startIndex = 0;
    const endIndex = currentPage * reposPerPage;
    const reposToRender = filteredRepos.slice(startIndex, endIndex);

    if (reposToRender.length === 0) {
        repoGrid.innerHTML = `
            <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;">
                <i class="fas fa-search" style="font-size: 2.5rem; color: var(--clr-gold); margin-bottom: 1rem;"></i>
                <h3>No Repositories Found</h3>
                <p>Try adjusting your search filters or check back later.</p>
            </div>
        `;
        loadMoreContainer.style.display = 'none';
        return;
    }

    reposToRender.forEach(repo => {
        const lang = repo.language || '';
        const langLower = lang.toLowerCase();
        const color = langColors[langLower] || '#cccccc';

        // Render topics
        let topicsHTML = '';
        if (repo.topics && repo.topics.length > 0) {
            topicsHTML = `<div class="repo-topics">
                ${repo.topics.slice(0, 3).map(topic => `<span class="topic-badge">${topic}</span>`).join('')}
            </div>`;
        }

        // Render card markup
        const card = document.createElement('div');
        card.className = 'repo-card glass-card fade-in-up appear';
        card.innerHTML = `
            <div class="repo-header">
                <h3><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
                <a href="${repo.html_url}" class="repo-icon-link" target="_blank" aria-label="Open Repository"><i class="fab fa-github"></i></a>
            </div>
            <p class="repo-desc">${repo.description || 'No description available for this project.'}</p>
            ${topicsHTML}
            <div class="repo-footer">
                <span class="repo-lang">
                    ${lang ? `<span class="lang-circle" style="background-color: ${color}"></span> ${lang}` : ''}
                </span>
                <div class="repo-stats">
                    <span class="repo-stat-item"><i class="far fa-star"></i> ${repo.stargazers_count}</span>
                    <span class="repo-stat-item"><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
                </div>
            </div>
        `;
        repoGrid.appendChild(card);
    });

    // Check pagination visibility
    if (endIndex < filteredRepos.length) {
        loadMoreContainer.style.display = 'flex';
    } else {
        loadMoreContainer.style.display = 'none';
    }
}

// Attach Search/Filter Event Listeners
searchInput.addEventListener('input', filterAndSortRepos);
langFilter.addEventListener('change', filterAndSortRepos);
sortSelect.addEventListener('change', filterAndSortRepos);

loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    renderRepos();
});

// Load GitHub repositories on init
async function initGitHub() {
    try {
        const username = 'GeginRisho';
        const reposData = await fetchGithubRepos(username);
        
        // Filter out fork repositories and the GeginRisho profile README repo
        allRepos = reposData.filter(repo => !repo.fork && repo.name.toLowerCase() !== username.toLowerCase());
        
        populateLanguageFilter(allRepos);
        
        // Hide spinner and display repos grid
        spinner.style.display = 'none';
        repoGrid.style.display = 'grid';
        
        filterAndSortRepos();
    } catch (err) {
        console.error('GitHub Fetch Error:', err);
        spinner.style.display = 'none';
        repoGrid.style.display = 'block';
        repoGrid.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: 3rem 1.5rem; max-width: 600px; margin: 0 auto;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--clr-gold); margin-bottom: 1rem;"></i>
                <h3>Unable to Load Repositories</h3>
                <p style="margin-bottom: 1.5rem;">There was an issue fetching repositories from the GitHub API (e.g. rate limiting or network issues).</p>
                <a href="https://github.com/GeginRisho" target="_blank" class="btn primary-btn"><span>Visit My GitHub Profile</span> <i class="fab fa-github"></i></a>
            </div>
        `;
    }
}

// Scroll revealing animation wrapper using Intersection Observer
const observeElements = (classes) => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('appear');
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: "0px 0px -40px 0px"
    });

    classes.forEach(className => {
        const elements = document.querySelectorAll(className);
        elements.forEach(el => observer.observe(el));
    });
};

// Form Validation and Success Animation Card Transition
const contactForm = document.getElementById('contact-form');
const formContainer = document.getElementById('contact-form-container');

if (contactForm && formContainer) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Trigger loading state in submit button
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const submitTextSpan = submitBtn.querySelector('span');
        const submitIcon = submitBtn.querySelector('i');
        
        submitBtn.disabled = true;
        submitTextSpan.textContent = 'Sending...';
        submitIcon.className = 'fas fa-spinner fa-spin';

        // Simulate request delay to show premium loading transitions
        setTimeout(() => {
            // Smoothly replace form contents with checkmark success card
            formContainer.style.opacity = '0';
            formContainer.style.transition = 'opacity 0.4s ease';
            
            setTimeout(() => {
                formContainer.innerHTML = `
                    <div class="success-card">
                        <div class="success-icon-wrapper">
                            <i class="fas fa-check"></i>
                        </div>
                        <h3>Message Sent Successfully!</h3>
                        <p style="color: var(--clr-text-light); line-height: 1.6;">Thank you for reaching out. Your message has been received, and Gegin will contact you shortly.</p>
                    </div>
                `;
                formContainer.style.opacity = '1';
            }, 400);

        }, 1500);
    });
}

// Document initialized event
document.addEventListener('DOMContentLoaded', () => {
    // Start observing tags for entry transitions
    observeElements(['.fade-in', '.fade-in-up', '.fade-in-left', '.fade-in-right']);
    
    // Fetch GitHub Repos list
    initGitHub();
});
