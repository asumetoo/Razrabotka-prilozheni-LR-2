// ================================================================
// 1. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
//    Здесь хранятся все данные, необходимые для работы калькулятора.
// ================================================================

let currentNumber = '';          // Текущее вводимое число (в виде строки)
let result = 0;                 // Последний вычисленный результат (используется для некоторых операций)
let memory = 0;                 // Память для накапливаемых операций (M+ и M-)
let firstNumber = null;         // Первое число для бинарных операций (+, -, *, /)
let operation = null;           // Выбранная операция (plus, minus, mult, div)

// Получаем ссылку на элемент дисплея по его id
const resultDiv = document.getElementById('result');

// ================================================================
// 2. ВЫВОД ЧИСЛА ПО ШИРИНЕ ДИСПЛЕЯ
//    У ввода и результатов один лимит символов. Сокращается только
//    отображение: currentNumber сохраняется целиком для вычислений.
// ================================================================
const displayMeasure = document.createElement('canvas').getContext('2d');

function getDisplayLimit() {
    const style = getComputedStyle(resultDiv);
    const availableWidth = Math.max(0, resultDiv.clientWidth
        - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
    displayMeasure.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const characterWidth = Math.max(...Array.from('0123456789.-+e…',
        character => displayMeasure.measureText(character).width));
    // Запас в один пиксель защищает от обрезания крайнего символа.
    return Math.max(1, Math.floor((availableWidth - 1) / characterWidth));
}

function updateDisplay() {
    const fullText = currentNumber || '0';
    const limit = getDisplayLimit();
    resultDiv.textContent = fullText.length > limit
        ? fullText.slice(0, limit - 1) + '…'
        : fullText;
    // Полное число можно посмотреть, наведя курсор на дисплей.
    resultDiv.title = fullText;
    updateInputAvailability();
}

// Пересчитываем лимит при изменении окна, масштаба или загрузке шрифта.
const displayResizeObserver = new ResizeObserver(updateDisplay);
displayResizeObserver.observe(resultDiv);
document.fonts.ready.then(updateDisplay);

// Новый символ принимается, только если всё число помещается в дисплей.
// Проверка общая для цифр, точки и кнопки «000».
function getNextInput(text) {
    if (text === '.' && currentNumber.includes('.')) return null;
    const base = currentNumber === '0' && text !== '.' ? '' : currentNumber;
    let nextNumber = base + text;
    if (nextNumber.startsWith('.')) nextNumber = '0' + nextNumber;
    return nextNumber;
}

function updateInputAvailability() {
    const limit = getDisplayLimit();
    const buttons = [...document.querySelectorAll('[id^="btn_digit_"]'),
        document.getElementById('btn_op_triple_zero')];
    buttons.forEach(button => {
        const nextNumber = getNextInput(button.textContent.trim());
        button.disabled = nextNumber === null || nextNumber.length > limit;
    });
}

function appendInput(text) {
    const nextNumber = getNextInput(text);
    if (nextNumber === null || nextNumber.length > getDisplayLimit()) return;
    currentNumber = nextNumber;
    updateDisplay();
}

// ================================================================
// 3. ОБРАБОТЧИКИ ДЛЯ ЦИФР И ТОЧКИ
//    Находим все кнопки, у которых id начинается с "btn_digit_",
//    и вешаем на них событие клика.
// ================================================================
document.querySelectorAll('[id^="btn_digit_"]').forEach(btn => {
    btn.onclick = function() {
        appendInput(this.textContent);
    };
});

// ================================================================
// 4. КНОПКА BACKSPACE (⌫) – стирает последний символ
// ================================================================
document.getElementById('btn_backspace').onclick = function() {
    if (currentNumber && currentNumber.length > 0) {
        // Удаляем последний символ с помощью slice
        currentNumber = currentNumber.slice(0, -1);
        // Если после удаления строка пуста, показываем '0'
        if (currentNumber === '') currentNumber = '0';
        updateDisplay();
    }
};

// ================================================================
// 5. КНОПКА ОЧИСТКИ (C) – сбрасывает всё (число, память, операцию)
// ================================================================
document.getElementById('btn_op_clear').onclick = function() {
    currentNumber = '';        // Очищаем ввод
    result = 0;               // Обнуляем результат
    memory = 0;               // Очищаем память
    firstNumber = null;       // Сбрасываем первое число
    operation = null;         // Сбрасываем операцию
    updateDisplay();
};

// ================================================================
// 6. СМЕНА ЗНАКА (+/-) – умножает текущее число на -1
// ================================================================
document.getElementById('btn_op_sign').onclick = function() {
    if (currentNumber && currentNumber !== '0') {
        // Преобразуем в число, умножаем на -1, преобразуем обратно в строку
        currentNumber = (parseFloat(currentNumber) * -1).toString();
        updateDisplay();
    }
};

// ================================================================
// 7. ПРОЦЕНТ (%) – делит текущее число на 100
// ================================================================
document.getElementById('btn_op_percent').onclick = function() {
    if (currentNumber && currentNumber !== '0') {
        currentNumber = (parseFloat(currentNumber) / 100).toString();
        updateDisplay();
    }
};

// ================================================================
// 8. КВАДРАТНЫЙ КОРЕНЬ (√) – извлекает корень из числа
// ================================================================
document.getElementById('btn_op_sqrt').onclick = function() {
    if (currentNumber && currentNumber !== '0') {
        let num = parseFloat(currentNumber);
        if (num >= 0) {
            currentNumber = Math.sqrt(num).toString();
        } else {
            currentNumber = 'Ошибка';   // Корень из отрицательного числа
        }
        updateDisplay();
    }
};

// ================================================================
// 9. ВОЗВЕДЕНИЕ В КВАДРАТ (x²) – умножает число на само себя
// ================================================================
document.getElementById('btn_op_square').onclick = function() {
    if (currentNumber && currentNumber !== '0') {
        let num = parseFloat(currentNumber);
        currentNumber = (num * num).toString();
        updateDisplay();
    }
};

// ================================================================
// 10. ФАКТОРИАЛ (x!) – вычисляет факториал целого неотрицательного числа
// ================================================================
document.getElementById('btn_op_factorial').onclick = function() {
    if (currentNumber && currentNumber !== '0') {
        let num = parseInt(currentNumber);
        if (num < 0) {
            currentNumber = 'Ошибка';
        } else {
            let fact = 1;
            // Цикл от 2 до num, умножаем факториал
            for (let i = 2; i <= num; i++) {
                fact *= i;
            }
            currentNumber = fact.toString();
        }
        updateDisplay();
    }
};

// ================================================================
// 11. ТРОЙНОЙ НОЛЬ (000) – добавляет три нуля к текущему числу
// ================================================================
document.getElementById('btn_op_triple_zero').onclick = function() {
    appendInput('000');
};

// ================================================================
// 12. НАКАПЛИВАЕМОЕ СЛОЖЕНИЕ (M+) – прибавляет текущее число к памяти
// ================================================================
document.getElementById('btn_memory_add').onclick = function() {
    // Берём число с экрана, если оно пустое – используем 0
    let val = parseFloat(currentNumber) || 0;
    memory += val;                     // Прибавляем к памяти
    currentNumber = memory.toString(); // Показываем обновлённую память на экране
    updateDisplay();
};

// ================================================================
// 13. НАКАПЛИВАЕМОЕ ВЫЧИТАНИЕ (M-) – вычитает текущее число из памяти
// ================================================================
document.getElementById('btn_memory_sub').onclick = function() {
    let val = parseFloat(currentNumber) || 0;
    memory -= val;                     // Вычитаем из памяти
    currentNumber = memory.toString(); // Показываем обновлённую память
    updateDisplay();
};

// ================================================================
// 14. СМЕНА ЦВЕТА ФОНА КАЛЬКУЛЯТОРА (по кнопке)
//     Меняем background-color у контейнера .background
// ================================================================
document.getElementById('btn_change_bg').onclick = function() {
    const bg = document.querySelector('.background');
    // Массив возможных цветов
    const colors = ['#2b2b2b', '#1e3a5f', '#4a2c2c', '#2d4a2d', '#3d3d3d'];
    // Определяем текущий цвет
    let currentBg = bg.style.backgroundColor;
    // Ищем индекс текущего цвета в массиве
    let idx = colors.indexOf(currentBg);
    if (idx === -1) idx = 0;       // Если не найден – начинаем с первого
    idx = (idx + 1) % colors.length; // Переключаем на следующий цвет
    bg.style.backgroundColor = colors[idx];
};

// ================================================================
// 15. СМЕНА ЦВЕТА ОКНА ВЫВОДА (дисплея) – по кнопке
// ================================================================
document.getElementById('btn_change_display').onclick = function() {
    const display = document.getElementById('result');
    const colors = ['rgb(84, 168, 216)', '#ffaa55', '#88cc88', '#cc88ff', '#ff8888'];
    let current = display.style.backgroundColor;
    let idx = colors.indexOf(current);
    if (idx === -1) idx = 0;
    idx = (idx + 1) % colors.length;
    display.style.backgroundColor = colors[idx];
};

// ================================================================
// 16. ИНДИВИДУАЛЬНАЯ ОПЕРАЦИЯ (1/x) – обратное число
// ================================================================
document.getElementById('btn_custom').onclick = function() {
    if (currentNumber && currentNumber !== '0') {
        let num = parseFloat(currentNumber);
        if (num !== 0) {
            currentNumber = (1 / num).toString();
        } else {
            currentNumber = 'Ошибка';   // Деление на ноль
        }
        updateDisplay();
    }
};

// ================================================================
// 17. БИНАРНЫЕ ОПЕРАЦИИ (+, -, *, /) и КНОПКА "="
//     Обработчики для кнопок операций запоминают первое число и знак,
//     а при нажатии "=" вычисляют результат.
// ================================================================

// Список id кнопок операций (должны быть в HTML)
const operationIds = ['btn_op_plus', 'btn_op_minus', 'btn_op_mult', 'btn_op_div'];

operationIds.forEach(opId => {
    document.getElementById(opId).onclick = function() {
        // Если на экране есть число – сохраняем его как первое
        if (currentNumber !== '') {
            firstNumber = parseFloat(currentNumber);
            // Определяем операцию по последней части id (plus, minus, mult, div)
            operation = this.id.replace('btn_op_', '');
            // Очищаем экран для ввода второго числа
            currentNumber = '';
            updateDisplay();
        }
    };
});

// Кнопка "=" – выполняет вычисление
document.getElementById('btn_op_equal').onclick = function() {
    // Проверяем, что есть первое число, операция и второе число на экране
    if (firstNumber !== null && operation !== null && currentNumber !== '') {
        let second = parseFloat(currentNumber);
        let res;
        // Выбираем действие в зависимости от сохранённой операции
        switch (operation) {
            case 'plus':  res = firstNumber + second; break;
            case 'minus': res = firstNumber - second; break;
            case 'mult':  res = firstNumber * second; break;
            case 'div':
                if (second !== 0) {
                    res = firstNumber / second;
                } else {
                    currentNumber = 'Ошибка';
                    updateDisplay();
                    return;   // Прерываем выполнение
                }
                break;
            default: res = 0;
        }
        // Записываем результат на экран
        currentNumber = res.toString();
        // Сбрасываем первое число и операцию
        firstNumber = null;
        operation = null;
        updateDisplay();
    }
};

// ================================================================
// 18. ИНИЦИАЛИЗАЦИЯ – при загрузке страницы показываем "0"
// ================================================================
updateDisplay();
