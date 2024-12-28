const fs = require('fs');

// Алгоритм сжатия LZSS
function lzssCompress(input) {
    let i = 0;
    let result = [];
    let buffer = '';

    while (i < input.length) {
        let length = 0;
        let offset = 0;

        for (let j = Math.max(0, buffer.length - 256); j < buffer.length; j++) {
            let k = 0;
            while (i + k < input.length && buffer[j + k] === input[i + k]) {
                k++;
            }
            if (k > length) {
                length = k;
                offset = buffer.length - j;
            }
        }

        if (length >= 1) {
            result.push({ offset: offset, length: length });
            i += length;
        } else {
            result.push({ char: input[i] });
            buffer += input[i];
            i++;
        }
    }

    return result;
}

// Алгоритм декомпрессии LZSS
function lzssDecompress(compressedData) {
    const result = [];
  
    compressedData.forEach((entry) => {
        if (entry.char !== undefined) {
            result.push(entry.char);
        } else {
            const start = result.length - entry.offset;
            for (let i = 0; i < entry.length; i++) {
                result.push(result[start + i]);
            }
        }
    });
  
    return result.join("");
}

// Функция для записи зашифрованного и сжатого ключа в файл
const writeEncryptedKeyToFile = (key, filename) => {
    const compressedKey = lzssCompress(key);
    const compressedKeyString = JSON.stringify(compressedKey);

    fs.writeFile(filename, compressedKeyString, 'utf8', (err) => {
        if (err) {
            console.error('Ошибка записи в файл:', err);
        } else {
            console.log('Зашифрованный и сжатый ключ успешно записан в файл:', filename);
        }
    });
};

// Функция для чтения и декомпрессии ключа из файла
const readAndDecompressKeyFromFile = (filename, outputFilename) => {
    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
            console.error('Ошибка чтения из файла:', err);
        } else {
            try {
                // Преобразуем данные обратно в массив и декомпрессируем
                const compressedKey = JSON.parse(data);
                const decompressedKey = lzssDecompress(compressedKey);

                // Записываем расшифрованный ключ в новый файл
                fs.writeFile(outputFilename, decompressedKey, 'utf8', (err) => {
                    if (err) {
                        console.error('Ошибка записи в файл:', err);
                    } else {
                        console.log('Расшифрованный ключ успешно записан в файл:', outputFilename);
                    }
                });
            } catch (err) {
                console.error('Ошибка при декомпрессии ключа:', err);
            }
        }
    });
};

// Пример использования:
const key = 'лаба';  // Ваш ключ, который нужно зашифровать
const encryptedFilename = 'encrypted_vigenere_key.txt';  // Имя файла для записи зашифрованного ключа
const decryptedFilename = 'decrypted_vigenere_key.txt';  // Имя файла для записи расшифрованного ключа

// Записываем зашифрованный ключ
writeEncryptedKeyToFile(key, encryptedFilename);

// Читаем зашифрованный ключ, декомпрессируем и записываем в новый файл
readAndDecompressKeyFromFile(encryptedFilename, decryptedFilename);
