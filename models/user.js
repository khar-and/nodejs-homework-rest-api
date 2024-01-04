const { Schema, model } = require("mongoose");
const Joi = require("joi");
const handleMongooseError = require("../helpers/handleMongooseError");

const userSchema = new Schema(
  {
    password: {
      type: String,
      required: [true, "Set password for user"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    subscription: {
      type: String,
      enum: ["starter", "pro", "business"],
      default: "starter",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    token: String,
  },
  { versionKey: false }
);

userSchema.post("save", handleMongooseError);

// Створюємо Joi-схеми на реєстрацію та логін

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  // subscription: Joi.string().required().valid("starter", "pro", "business"),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const schemas = {
  registerSchema,
  loginSchema,
};

// Створюємо модель
const User = model("user", userSchema);

module.exports = {
  User,
  schemas,
};