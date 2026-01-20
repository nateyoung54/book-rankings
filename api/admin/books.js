import { kv } from '@vercel/kv';

// Simple auth check
function checkAuth(req) {
  const password = req.headers['x-admin-password'];
  return password === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check authentication
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let books = await kv.get('books') || [];

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
      books = books.map(book => {
        if (book.rank >= newRank) {
          return { ...book, rank: book.rank + 1 };
        }
        return book;
      });

      // Add the new book
      const newBook = {
        id: Date.now().toString(),
        title,
        author,
        rank: newRank
      };

      if (isbn && isbn.trim()) {
        newBook.isbn = isbn.trim();
      }

      books.push(newBook);
      books.sort((a, b) => a.rank - b.rank);

      await kv.set('books', books);
      return res.status(201).json({ success: true, book: newBook, books });
    }

    // PUT - Update an existing book
    if (req.method === 'PUT') {
      const { id, title, author, isbn, rank } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Book ID is required' });
      }

      const bookIndex = books.findIndex(b => b.id === id);
      if (bookIndex === -1) {
        return res.status(404).json({ error: 'Book not found' });
      }

      const oldRank = books[bookIndex].rank;
      const newRank = rank ? parseInt(rank) : oldRank;

      if (isNaN(newRank) || newRank < 1) {
        return res.status(400).json({ error: 'Rank must be a positive number' });
      }

      // Handle rank changes
      if (newRank !== oldRank) {
        if (newRank < oldRank) {
          // Moving up: shift books between newRank and oldRank down
          books = books.map(book => {
            if (book.id !== id && book.rank >= newRank && book.rank < oldRank) {
              return { ...book, rank: book.rank + 1 };
            }
            return book;
          });
        } else {
          // Moving down: shift books between oldRank and newRank up
          books = books.map(book => {
            if (book.id !== id && book.rank > oldRank && book.rank <= newRank) {
              return { ...book, rank: book.rank - 1 };
            }
            return book;
          });
        }
      }

      // Update the book
      books[bookIndex] = {
        ...books[bookIndex],
        title: title || books[bookIndex].title,
        author: author || books[bookIndex].author,
        rank: newRank
      };

      if (isbn !== undefined) {
        if (isbn && isbn.trim()) {
          books[bookIndex].isbn = isbn.trim();
        } else {
          delete books[bookIndex].isbn;
        }
      }

      books.sort((a, b) => a.rank - b.rank);

      await kv.set('books', books);
      return res.status(200).json({ success: true, book: books[bookIndex], books });
    }

    // DELETE - Remove a book
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Book ID is required' });
      }

      const bookIndex = books.findIndex(b => b.id === id);
      if (bookIndex === -1) {
        return res.status(404).json({ error: 'Book not found' });
      }

      const deletedRank = books[bookIndex].rank;

      // Remove the book
      books.splice(bookIndex, 1);

      // Shift ranks up for books below the deleted one
      books = books.map(book => {
        if (book.rank > deletedRank) {
          return { ...book, rank: book.rank - 1 };
        }
        return book;
      });

      await kv.set('books', books);
      return res.status(200).json({ success: true, books });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error managing books:', error);
    return res.status(500).json({ error: 'Failed to manage books' });
  }
}
