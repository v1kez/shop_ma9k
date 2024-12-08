const express = require('express');
const { Pool } = require('pg');
const hbs = require('hbs');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

// Настройки подключения к базе данных
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'shop_ma9k',
    password: 'your_password',
    port: 5433,
});

// Регистрация хелпера eq
hbs.registerHelper('eq', function (a, b) {
    return a === b;
});

// Middleware для обработки JSON и URL-кодированных данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));

// Настройка сессий
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Настройка handlebars
app.set('views', 'views');
app.set('view engine', 'hbs');

// Главная страница
app.get('/', async (req, res) => {
    const user = req.session.userId ? await pool.query('SELECT * FROM public."user" WHERE user_id = \$1', [req.session.userId]) : null;
    res.render('index',{user: user ? user.rows[0] : null});
});

// Проверка авторизации
function checkAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

// Регистрация пользователя
app.get('/register', (req, res) => {
    
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, password, email, phone } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
        await pool.query(
            'INSERT INTO public."user" (username, password, email, phone) VALUES (\$1, \$2, \$3, \$4)',
            [username, hashedPassword, email, phone]
        );
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

// Авторизация пользователя
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM public."user" WHERE username = \$1', [username]);
    const user = result.rows[0];
    
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user.user_id; // Сохраняем ID пользователя в сессии
        res.redirect('/products');
    } else {
        res.status(401).send('Неверные учетные данные');
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Ошибка сервера');
        }
        res.redirect('/');
    });
});


