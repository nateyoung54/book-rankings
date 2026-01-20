import { kv } from '@vercel/kv';

// Initial books data - run this once to migrate from books.json
const initialBooks = [
  { id: "1", rank: 1, title: "The Seven Habits of Highly Effective People", author: "Stephen R. Covey", isbn: "9781982137274" },
  { id: "2", rank: 2, title: "How to Win Friends and Influence People", author: "Dale Carnegie", isbn: "9780671027032" },
  { id: "3", rank: 3, title: "Man's Search for Meaning", author: "Viktor E. Frankl", isbn: "9780807014295" },
  { id: "4", rank: 4, title: "Endurance: Shackleton's Incredible Voyage", author: "Alfred Lansing", isbn: "9780465062881" },
  { id: "5", rank: 5, title: "Essentialism: The Disciplined Pursuit of Less", author: "Greg McKeown", isbn: "9780804137386" },
  { id: "6", rank: 6, title: "Rich Dad, Poor Dad", author: "Robert T. Kiyosaki", isbn: "9781612680194" },
  { id: "7", rank: 7, title: "Influence: The Psychology of Persuasion", author: "Robert Cialdini", isbn: "9780062937650" },
  { id: "8", rank: 8, title: "Ego is the Enemy", author: "Ryan Holiday", isbn: "9781591847816" },
  { id: "9", rank: 9, title: "The Subtle Art of Not Giving a F*ck", author: "Mark Manson", isbn: "9780062457714" },
  { id: "10", rank: 10, title: "Outliers: The Story of Success", author: "Malcolm Gladwell", isbn: "9780316017930" },
  { id: "11", rank: 11, title: "Atomic Habits", author: "James Clear", isbn: "9780735211292" },
  { id: "12", rank: 12, title: "Make Your Bed", author: "William McRaven", isbn: "9781455570249" },
  { id: "13", rank: 13, title: "Drive: The Surprising Truth About What Motivates Us", author: "Daniel H. Pink", isbn: "9781594484803" },
  { id: "14", rank: 14, title: "Deep Work", author: "Cal Newport", isbn: "9781455586691" },
  { id: "15", rank: 15, title: "The Great Game of Business", author: "Jack Stack", isbn: "9780385348331" },
  { id: "16", rank: 16, title: "The Gap and The Gain", author: "Dan Sullivan", isbn: "9781401964368" },
  { id: "17", rank: 17, title: "The Psychology of Money", author: "Morgan Housel", isbn: "9780857197689" },
  { id: "18", rank: 18, title: "Goal Setting Boot Camp", author: "Kevin Shulman" },
  { id: "19", rank: 19, title: "Start With Why", author: "Simon Sinek", isbn: "9781591846444" },
  { id: "20", rank: 20, title: "The Lean Startup", author: "Eric Ries", isbn: "9780307887894" },
  { id: "21", rank: 21, title: "Rocket Fuel", author: "Gino Wickman", isbn: "9781941631157" },
  { id: "22", rank: 22, title: "Be Useful: Seven Tools for Life", author: "Arnold Schwarzenegger", isbn: "9780593655955" },
  { id: "23", rank: 23, title: "AI First: The Playbook for a Future-Proof Business and Brand", author: "Adam Brotman" },
  { id: "24", rank: 24, title: "The Coming Wave", author: "Mustafa Suleyman", isbn: "9780593593950" },
  { id: "25", rank: 25, title: "Who Not How", author: "Dan Sullivan", isbn: "9781401960582" },
  { id: "26", rank: 26, title: "2 Second Lean", author: "Paul Akers", isbn: "9780989863100" },
  { id: "27", rank: 27, title: "The Millionaire Next Door", author: "Thomas Stanley", isbn: "9781589795471" },
  { id: "28", rank: 28, title: "So Good They Can't Ignore You", author: "Cal Newport", isbn: "9781455509126" },
  { id: "29", rank: 29, title: "The 5am Club", author: "Robin Sharma", isbn: "9781443456623" },
  { id: "30", rank: 30, title: "How the Mighty Fall", author: "Jim Collins", isbn: "9780977326419" },
  { id: "31", rank: 31, title: "Win the Day", author: "Mark Batterson", isbn: "9780593192764" },
  { id: "32", rank: 32, title: "To Sell is Human", author: "Daniel H. Pink", isbn: "9781594631900" },
  { id: "33", rank: 33, title: "Think and Grow Rich", author: "Napoleon Hill", isbn: "9781585424337" },
  { id: "34", rank: 34, title: "Sell or Be Sold", author: "Grant Cardone", isbn: "9781608322565" },
  { id: "35", rank: 35, title: "The Old Man and the Sea", author: "Ernest Hemingway", isbn: "9780684801223" },
  { id: "36", rank: 36, title: "The Power of Self-Discipline", author: "Peter Hollins", isbn: "9798580827568" }
];

export default async function handler(req, res) {
  // Check for admin password
  const password = req.headers['x-admin-password'] || req.query.password;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to initialize.' });
  }

  try {
    // Check if books already exist
    const existingBooks = await kv.get('books');

    if (existingBooks && existingBooks.length > 0) {
      return res.status(200).json({
        message: 'Books already initialized',
        count: existingBooks.length
      });
    }

    // Initialize with the books data
    await kv.set('books', initialBooks);

    return res.status(200).json({
      success: true,
      message: 'Books initialized successfully',
      count: initialBooks.length
    });
  } catch (error) {
    console.error('Error initializing books:', error);
    return res.status(500).json({ error: 'Failed to initialize books' });
  }
}
