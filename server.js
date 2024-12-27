const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Чтение данных из файлов
const readData = (filename) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
};

// Запись данных в файлы
const writeData = (filename, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data, 'utf8', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// Получение всех книг
app.get('/books', async (req, res) => {
    try {
        const data = await readData('books.txt');
        const books = data.split('\n').filter(Boolean).map(line => {
            const [id, title, author, pages, status] = line.split('|');
            return { id, title, author, pages: parseInt(pages), status };
        });
        res.json(books);
    } catch (err) {
        res.status(500).send('Error reading books data');
    }
});

// Получение всех сотрудников
app.get('/employees', async (req, res) => {
    try {
        const data = await readData('employees.txt');
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
        res.status(500).send('Error reading employees data');
    }
});

// Получение всех посетителей с названиями книг
app.get('/visitors', async (req, res) => {
    try {
        const booksData = await readData('books.txt');
        const visitorsData = await readData('visitors.txt');
        
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
        res.status(500).send('Error reading visitors data');
    }
});


// Взять книгу
app.post('/takeBook', async (req, res) => {
    const { visitorFirstName, visitorLastName, bookId, day } = req.body;

    try {
        const booksData = await readData('books.txt');
        const visitorsData = await readData('visitors.txt');
        const employeesData = await readData('employees.txt');

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

        if (bookIndex === -1) return res.status(404).send('Book not found');
        if (visitorIndex === -1) return res.status(404).send('Visitor not found');

        const employee = employees.find(([, , , , empDays]) => empDays.split(',').includes(day));
        if (!employee) return res.status(400).send('No librarian available on this day');

        const book = booksArray[bookIndex].split('|');
        const visitor = visitorsArray[visitorIndex].split('|');

        if (book[4] === 'unavailable') return res.status(400).send('Book is currently unavailable');

        book[4] = 'unavailable';
        visitor[3] = visitor[3] ? `${visitor[3]},${book[0]}` : book[0];

        booksArray[bookIndex] = book.join('|');
        visitorsArray[visitorIndex] = visitor.join('|');

        await writeData('books.txt', booksArray.join('\n'));
        await writeData('visitors.txt', visitorsArray.join('\n'));

        const librarian = {
            firstName: employee[0],
            lastName: employee[1],
            section: employee[3],
            days: employee[4]
        };

        res.json({ message: 'Book successfully taken', librarian });
    } catch (err) {
        res.status(500).send('An error occurred while taking the book');
    }
});

// Вернуть книгу
app.post('/returnBook', async (req, res) => {
    const { visitorFirstName, visitorLastName, bookId, day } = req.body;

    try {
        const booksData = await readData('books.txt');
        const visitorsData = await readData('visitors.txt');
        const employeesData = await readData('employees.txt');

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

        if (bookIndex === -1) return res.status(404).send('Book not found');
        if (visitorIndex === -1) return res.status(404).send('Visitor not found');

        const employee = employees.find(([, , , , empDays]) => empDays.split(',').includes(day));
        if (!employee) return res.status(400).send('No librarian available on this day');

        const book = booksArray[bookIndex].split('|');
        const visitor = visitorsArray[visitorIndex].split('|');

        if (book[4] === 'available') return res.status(400).send('Book is already available');

        book[4] = 'available';
        visitor[4] = visitor[4] ? `${visitor[4]},${book[0]}` : book[0];
        visitor[3] = visitor[3].split(',').filter(b => b !== book[0]).join(',');

        booksArray[bookIndex] = book.join('|');
        visitorsArray[visitorIndex] = visitor.join('|');

        await writeData('books.txt', booksArray.join('\n'));
        await writeData('visitors.txt', visitorsArray.join('\n'));

        const librarian = {
            firstName: employee[0],
            lastName: employee[1],
            section: employee[3],
            days: employee[4]
        };

        res.json({ message: 'Book successfully returned', librarian });
    } catch (err) {
        res.status(500).send('An error occurred while returning the book');
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
