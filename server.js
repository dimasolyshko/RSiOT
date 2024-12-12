const express = require('express');
const fs = require('fs');

const app = express();
const PORT = 3000;

let allBooks = []; 
let allEmployees = []; 
let allVisitors = []; 

app.use(express.json());

app.get('/books', (req, res) => {
    allBooks = [];

    fs.readFile('books.txt', 'utf8', (err, data) => {
        if (err) {
            res.status(404).send('Error reading books data');
        } else {
            const booksData = data.split('\n').map(line => {
                const [title, author, pages] = line.split('|');
                const book = { title, author, pages: parseInt(pages) };
                allBooks.push(book);
                return book;
            });

            res.json({booksData});
        }
    });
});

app.get('/employees', (req, res) => {
    allEmployes = [];
    fs.readFile('employees.txt', 'utf8', (err, data) => {
        if (err) {
            res.status(404).send('Error reading employees data');
        } else {
            const employeesData = data.split('\n').map(line => {
                const [firstName, lastName, experience, section] = line.split('|');
                const employee = { firstName, lastName, experience: parseInt(experience), section };
                allEmployees.push(employee);
                return employee;
            });
            res.json(employeesData);
        }
    });
});

app.get('/visitors', (req, res) => {
    let allVisitors = []

    fs.readFile('visitors.txt', 'utf8', (err, data) => {
        if (err) {
            res.status(404).send('Error reading visitors data');
        } else {
            const visitorsData = data.split('\n').map(line => {
                const [firstName, lastName, registrationDate, currentBooks, pastBooks] = line.split('|');
                const visitor = {
                    firstName,
                    lastName,
                    registrationDate,
                    currentBooks: currentBooks.split(','),
                    pastBooks: pastBooks.split(',')
                };
                allVisitors.push(visitor);
                return visitor;
            });
            res.json(visitorsData);
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});