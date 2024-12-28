const fs = require('fs');
const path = require('path');

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

// Расшифровка с использованием офсетного шифра
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

// Функция для расшифровки файла
const decryptFile = async (filename, keyWord) => {
  try {
    // Чтение зашифрованного файла как бинарного
    const filePath = path.join(__dirname, filename);
    const encryptedDataBuffer = await fs.promises.readFile(filePath);

    // Преобразуем бинарные данные в строку
    const encryptedData = encryptedDataBuffer.toString('utf-8');

    // Расшифровываем данные
    const decryptedData = offsetCipherDecrypt(encryptedData, keyWord);

    // Преобразуем расшифрованные данные обратно в объект сжатых данных
    const compressedData = JSON.parse(decryptedData);

    // Разжимаем данные
    const decompressedData = lzssDecompress(compressedData);

    // Формируем новый путь для сохранения расшифрованного файла
    const decryptedFilePath = path.join(
      __dirname,
      `${path.basename(filename, path.extname(filename))}_decrypted${path.extname(filename)}`
    );

    // Сохраняем расшифрованные данные в новый файл
    await fs.promises.writeFile(decryptedFilePath, decompressedData, 'utf-8');
    
    console.log(`Файл "${filename}" успешно расшифрован в "${decryptedFilePath}"`);
  } catch (error) {
    console.error(`Ошибка при расшифровке файла ${filename}:`, error.message);
  }
};

// Функция для расшифровки нескольких файлов
const decryptFiles = async (files, keyWord) => {
  for (const file of files) {
    await decryptFile(file, keyWord);
  }
};

// Пример использования:
const filesToDecrypt = ['books_encrypted.txt', 'employees_encrypted.txt', 'visitors_encrypted.txt'];  // Список зашифрованных файлов
const decryptionKey = 'лаба';  // Ваш ключ для расшифровки

decryptFiles(filesToDecrypt, decryptionKey);
