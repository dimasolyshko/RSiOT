const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');


function lzssCompress(data) {
  const windowSize = 4096;
  const bufferSize = 18;
  const result = [];
  let cursor = 0;

  while (cursor < data.length) {
    let longestMatch = { offset: 0, length: 0 };
    const startWindow = Math.max(0, cursor - windowSize);
    for (let i = startWindow; i < cursor; i++) {
      let matchLength = 0;
      while (
        matchLength < bufferSize &&
        data[i + matchLength] === data[cursor + matchLength]
      ) {
        matchLength++;
      }

      if (matchLength > longestMatch.length) {
        longestMatch = { offset: cursor - i, length: matchLength };
      }
    }

    if (longestMatch.length >= 2) {
      result.push({ offset: longestMatch.offset, length: longestMatch.length });
      cursor += longestMatch.length;
    } else {
      result.push({ literal: data[cursor] });
      cursor++;
    }
  }

  return result;
}

function lzssDecompress(compressedData) {
  const result = [];

  compressedData.forEach((entry) => {
    if (entry.literal !== undefined) {
      result.push(entry.literal);
    } else {
      const start = result.length - entry.offset;
      for (let i = 0; i < entry.length; i++) {
        result.push(result[start + i]);
      }
    }
  });

  return result.join("");
}

function offsetCipherEncrypt(data, keyWord) {
  const keyShifts = keyWord.split("").map((char) => char.charCodeAt(0));
  const keyLength = keyShifts.length;

  const encrypted = Buffer.from(data, 'utf-8').map((byte, index) => {
    const shift = keyShifts[index % keyLength] % 256;
    return (byte + shift) % 256;
  });

  return encrypted.toString('base64');
}

function offsetCipherDecrypt(data, keyWord) {
  const keyShifts = keyWord.split("").map((char) => char.charCodeAt(0));
  const keyLength = keyShifts.length;

  const encryptedData = Buffer.from(data, 'base64');
  const decrypted = encryptedData.map((byte, index) => {
    const shift = keyShifts[index % keyLength] % 256;
    return (byte - shift + 256) % 256;
  });

  return decrypted.toString('utf-8');
}

const readData = (filename, key) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err) reject(err);
      else {
        try {
          const decryptedData = offsetCipherDecrypt(data, key);
          const decompressedData = lzssDecompress(JSON.parse(decryptedData));
          resolve(decompressedData);
        } catch (err) {
          reject('Error processing file data: ' + err.message);
        }
      }
    });
  });
};

const writeData = (filename, data, key) => {
  return new Promise((resolve, reject) => {
    try {
      const compressedData = lzssCompress(data);
      const encryptedData = offsetCipherEncrypt(JSON.stringify(compressedData), key);
      fs.writeFile(filename, encryptedData, 'utf8', (err) => {
        if (err) reject(err);
        else resolve();
      });
    } catch (err) {
      reject('Error compressing or encrypting data: ' + err.message);
    }
  });
};

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const encryptionKey = "лаба";

app.get('/books', async (req, res) => {
  try {
    const data = await readData('books_encrypted.txt', encryptionKey);
    const books = data.split('\n').filter(Boolean).map(line => {
      const [id, title, author, pages, status] = line.split('|');
      return { id, title, author, pages: parseInt(pages), status };
    });
    res.json(books);
  } catch (err) {
    res.status(500).send('Error reading books data: ' + err.message);
  }
});

app.get('/employees', async (req, res) => {
  try {
    const data = await readData('employees_encrypted.txt', encryptionKey);
    const employees = data.split('\n').filter(Boolean).map(line => {
      const [firstName, lastName, experience, section, days] = line.split('|');
      return {
        firstName,
        lastName,
        experience: parseInt(experience),
        section,
        days: days.split(',').filter(Boolean)
      };
    });
    res.json(employees);
  } catch (err) {
    res.status(500).send('Error reading employees data: ' + err.message);
  }
});

app.get('/visitors', async (req, res) => {
  try {
    const booksData = await readData('books_encrypted.txt', encryptionKey);
    const visitorsData = await readData('visitors_encrypted.txt', encryptionKey);

    const booksArray = booksData.split('\n').filter(Boolean).map(line => {
      const [id, title] = line.split('|');
      return { id, title };
    });

    const visitors = visitorsData.split('\n').filter(Boolean).map(line => {
      const [firstName, lastName, registrationDate, currentBooks, pastBooks] = line.split('|');
      return {
        firstName,
        lastName,
        registrationDate,
        currentBooks: currentBooks ? currentBooks.split(',').map(bookId => {
          const book = booksArray.find(b => b.id === bookId);
          return book ? book.title : 'Unknown Book';
        }) : [],
        pastBooks: pastBooks ? pastBooks.split(',').map(bookId => {
          const book = booksArray.find(b => b.id === bookId);
          return book ? book.title : 'Unknown Book';
        }) : []
      };
    });

    res.json(visitors);
  } catch (err) {
    res.status(500).send('Error reading visitors data: ' + err.message);
  }
});

