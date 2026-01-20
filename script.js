/**
 * Book Rankings - Main Script
 * Loads books from JSON and renders them with covers from Open Library API
 */

const OPEN_LIBRARY_COVER_URL = 'https://covers.openlibrary.org/b/isbn/';
const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';

document.addEventListener('DOMContentLoaded', () => {
    init();
    initModal();
});

async function init() {
    const booksGrid = document.getElementById('books-grid');
    const loadingEl = document.getElementById('loading');
    const emptyState = document.getElementById('empty-state');

    try {
        const books = await loadBooks();
        loadingEl.hidden = true;

        if (books.length === 0) {
            emptyState.hidden = false;
            return;
        }

        // Sort books by rank
        books.sort((a, b) => a.rank - b.rank);

        // Render all book cards
        books.forEach(book => {
            const card = createBookCard(book);
            booksGrid.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading books:', error);
        loadingEl.textContent = 'Error loading books. Please try again later.';
    }
}

async function loadBooks() {
    // Try API first (for Vercel deployment), fall back to books.json (for local dev)
    try {
        const response = await fetch('/api/books');
        if (response.ok) {
            const data = await response.json();
            return data.books || [];
        }
    } catch (e) {
        // API not available, try static file
    }

    // Fallback to static books.json
    const response = await fetch('books.json');
    if (!response.ok) {
        throw new Error('Failed to load books');
    }
    const data = await response.json();
    return data.books || [];
}

function createBookCard(book) {
    const card = document.createElement('article');
    card.className = 'book-card';

    // Rank badge
    const rankBadge = document.createElement('span');
    rankBadge.className = 'rank-badge';
    rankBadge.textContent = book.rank;

    // Cover container
    const coverContainer = document.createElement('div');
    coverContainer.className = 'book-cover-container';

    // Create placeholder initially
    const placeholder = createPlaceholder(book);
    coverContainer.appendChild(placeholder);

    // Try to load cover image
    if (book.isbn) {
        loadCoverByISBN(book.isbn, coverContainer, placeholder);
    } else {
        loadCoverBySearch(book.title, book.author, coverContainer, placeholder);
    }

    // Book info section
    const info = document.createElement('div');
    info.className = 'book-info';

    // Book details wrapper for title and author
    const details = document.createElement('div');
    details.className = 'book-details';

    const title = document.createElement('h2');
    title.className = 'book-title';
    title.textContent = book.title;

    const author = document.createElement('p');
    author.className = 'book-author';
    author.textContent = book.author;

    details.appendChild(title);
    details.appendChild(author);

    // Rank badge now goes in info section
    info.appendChild(rankBadge);
    info.appendChild(details);

    card.appendChild(coverContainer);
    card.appendChild(info);

    return card;
}

function createPlaceholder(book) {
    const placeholder = document.createElement('div');
    placeholder.className = 'cover-placeholder';

    const title = document.createElement('span');
    title.className = 'placeholder-title';
    title.textContent = book.title;

    const author = document.createElement('span');
    author.className = 'placeholder-author';
    author.textContent = book.author;

    placeholder.appendChild(title);
    placeholder.appendChild(author);

    return placeholder;
}

function loadCoverByISBN(isbn, container, placeholder) {
    const img = document.createElement('img');
    img.className = 'book-cover loading';
    img.alt = 'Book cover';

    // Clean ISBN (remove hyphens)
    const cleanISBN = isbn.replace(/-/g, '');
    img.src = `${OPEN_LIBRARY_COVER_URL}${cleanISBN}-M.jpg`;

    img.onload = function() {
        // Open Library returns a 1x1 pixel for missing covers
        if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
            // Cover not found, keep placeholder
            return;
        }
        img.classList.remove('loading');
        placeholder.remove();
        container.appendChild(img);
    };

    img.onerror = function() {
        // Keep placeholder on error
        console.log(`Cover not found for ISBN: ${isbn}`);
    };
}

async function loadCoverBySearch(title, author, container, placeholder) {
    try {
        const query = encodeURIComponent(`${title} ${author}`);
        const response = await fetch(`${OPEN_LIBRARY_SEARCH_URL}?q=${query}&limit=1`);

        if (!response.ok) return;

        const data = await response.json();

        if (data.docs && data.docs.length > 0) {
            const book = data.docs[0];

            // Try cover_i (cover ID)
            if (book.cover_i) {
                const img = document.createElement('img');
                img.className = 'book-cover loading';
                img.alt = 'Book cover';
                img.src = `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;

                img.onload = function() {
                    if (img.naturalWidth <= 1 || img.naturalHeight <= 1) return;
                    img.classList.remove('loading');
                    placeholder.remove();
                    container.appendChild(img);
                };
            }
            // Try ISBN from search results
            else if (book.isbn && book.isbn.length > 0) {
                loadCoverByISBN(book.isbn[0], container, placeholder);
            }
        }
    } catch (error) {
        console.log(`Could not search for cover: ${title}`);
    }
}

// Modal functionality
function initModal() {
    const modal = document.getElementById('recommend-modal');
    const openBtn = document.getElementById('recommend-btn');
    const closeBtn = document.getElementById('modal-close');
    const form = document.getElementById('recommend-form');

    // Open modal
    openBtn.addEventListener('click', () => {
        modal.hidden = false;
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.hidden = true;
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.hidden = true;
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) {
            modal.hidden = true;
        }
    });

    // Handle form submission via Formspree
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = document.getElementById('first-name').value;
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;

        // Show loading state
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                alert(`Thank you, ${firstName}! Your recommendation has been submitted.`);
                form.reset();
                modal.hidden = true;
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            alert('Sorry, there was an error submitting your recommendation. Please try again.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}