// Добавление товара
app.get('/add-product', checkAuth, async (req, res) => {
    const user = req.session.userId ? await pool.query('SELECT * FROM public."user" WHERE user_id = \$1', [req.session.userId]) : null;
    try {
        const result = await pool.query('SELECT * FROM category');
        res.render('add-product', { category: result.rows ,user: user ? user.rows[0] : null});
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

// Обработка формы добавления товара
app.post('/products', upload.single('photo'), async (req, res) => {
    const { product_name, description, price, category_id, size } = req.body;
    const photo = req.file.filename;

    try {
        await pool.query(
            'INSERT INTO public.product (product_name, description, price, category_id, photo, size) VALUES (\$1, \$2, \$3, \$4, \$5, \$6)',
            [product_name, description, price, category_id, photo, size]
        );
        res.redirect('/products');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});


// Получение всех товаров с возможностью сортировки и фильтрации
app.get('/products', async (req, res) => {
    const { sort, category, size } = req.query;
    let query = `
        SELECT p.*, c.category_name 
        FROM public.product p 
        JOIN public.category c ON p.category_id = c.category_id
        WHERE 1=1`;

    const params = [];

    if (category) {
        query += ` AND c.category_name = $${params.length + 1}`;
        params.push(category);
    }

    if (size) {
        query += ` AND p.size = $${params.length + 1}`;
        params.push(size);
    }

    if (sort === 'price_asc') {
        query += ` ORDER BY p.price ASC`;
    } else if (sort === 'price_desc') {
        query += ` ORDER BY p.price DESC`;
    }

    try {
        const result = await pool.query(query, params);
        const categoriesResult = await pool.query('SELECT * FROM public.category'); // Получаем категории
        const user = req.session.userId ? await pool.query('SELECT * FROM public."user" WHERE user_id = \$1', [req.session.userId]) : null;

        res.render('products', { products: result.rows, user: user ? user.rows[0] : null, categories: categoriesResult.rows });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});



// Корзина
app.get('/cart', checkAuth, async (req, res) => {
    const user_id = req.session.userId;
    const user = req.session.userId ? await pool.query('SELECT * FROM public."user" WHERE user_id = \$1', [req.session.userId]) : null;
    try {
        const cartItems = await pool.query(
            `SELECT p.product_id, p.product_name, p.price, pc.quantity
             FROM public.products_cart pc
             JOIN public.product p ON pc.product_id = p.product_id
             JOIN public.order_item oi ON pc.order_item_id = oi.order_item_id
             WHERE oi.user_id = \$1`,
            [user_id]
        );

        res.render('cart', { cartItems: cartItems.rows,user: user ? user.rows[0] : null });
    } catch (error) {
        console.error('Ошибка при получении корзины:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Добавление товара в корзину
app.post('/cart/add', checkAuth, async (req, res) => {
    const { product_id, quantity } = req.body;
    const user_id = req.session.userId;

    try {
        // Создаем новую запись в order_item, если еще нет
        const orderItemResult = await pool.query(
            'INSERT INTO public.order_item (user_id) VALUES (\$1) RETURNING order_item_id',
            [user_id]
        );
        const order_item_id = orderItemResult.rows[0].order_item_id;

        // Добавляем товар в products_cart
        await pool.query(
            'INSERT INTO public.products_cart (order_item_id, product_id, quantity) VALUES (\$1, \$2, \$3)',
            [order_item_id, product_id, quantity]
        );

        res.redirect('/products');
    } catch (error) {
        console.error('Ошибка при добавлении товара в корзину:', error);
        res.status(500).send('Ошибка сервера');
    }
});

app.post('/checkout', checkAuth, async (req, res) => {
    const user_id = req.session.userId;

    try {
        // Получаем все товары из корзины
        const cartItems = await pool.query(
            `SELECT * FROM public.products_cart pc
             JOIN public.order_item oi ON pc.order_item_id = oi.order_item_id
             WHERE oi.user_id = \$1`,
            [user_id]
        );

        // Проверяем, есть ли товары в корзине
        if (cartItems.rows.length === 0) {
            return res.status(400).send('Корзина пуста, невозможно оформить заказ.');
        }

        // Создаем новый заказ
        const order = await pool.query(
            'INSERT INTO public.orders (user_id, order_date) VALUES (\$1, NOW()) RETURNING orders_id',
            [user_id]
        );
        const order_id = order.rows[0].orders_id;

        // Переносим товары из корзины в заказ
        for (const item of cartItems.rows) {
            await pool.query(
                'INSERT INTO public.products_cart (order_item_id, product_id, quantity) VALUES (\$1, \$2, \$3)',
                [order_id, item.product_id, item.quantity]
            );
        }

        // Очищаем корзину
        await pool.query('DELETE FROM public.products_cart WHERE order_item_id IN (SELECT order_item_id FROM public.order_item WHERE user_id = \$1)', [user_id]);

        // Перенаправляем на историю заказов
        res.redirect('/orders');
    } catch (error) {
        console.error('Ошибка при оформлении заказа:', error);
        res.status(500).send('Ошибка сервера');
    }
});


// История заказов
app.get('/orders', checkAuth, async (req, res) => {
    const user_id = req.session.userId;
    const user = req.session.userId ? await pool.query('SELECT * FROM public."user" WHERE user_id = \$1', [req.session.userId]) : null;
    try {
        const orders = await pool.query(
            `SELECT o.orders_id, o.order_date, p.product_name, pc.quantity
             FROM public.orders o
             JOIN public.products_cart pc ON o.orders_id = pc.order_item_id
             JOIN public.product p ON pc.product_id = p.product_id
             WHERE o.user_id = \$1
             ORDER BY o.order_date DESC`,
            [user_id]
        );

        res.render('orders', { orders: orders.rows ,user: user ? user.rows[0] : null});
    } catch (error) {
        console.error('Ошибка при получении заказов:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Добавление отзыва
app.post('/reviews', checkAuth, async (req, res) => {
    const { product_id, rating, comment } = req.body;
    const user_id = req.session.userId;

    try {
        await pool.query(
            'INSERT INTO public.reviews (product_id, user_id, rating, comment) VALUES (\$1, \$2, \$3, \$4)',
            [product_id, user_id, rating, comment]
        );
        res.redirect('/products');
    } catch (error) {
        console.error('Ошибка при добавлении отзыва:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Получение отзывов для товара
app.get('/products/:id/reviews', async (req, res) => {
    const product_id = req.params.id;
    const user = req.session.userId ? await pool.query('SELECT * FROM public."user" WHERE user_id = \$1', [req.session.userId]) : null;
    try {
        const reviews = await pool.query(
            'SELECT r.*, u.username FROM public.reviews r JOIN public."user" u ON r.user_id = u.user_id WHERE r.product_id = \$1',
            [product_id]
        );

        res.render('product-reviews', { reviews: reviews.rows, product_id ,user: user ? user.rows[0] : null});
    } catch (error) {
        console.error('Ошибка при получении отзывов:', error);
        res.status(500).send('Ошибка сервера');
    }
});

// Удаление товара
app.post('/products/delete/:id', checkAuth, async (req, res) => {
    const productId = req.params.id;

    try {
        await pool.query('DELETE FROM public.product WHERE product_id = \$1', [productId]);
        res.redirect('/products');
    } catch (error) {
        console.error('Ошибка при удалении товара:', error);
        res.status(500).send('Ошибка сервера');
    }
});

