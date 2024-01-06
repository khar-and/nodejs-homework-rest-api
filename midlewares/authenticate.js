const { HttpError } = require("../helpers");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user");
require("dotenv").configDotenv();

const { SECRET_KEY } = process.env;

const authenticate = async (req, res, next) => {
  const { authorization = "" } = req.headers;

  const [bearer, token] = authorization.split(" ");

  //   Перевірка на Bearer
  if (bearer !== "Bearer") {
    next(HttpError(401));
  }
  // Перевірка на валідність токену
  try {
    // Якщо токен валідний - нам повертається payload, з якого берем айді.
    const { id } = jwt.verify(token, SECRET_KEY);

    //   Перевіряємо чи є даний Юзер в базі
    const user = await User.findById(id);
    if (!user || !user.token || user.token !== token) {
      next(HttpError(401));
    }
    req.user = user;
    next(); // Переходимо до контролерів або інших мідлвар]
  } catch {
    next(HttpError(401));
  }
};

module.exports = authenticate;
