const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const jimp = require("jimp");
const nodemailer = require("nodemailer");
const { nanoid } = require("nanoid");

require("dotenv").configDotenv();

const { ctrlWrapper, HttpError } = require("../helpers");

const { SECRET_KEY, META_PASSWORD, BASE_URL } = process.env;

// ----------------------------Email

// Створюємо об'єкт налаштувань
const nodemailerConfig = {
  host: "smtp.meta.ua",
  port: 465,
  secure: true,
  auth: {
    user: "kh_andrew16@meta.ua",
    pass: META_PASSWORD,
  },
};
// Створюємо транспорт
const transport = nodemailer.createTransport(nodemailerConfig);

// Шлях до папки з аватарками
const avatarsDir = path.join(__dirname, "../", "public", "avatars");

// Контролер реєстрації
const register = async (req, res) => {
  const { email, password, subscription = "starter" } = req.body;
  // Якщо в базі вже є такий емейл - перевіряємо і надсилаємо унікальне повідомлення

  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use");
  }
  // Перед збкріганням Юзера - хешуємо пароль
  const hashPassword = await bcrypt.hash(password, 10);
  // Генеруємо аватарку тимчасову
  const avatarURL = gravatar.url(email);
  // Створюємо верифікаційний код
  const verificationToken = nanoid();

  const newUser = await User.create({
    email,
    password: hashPassword,
    subscription,
    avatarURL,
    verificationToken,
  });

  // Створюємо об'єкт емейл
  const verifyEmail = {
    to: email,
    from: "kh_andrew16@meta.ua",
    subject: "Test email",
    Html: `<a target = "_blank" href="${BASE_URL}/users/verify/${verificationToken}">Click verify email</a>`,
  };

  // Відправка пошти (в реєстрації)
  await transport.sendMail(verifyEmail);

  res.status(201).json({
    user: {
      email,
      subscription: newUser.subscription,
    },
  });
};

// Контролер верифікації емейла
const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw HttpError(404, "User not found");
  }
  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: "",
  });
  res.status(200).json({
    message: "Verification successful",
  });
};

// Контролер для підтвердження емейла
const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(400, "Email not found");
  }
  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }
  const verifyEmail = {
    to: email,
    from: "kh_andrew16@meta.ua",
    subject: "Test email",
    Html: `<a target = "_blank" href="${BASE_URL}/users/verify/${user.verificationToken}">Click verify email</a>`,
  };

  await transport.sendMail(verifyEmail);
  res.status(200).json({
    message: "Verification email sent",
  });
};

// Контролер логіна
const login = async (req, res) => {
  const { email, password } = req.body;
  // Перевірка чи існує вже такий користувач
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }
  //  Перевірка верифікації користувача
  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  // Якщо такий користувач вже існує, то перевіряємо паролі
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }
  // Якщо паролі співпадають - с творюємо токен і відправляємо на фронтенд
  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  const { subscription } = user;
  res.json({
    token,
    user: {
      email,
      subscription,
    },
  });
};

// Контролер Current
const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;
  res.status(200).json({
    email,
    subscription,
  });
};

// Контролер Logout
const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });
  res.json({
    message: "Logout",
  });
};

// Контролер updateAvatar
const updateAvatar = async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "File for upload is missing" });
  }

  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;
  const filename = `${_id}_${originalname}`; // Робимо унікальним ім'я файлу

  // Створюємо шлях де повинен зберігатися файл аватарки
  const resultUpload = path.join(avatarsDir, filename);

  // Обробка зображення (аватарки)
  jimp.read(tempUpload, (err, image) => {
    if (err) throw HttpError(404, err);
    image.autocrop().cover(250, 250).write(resultUpload);
  });
  await fs.unlink(tempUpload);

  // Зтимчасового місця переміщуємо файл куди потрібно
  // await fs.rename(tempUpload, resultUpload);

  // Записуємо даний шлях в БД
  const avatarURL = path.join("avatars", filename);
  await User.findByIdAndUpdate(_id, { avatarURL });
  res.status(200).json({
    avatarURL,
  });
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateAvatar: ctrlWrapper(updateAvatar),
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
};
