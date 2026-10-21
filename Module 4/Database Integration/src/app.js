
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const postController = require('./controllers/postController');
const authRoutes = require('./routes/authRoutes');

if (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET.length < 32) {
  throw new Error('COOKIE_SECRET must contain at least 32 characters');
}

const app = express();

app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use('/auth', authRoutes);

app.get('/posts', postController.list);
app.get('/posts/:id', postController.get);
app.post('/posts', postController.create);
app.patch('/posts/:id', postController.update);
app.delete('/posts/:id', postController.remove);

app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : 'Internal server error',
  });
});

if (require.main === module) {
  app.listen(process.env.PORT || 3000, () => {
    console.log(`API listening on port ${process.env.PORT || 3000}`);
  });
}

module.exports = app;
