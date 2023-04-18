const express = require('express');
const app = express();
app.use(express.json());
const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const port = 8000;
const {User, Book} = require('./models')

app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            maxAge: 2592000000,
        }
    })
);

app.get('/api/testing', (req, res) => {
    res.send('hello')
})

app.post('/api/user/sign-up', async (req, res) => {
    const user = await User.findAll({
        where: {
            username: req.body.username
        }
    })

    try {
        if (!user[0]) {
            bcrypt.hash(req.body.password, 10, function (err, hash) {
                console.log('creating account')
                User.create({
                    username: req.body.username,
                    password: hash,
                    name: req.body.name,
                    email: req.body.email,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }).then((result) => res.status(200).send(result))
            });
        } else {
            console.log('account not created')
            res.status(403).json('Username already exists')
        }
    } catch (error) {
        console.log('account not created')
        res.status(500).json('Account not created', error)

    }
})

app.post('/api/user/login', async (req, res) => {
    const user = await User.findAll({
        where: {
            username: {
                [Op.eq]: req.body.username
            }
        }
    });
    console.log(user)

    try {
        if (user[0]) {
            bcrypt.compare(req.body.password, user[0].password, function (err, result) {
                if ((result) && (req.body.username === user[0].username)) {
                    req.session.user = req.body.username;
                    console.log(req.session.user)
                    res.status(200).send(result)
                } else {
                    res.status(403).json('Username or password is incorrect')
                }
            });
        } else {
            res.status(403).json('Username or password is incorrect')
        }
    } catch (error) {
        console.log('cannot authenticate')
        res.status(500).json('Cannot authenticate', error)

    }
});

app.get('/api/user/logout', (req, res) => {
    req.session.destroy();
});


app.post('/api/book/add-book', async (req, res) => {
    if (req.session.user) {
        const user = await User.findAll({
            where: {
                username: {
                    [Op.eq]: req.session.user
                }
            }
        })

        try { 
            console.log(user[0].id)
            Book.create({
                title: req.body.title,
                author: req.body.author,
                image: req.body.image,
                datePublished: req.body.datePublished,
                buyLink: req.body.buyLink,
                isRead: req.body.isRead,
                userId: user[0].id,
                createdAt: new Date(),
                updatedAt: new Date()
            }).then((result) => res.status(200).send(result))
        } catch (error) {
            res.send(500).json(error)
        }

    }
})

app.get('/api/book/read', async (req, res) => {
    if (req.session.user) {
        const books = await User.findAll({
            attributes: ['id', 'username'],
            where: {
                username: {
                    [Op.eq]: req.session.user
                }
            },
            include: [{
                model: Book,
                where: {
                    isRead: {
                        [Op.eq]: 'true'
                    }
                }
            }]
        })
        res.json(books)
    }
})

app.get('/api/book/unread', async (req, res) => {
    if (req.session.user) {
        const books = await User.findAll({
            attributes: ['id', 'username'],
            where: {
                username: {
                    [Op.eq]: req.session.user
                }
            },
            include: [{
                model: Book,
                where: {
                    isRead: {
                        [Op.eq]: 'false'
                    }
                }
            }]
        })
        res.json(books)
    }
})

app.post('/api/book/review/rating', async (req, res) => {
    Book.findByPk(req.body.id).then((book) => {
        book.review = req.body.review,
        book.rating = req.body.rating
        return book.save()
    }).then(res.status(200).send('book review updated'))
        .catch(error => {
            res.status(500).send(error)
        })
})

app.post('/api/book/mark-read', async (req, res) => {
    Book.findByPk(req.body.id).then((book) => {
        book.isRead = 'true'
        return book.save()
    }).then(res.status(200).send('book marked as read'))
        .catch(error => {
            res.status(500).send(error)
        })
})

app.delete('/api/book/delete-book', (req, res) => {
    Book.destroy({
        where: {
            id: req.body.id
        }
    }).then(res.status(200).send('book deleted'))
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})