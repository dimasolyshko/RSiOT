const API_URL = 'http://localhost:3000';

async function loadBooks() {
    const booksList = document.getElementById('booksList');
    booksList.innerHTML = 'Loading...';

    try {
        const response = await fetch(`${API_URL}/books`);
        if (!response.ok) {
            throw new Error('Failed to load books');
        }
        const booksData = await response.json();
        booksList.innerHTML = '';
        booksData.forEach(book => {
            const li = document.createElement('li');
            li.textContent = `${book.title} by ${book.author} (${book.pages} pages) - Status: ${book.status}`;
            booksList.appendChild(li);
        });
    } catch (error) {
        booksList.innerHTML = 'Error loading books';
        console.error('Error:', error);
    }
}

async function loadVisitors() {
    const visitorsList = document.getElementById('visitorsList');
    visitorsList.innerHTML = 'Loading...';

    try {
        const response = await fetch(`${API_URL}/visitors`);
        if (!response.ok) {
            throw new Error('Failed to load visitors');
        }
        const visitorsData = await response.json();
        visitorsList.innerHTML = '';
        visitorsData.forEach(visitor => {
            const li = document.createElement('li');
            li.textContent = `${visitor.firstName} ${visitor.lastName} (Registered: ${visitor.registrationDate})`;

            const currentBooksList = document.createElement('ul');
            if (visitor.currentBooks.length > 0) {
                const currentBooksItem = document.createElement('li');
                currentBooksItem.textContent = `Currently borrowed: ${visitor.currentBooks.join(', ')}`; // Выводим названия книг
                currentBooksList.appendChild(currentBooksItem);
            }

            const pastBooksList = document.createElement('ul');
            if (visitor.pastBooks.length > 0) {
                const pastBooksItem = document.createElement('li');
                pastBooksItem.textContent = `Past books: ${visitor.pastBooks.join(', ')}`; // Выводим названия книг
                pastBooksList.appendChild(pastBooksItem);
            }

            li.appendChild(currentBooksList);
            li.appendChild(pastBooksList);
            visitorsList.appendChild(li);
        });
    } catch (error) {
        visitorsList.innerHTML = 'Error loading visitors';
        console.error('Error:', error);
    }
}

async function loadEmployees() {
    const employeesList = document.getElementById('employeesList');
    employeesList.innerHTML = 'Loading...';

    try {
        const response = await fetch(`${API_URL}/employees`);
        if (!response.ok) {
            throw new Error('Failed to load employees');
        }
        const employeesData = await response.json();
        employeesList.innerHTML = '';
        employeesData.forEach(employee => {
            const li = document.createElement('li');
            li.textContent = `${employee.firstName} ${employee.lastName} (Experience: ${employee.experience} years, Section: ${employee.section})`;

            const workDaysList = document.createElement('ul');
            if (employee.days.length > 0) {
                const workDaysItem = document.createElement('li');
                workDaysItem.textContent = `Working days: ${employee.days.join(', ')}`; 
                workDaysList.appendChild(workDaysItem);
            }

            li.appendChild(workDaysList);
            employeesList.appendChild(li);
        });
    } catch (error) {
        employeesList.innerHTML = 'Error loading employees';
        console.error('Error:', error);
    }
}

async function takeBook(event) {
    event.preventDefault();

    const visitorFirstName = document.getElementById('visitorFirstName').value.trim();
    const visitorLastName = document.getElementById('visitorLastName').value.trim();
    const bookTitle = document.getElementById('bookTitle').value.trim();
    const day = document.getElementById('day').value;

    const errorField = document.getElementById('takeBookError');
    errorField.textContent = '';

    if (!visitorFirstName || !visitorLastName || !bookTitle || !day) {
        errorField.textContent = 'All fields are required.';
        return;
    }

    try {
        // Получаем все книги
        const response = await fetch(`${API_URL}/books`);
        const booksData = await response.json();
        const book = booksData.find(b => b.title === bookTitle);

        if (!book) {
            errorField.textContent = 'Book not found';
            return;
        }

        // Отправляем запрос на взятие книги
        const responseTake = await fetch(`${API_URL}/takeBook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visitorFirstName,
                visitorLastName,
                bookId: book.id, // Используем ID книги
                day
            })
        });

        if (!responseTake.ok) {
            const errorMessage = await responseTake.text();
            throw new Error(errorMessage);
        }

        const result = await responseTake.json();
        alert(`Book successfully taken!\nLibrarian: ${result.librarian.firstName} ${result.librarian.lastName}`);

        document.getElementById('takeBookForm').reset();
        loadBooks(); 
    } catch (error) {
        errorField.textContent = `Error taking book: ${error.message}`;
        console.error('Error:', error);
    }
}

async function returnBook(event) {
    event.preventDefault();

    const visitorName = document.getElementById('visitorName').value.trim();
    const returnBookTitle = document.getElementById('returnBookTitle').value.trim();
    const returnDay = document.getElementById('returnDay').value;

    const errorField = document.getElementById('returnBookError');
    errorField.textContent = '';

    if (!visitorName || !returnBookTitle || !returnDay) {
        errorField.textContent = 'All fields are required.';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/books`);
        const booksData = await response.json();
        const book = booksData.find(b => b.title === returnBookTitle);

        if (!book) {
            errorField.textContent = 'Book not found';
            return;
        }

        const responseReturn = await fetch(`${API_URL}/returnBook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visitorFirstName: visitorName.split(' ')[0],
                visitorLastName: visitorName.split(' ')[1],
                bookId: book.id,
                day: returnDay
            })
        });

        if (!responseReturn.ok) {
            const errorMessage = await responseReturn.text();
            throw new Error(errorMessage);
        }

        const result = await responseReturn.json();
        alert(`Book successfully returned!\nLibrarian: ${result.librarian.firstName} ${result.librarian.lastName}`);

        document.getElementById('returnBookForm').reset();
        loadBooks(); 
    } catch (error) {
        errorField.textContent = `Error returning book: ${error.message}`;
        console.error('Error:', error);
    }
}



document.getElementById('takeBookForm').addEventListener('submit', takeBook);
document.getElementById('returnBookForm').addEventListener('submit', returnBook);

loadBooks();
loadVisitors();
loadEmployees();