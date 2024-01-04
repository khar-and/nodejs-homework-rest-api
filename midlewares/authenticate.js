const { HttpError } = require("../helpers");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user");

const { SECRET_KEY } = process.env;
// console.log(SECRET_KEY);

const authenticate = async (req, res, next) => {
  const { authorization = "" } = req.headers;
  // console.log(authorization);
  const [bearer, token] = authorization.split(" ");
  // console.log(token);
  //   Перевірка на Bearer
  if (bearer !== "Bearer") {
    next(HttpError(401, "Bearer"));
  }
  // Перевірка на валідність токену
  try {
    // Якщо токен валідний - нам повертається payload, з якого берем айді.
    const { id } = jwt.verify(token, SECRET_KEY);
    console.log("id-----", id);
    // console.log(id);
    //   Перевіряємо чи є даний Юзер в базі
    const user = await User.findById(id);
    if (!user) {
      next(HttpError(401, "User"));
    }
    next(); // Переходимо до контролерів або інших мідлвар]
  } catch {
    next(HttpError(401, "Validate token SECRET_KEY problem or time token"));
  }
};

module.exports = authenticate;
