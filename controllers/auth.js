const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").configDotenv();

// const HttpError = require("../helpers/httpError");
const { ctrlWrapper, HttpError } = require("../helpers");

const { SECRET_KEY } = process.env;

// Контролер реєстрації
const register = async (req, res) => {
  const { email, password } = req.body;
  // Якщо в базі вже є такий емейл - перевіряємо і надсилаємо унікальне повідомлення

  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use");
  }
  // Перед збкріганням Юзера - хешуємо пароль
  const hashPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({ ...req.body, password: hashPassword });
  res.status(201).json({ email: newUser.email });
};

// Контролер логіна
const login = async (req, res) => {
  const { email, password } = req.body;
  // Перевірка чи існує вже такий користувач
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is invalid");
  }
  // Якщо такий користувач вже існує, то перевіряємо паролі
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password is invalid");
  }
  // Якщо паролі співпадають - с творюємо токен і відправляємо на фронтенд
  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  res.json({
    token,
  });
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
};
