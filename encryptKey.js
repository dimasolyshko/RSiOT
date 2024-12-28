const fs = require('fs');
const path = require('path');

// Алгоритм сжатия LZSS
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

// Алгоритм разжатия LZSS
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

// Шифрование с использованием офсетного шифра
function offsetCipherEncrypt(data, keyWord) {
  const keyShifts = keyWord.split("").map((char) => char.charCodeAt(0));
  const keyLength = keyShifts.length;

  const encrypted = Buffer.from(data, 'utf-8').map((byte, index) => {
    const shift = keyShifts[index % keyLength] % 256;
    return (byte + shift) % 256;
  });

  return encrypted.toString('base64'); // Используем base64 для безопасного хранения
}

// Функция для шифрования файла
const encryptFile = async (filename, keyWord) => {
  try {
    // Чтение исходного файла
    const filePath = path.join(__dirname, filename);
    const plainData = await fs.promises.readFile(filePath, 'utf-8');

    // Сжимаем данные
    const compressedData = lzssCompress(plainData);
    
    // Шифруем сжимаемые данные
    const encryptedData = offsetCipherEncrypt(
      JSON.stringify(compressedData),
      keyWord
    );

    // Формируем новый путь для сохранения зашифрованного файла
    const encryptedFilePath = path.join(
      __dirname,
      `${path.basename(filename, path.extname(filename))}_encrypted${path.extname(filename)}`
    );

    // Сохраняем зашифрованные данные в новый файл
    await fs.promises.writeFile(encryptedFilePath, encryptedData, 'utf-8');
    
    console.log(`Файл "${filename}" успешно зашифрован в "${encryptedFilePath}"`);
  } catch (error) {
    console.error(`Ошибка при шифровании файла ${filename}:`, error.message);
  }
};

// Вызов функции для зашифровки файлов
const encryptFiles = async (files, keyWord) => {
  for (const file of files) {
    await encryptFile(file, keyWord);
  }    
};

// Пример использования:
const filesToEncrypt = ['books.txt', 'employees.txt', 'visitors.txt'];  // Список файлов для шифрования
const encryptionKey = 'лаба';  // Ваш ключ для шифрования

encryptFiles(filesToEncrypt, encryptionKey);
