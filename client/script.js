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

// Инициализация
document.getElementById('takeBookForm').addEventListener('submit', takeBook);

// Функция для возврата книги
async function returnBook(event) {
    event.preventDefault();

    const visitorName = document.getElementById('visitorName').value.trim();
    const bookTitle = document.getElementById('bookTitleReturn').value.trim();

    const errorField = document.getElementById('returnBookError');
    errorField.textContent = '';

    if (!visitorName || !bookTitle) {
        errorField.textContent = 'All fields are required.';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/returnBook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visitorName, bookTitle })
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(errorMessage);
        }

        alert('Book successfully returned!');
        document.getElementById('returnBookForm').reset();
        loadBooks(); // Обновляем список книг
    } catch (error) {
        errorField.textContent = `Error returning book: ${error.message}`;
        console.error('Error:', error);
    }
}

// Инициализация
document.getElementById('returnBookForm').addEventListener('submit', returnBook);

loadBooks();
