// GitHub API approach - updates books.json directly in the repo

const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = 'nateyoung54';
const REPO_NAME = 'book-rankings';
const FILE_PATH = 'books.json';

function checkAuth(req) {
  const password = req.headers['x-admin-password'];
  return password === process.env.ADMIN_PASSWORD;
}

async function getFileFromGitHub(token) {
  const response = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Book-Rankings-Admin'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch books.json from GitHub');
  }

  const data = await response.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return {
    sha: data.sha,
    books: JSON.parse(content).books || []
  };
}

async function updateFileOnGitHub(token, books, sha, message) {
  const content = JSON.stringify({ books }, null, 2);
  const encodedContent = Buffer.from(content).toString('base64');

  const response = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Book-Rankings-Admin'
      },
      body: JSON.stringify({
        message,
        content: encodedContent,
        sha
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update books.json');
  }

  return await response.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return res.status(500).json({ error: 'GitHub token not configured' });
  }

  try {
    const { sha, books } = await getFileFromGitHub(githubToken);

    // POST - Add a new book
    if (req.method === 'POST') {
      const { title, author, isbn, rank } = req.body;

      if (!title || !author || !rank) {
        return res.status(400).json({ error: 'Title, author, and rank are required' });
      }

      const newRank = parseInt(rank);
      if (isNaN(newRank) || newRank < 1) {
        return res.status(400).json({ error: 'Rank must be a positive number' });
      }

      // Shift ranks for existing books at or below the new rank
      const updatedBooks = books.map(book => {
        if (book.rank >= newRank) {
          return { ...book, rank: book.rank + 1 };
        }
        return book;
      });

      // Add the new book
      const newBook = { rank: newRank, title, author };
      if (isbn && isbn.trim()) {
        newBook.isbn = isbn.trim();
      }

      updatedBooks.push(newBook);
      updatedBooks.sort((a, b) => a.rank - b.rank);

      await updateFileOnGitHub(
        githubToken,
        updatedBooks,
        sha,
        `Add book: ${title}`
      );

      return res.status(201).json({
        success: true,
        message: 'Book added! Site will update in ~30 seconds.'
      });
    }

    // PUT - Update an existing book
    if (req.method === 'PUT') {
      const { oldTitle, title, author, isbn, rank } = req.body;

      if (!oldTitle) {
        return res.status(400).json({ error: 'oldTitle is required to identify the book' });
      }

      const bookIndex = books.findIndex(b => b.title === oldTitle);
      if (bookIndex === -1) {
        return res.status(404).json({ error: 'Book not found' });
      }

      const oldRank = books[bookIndex].rank;
      const newRank = rank ? parseInt(rank) : oldRank;

      let updatedBooks = [...books];

      // Handle rank changes
      if (newRank !== oldRank) {
        if (newRank < oldRank) {
          updatedBooks = updatedBooks.map(book => {
            if (book.title !== oldTitle && book.rank >= newRank && book.rank < oldRank) {
              return { ...book, rank: book.rank + 1 };
            }
            return book;
          });
        } else {
          updatedBooks = updatedBooks.map(book => {
            if (book.title !== oldTitle && book.rank > oldRank && book.rank <= newRank) {
              return { ...book, rank: book.rank - 1 };
            }
            return book;
          });
        }
      }

      // Update the book
      updatedBooks[bookIndex] = {
        rank: newRank,
        title: title || updatedBooks[bookIndex].title,
        author: author || updatedBooks[bookIndex].author
      };

      if (isbn !== undefined) {
        if (isbn && isbn.trim()) {
          updatedBooks[bookIndex].isbn = isbn.trim();
        }
      } else if (books[bookIndex].isbn) {
        updatedBooks[bookIndex].isbn = books[bookIndex].isbn;
      }

      updatedBooks.sort((a, b) => a.rank - b.rank);

      await updateFileOnGitHub(
        githubToken,
        updatedBooks,
        sha,
        `Update book: ${title || oldTitle}`
      );

      return res.status(200).json({
        success: true,
        message: 'Book updated! Site will update in ~30 seconds.'
      });
    }

    // DELETE - Remove a book
    if (req.method === 'DELETE') {
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const bookIndex = books.findIndex(b => b.title === title);
      if (bookIndex === -1) {
        return res.status(404).json({ error: 'Book not found' });
      }

      const deletedRank = books[bookIndex].rank;
      let updatedBooks = books.filter(b => b.title !== title);

      // Shift ranks up for books below the deleted one
      updatedBooks = updatedBooks.map(book => {
        if (book.rank > deletedRank) {
          return { ...book, rank: book.rank - 1 };
        }
        return book;
      });

      await updateFileOnGitHub(
        githubToken,
        updatedBooks,
        sha,
        `Remove book: ${title}`
      );

      return res.status(200).json({
        success: true,
        message: 'Book deleted! Site will update in ~30 seconds.'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update books' });
  }
}
