const API_URL = 'http://localhost:3000';

// Загрузка всех книг
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

// Загрузка всех посетителей
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

            // Текущие книги посетителя
            const currentBooksList = document.createElement('ul');
            if (visitor.currentBooks.length > 0) {
                const currentBooksItem = document.createElement('li');
                currentBooksItem.textContent = `Currently borrowed: ${visitor.currentBooks.join(', ')}`; // Объединяем книги в строку через запятую
                currentBooksList.appendChild(currentBooksItem);
            }

            // Список прошлых книг посетителя
            const pastBooksList = document.createElement('ul');
            if (visitor.pastBooks.length > 0) {
                const pastBooksItem = document.createElement('li');
                pastBooksItem.textContent = `Past books: ${visitor.pastBooks.join(', ')}`; // Объединяем книги в строку через запятую
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

// Загрузка всех работников
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

            // Рабочие дни сотрудника
            const workDaysList = document.createElement('ul');
            if (employee.days.length > 0) {
                const workDaysItem = document.createElement('li');
                workDaysItem.textContent = `Working days: ${employee.days.join(', ')}`; // Объединяем рабочие дни в строку через запятую
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

// Взять книгу
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
        const response = await fetch(`${API_URL}/takeBook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitorFirstName, visitorLastName, bookTitle, day })
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(errorMessage);
        }

        const result = await response.json();
        alert(`Book successfully taken!\nLibrarian: ${result.librarian.firstName} ${result.librarian.lastName}`);

        document.getElementById('takeBookForm').reset();
        loadBooks(); // Обновляем список книг
    } catch (error) {
        errorField.textContent = `Error taking book: ${error.message}`;
        console.error('Error:', error);
    }
}

// Вернуть книгу
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
        const response = await fetch(`${API_URL}/returnBook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitorName, bookTitle: returnBookTitle, day: returnDay })
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(errorMessage);
        }

        const result = await response.json();

        alert(`Book successfully returned!\nLibrarian: ${result.librarian.firstName} ${result.librarian.lastName}`);
        document.getElementById('returnBookForm').reset();
        loadBooks(); // Обновляем список книг
    } catch (error) {
        errorField.textContent = `Error returning book: ${error.message}`;
        console.error('Error:', error);
    }
}

// Инициализация
document.getElementById('takeBookForm').addEventListener('submit', takeBook);
document.getElementById('returnBookForm').addEventListener('submit', returnBook);

loadBooks();
loadVisitors();
loadEmployees();