const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;

let allBooks = [];
let allEmployees = [];
let allVisitors = [];

app.use(cors());
app.use(express.json());

const readData = (filename) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
};

const writeData = (filename, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data, 'utf8', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

app.get('/books', async (req, res) => {
    try {
        const data = await readData('books.txt');
        const booksData = data.split('\n').map(line => {
            const [title, author, pages, status] = line.split('|');
            return { title, author, pages: parseInt(pages), status };
        });
        res.json(booksData);
    } catch (err) {
        res.status(404).send('Error reading books data');
    }
});

app.get('/employees', async (req, res) => {
    try {
        const data = await readData('employees.txt');
        const employeesData = data.split('\n').map(line => {
            const [firstName, lastName, experience, section, days] = line.split('|');
            return {
                firstName,
                lastName,
                experience: parseInt(experience),
                section,
                days: days.split(',').filter(Boolean) // Фильтруем пустые значения дней
            };
        });
        res.json(employeesData);
    } catch (err) {
        res.status(404).send('Error reading employees data');
    }
});


app.get('/visitors', async (req, res) => {
    try {
        const data = await readData('visitors.txt');
        const visitorsData = data.split('\n').map(line => {
            const [firstName, lastName, registrationDate, currentBooks, pastBooks] = line.split('|');
            return {
                firstName,
                lastName,
                registrationDate,
                currentBooks: currentBooks.split(',').filter(Boolean), // Фильтруем пустые значения
                pastBooks: pastBooks.split(',').filter(Boolean) // Фильтруем пустые значения
            };
        });
        res.json(visitorsData);
    } catch (err) {
        res.status(404).send('Error reading visitors data');
    }
});


app.post('/takeBook', async (req, res) => {
    const { visitorFirstName, visitorLastName, bookTitle, day } = req.body;

    try {
        const employeesData = await readData('employees.txt');
        const booksData = await readData('books.txt');
        const visitorsData = await readData('visitors.txt');

        const employees = employeesData.split('\n').map(line => line.split('|'));
        const booksArray = booksData.split('\n');
        const visitorsArray = visitorsData.split('\n');

        // Найти индекс книги
        const bookIndex = booksArray.findIndex(line => line.startsWith(bookTitle));
        if (bookIndex === -1) {
            return res.status(404).send('Book not found');
        }

        // Найти посетителя по имени и фамилии
        const visitorIndex = visitorsArray.findIndex(line => {
            const [firstName, lastName] = line.split('|');
            return firstName === visitorFirstName && lastName === visitorLastName;
        });

        if (visitorIndex === -1) {
            return res.status(404).send('Visitor not found');
        }

        // Проверка наличия библиотекаря на указанный день
        const employee = employees.find(([, , , , empDays]) => empDays.split(',').includes(day));
        if (!employee) {
            return res.status(400).send('No librarian available on this day');
        }

        // Работа с данными книги и посетителя
        const book = booksArray[bookIndex].split('|');
        const visitor = visitorsArray[visitorIndex].split('|');

        if (book[3] === 'unavailable') {
            return res.status(400).send('Book is currently unavailable');
        }

        // Обновить статус книги и закрепить за посетителем
        book[3] = 'unavailable';
        visitor[3] = visitor[3] ? `${visitor[3]},${book[0]}` : book[0];

        // Обновить данные в массиве
        booksArray[bookIndex] = book.join('|');
        visitorsArray[visitorIndex] = visitor.join('|');

        // Сохранить изменения в файлах
        await writeData('books.txt', booksArray.join('\n'));
        await writeData('visitors.txt', visitorsArray.join('\n'));

        // Информация о библиотекаре
        const librarian = {
            firstName: employee[0],
            lastName: employee[1],
            section: employee[3],
            days: employee[4]
        };

        res.json({
            message: 'Book successfully taken',
            librarian: librarian
        });
    } catch (err) {
        res.status(500).send('An error occurred while taking the book');
    }
});

app.post('/returnBook', async (req, res) => {
    const { visitorName, bookTitle, day } = req.body;  // Добавлен параметр day

    try {
        // Считываем данные из файлов
        const booksData = await readData('books.txt');
        const visitorsData = await readData('visitors.txt');
        const employeesData = await readData('employees.txt');  // Считываем данные о сотрудниках

        // Разделяем данные на массивы строк
        const booksArray = booksData.split('\n');
        const visitorsArray = visitorsData.split('\n');
        const employeesArray = employeesData.split('\n');

        // Находим индекс книги и посетителя по названию и имени
        const bookIndex = booksArray.findIndex(line => line.startsWith(bookTitle));
        const visitorIndex = visitorsArray.findIndex(line => {
            const [firstName, lastName] = line.split('|');
            return `${firstName} ${lastName}` === visitorName;
        });

        if (bookIndex === -1 || visitorIndex === -1) {
            return res.status(404).send('Book or visitor not found');
        }

        // Разбираем данные книги и посетителя
        let book = booksArray[bookIndex].split('|');
        let visitor = visitorsArray[visitorIndex].split('|');

        if (book[3] === 'available') {
            return res.status(400).send('Book is already available');
        }

        // Изменяем статус книги на "available"
        book[3] = 'available';

        // Добавляем книгу в историю прошлых книг посетителя
        const pastBooks = visitor[4].split(',').filter(b => b !== '').join(',');  // Убираем пустые значения
        visitor[4] = pastBooks ? `${pastBooks},${book[0]}` : book[0];

        // Убираем книгу из текущих книг посетителя
        visitor[3] = visitor[3].split(',').filter(b => b !== book[0]).join(',');

        // Проверка, какой библиотекарь работает в указанный день
        const employee = employeesArray.find((line) => {
            const [firstName, lastName, experience, section, days] = line.split('|');
            return days.split(',').includes(day);  // Проверяем, работает ли сотрудник в этот день
        });

        if (!employee) {
            return res.status(400).send('No librarian available on this day');
        }

        // Получаем данные о библиотекаре
        const [firstName, lastName, , section, days] = employee.split('|');
        const librarian = { firstName, lastName, section, days };

        // Обновляем строки в массивах
        booksArray[bookIndex] = book.join('|');
        visitorsArray[visitorIndex] = visitor.join('|');

        // Сохраняем изменения в файлы
        await writeData('books.txt', booksArray.join('\n'));
        await writeData('visitors.txt', visitorsArray.join('\n'));

        // Отправляем ответ с информацией о библиотекаре
        res.json({
            message: 'Book successfully returned',
            librarian: librarian
        });

    } catch (err) {
        res.status(500).send('An error occurred while returning the book');
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