app.post('/takeBook', async (req, res) => {
    const { visitorFirstName, visitorLastName, bookId, day } = req.body;
  
    try {
      const booksData = await readData('books_encrypted.txt', encryptionKey);
      const visitorsData = await readData('visitors_encrypted.txt', encryptionKey);
      const employeesData = await readData('employees_encrypted.txt', encryptionKey);
  
      const booksArray = booksData.split('\n').filter(Boolean);
      const visitorsArray = visitorsData.split('\n').filter(Boolean);
      const employees = employeesData.split('\n').filter(Boolean).map(line => line.split('|'));
  
      const bookIndex = booksArray.findIndex(line => {
        const [id] = line.split('|');
        return id === bookId;
      });
      const visitorIndex = visitorsArray.findIndex(line => {
        const [firstName, lastName] = line.split('|');
        return firstName === visitorFirstName && lastName === visitorLastName;
      });
  
      if (bookIndex === -1) return res.status(404).json({ error: 'Book not found' });
      if (visitorIndex === -1) return res.status(404).json({ error: 'Visitor not found' });
  
      const employee = employees.find(([, , , , empDays]) => empDays.split(',').includes(day));
      if (!employee) return res.status(400).json({ error: 'No librarian available on this day' });
  
      const book = booksArray[bookIndex].split('|');
      const visitor = visitorsArray[visitorIndex].split('|');
  
      if (book[4] === 'unavailable') return res.status(400).json({ error: 'Book is currently unavailable' });
  
      book[4] = 'unavailable';
      visitor[3] = visitor[3] ? `${visitor[3]},${book[0]}` : book[0];
  
      booksArray[bookIndex] = book.join('|');
      visitorsArray[visitorIndex] = visitor.join('|');
  
      await writeData('books_encrypted.txt', booksArray.join('\n'), encryptionKey);
      await writeData('visitors_encrypted.txt', visitorsArray.join('\n'), encryptionKey);
  
      res.status(200).json({ message: 'Book taken successfully', librarian: { firstName: employee[0], lastName: employee[1] } });
    } catch (err) {
      res.status(500).json({ error: 'Error processing book taking request: ' + err.message });
    }
  });
  
app.post('/returnBook', async (req, res) => {
    const { visitorFirstName, visitorLastName, bookId, day } = req.body;
  
    try {
      const booksData = await readData('books_encrypted.txt', encryptionKey);
      const visitorsData = await readData('visitors_encrypted.txt', encryptionKey);
  
      const booksArray = booksData.split('\n').filter(Boolean);
      const visitorsArray = visitorsData.split('\n').filter(Boolean);
  
      const bookIndex = booksArray.findIndex(line => {
        const [id] = line.split('|');
        return id === bookId;
      });
      const visitorIndex = visitorsArray.findIndex(line => {
        const [firstName, lastName] = line.split('|');
        return firstName === visitorFirstName && lastName === visitorLastName;
      });
  
      if (bookIndex === -1) return res.status(404).send('Book not found');
      if (visitorIndex === -1) return res.status(404).send('Visitor not found');
  
      const book = booksArray[bookIndex].split('|');
      const visitor = visitorsArray[visitorIndex].split('|');
  
      if (book[4] === 'available') return res.status(400).send('This book was not taken');
  
      book[4] = 'available';
      const currentBooks = visitor[3].split(',');
      const newCurrentBooks = currentBooks.filter(id => id !== book[0]);
      visitor[3] = newCurrentBooks.join(',');
  
      const pastBooks = visitor[4].split(',');
      if (!pastBooks.includes(book[0])) {
        pastBooks.push(book[0]);
      }
      visitor[4] = pastBooks.join(',');
  
      booksArray[bookIndex] = book.join('|');
      visitorsArray[visitorIndex] = visitor.join('|');
  
      await writeData('books_encrypted.txt', booksArray.join('\n'), encryptionKey);
      await writeData('visitors_encrypted.txt', visitorsArray.join('\n'), encryptionKey);
  
      const employeesData = await readData('employees_encrypted.txt', encryptionKey);
      const employees = employeesData.split('\n').filter(Boolean).map(line => line.split('|'));
      const employee = employees.find(([, , , , empDays]) => empDays.split(',').includes(day));
  
      if (!employee) return res.status(400).send('No librarian available on this day');

      const librarian = {
        firstName: employee[0],
        lastName: employee[1]
      };
  
      res.status(200).json({ message: 'Book returned successfully', librarian });
    } catch (err) {
      res.status(500).send('Error processing book return request: ' + err.message);
    }
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
