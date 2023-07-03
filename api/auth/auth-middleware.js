const UserModel = require("../users/users-model");
const bcryptjs = require("bcryptjs");

/*
  Kullanıcının sunucuda kayıtlı bir oturumu yoksa

  status: 401
  {
    "message": "Geçemezsiniz!"
  }
*/
function sinirli(req, res, next) {
  try {
    if (req.session && req.session.user_id) {
      next();
    } else {
      res.status(401).json({ message: "Geçemezsiniz!" });
    }
  } catch (error) {
    next(error);
  }
}

/*
  req.body de verilen username halihazırda veritabanında varsa

  status: 422
  {
    "message": "Username kullaniliyor"
  }
*/
async function usernameBostami(req, res, next) {
  try {
    const { username } = req.body;
    const isExist = await UserModel.goreBul({ username: username });
    if (isExist && isExist.length > 0) {
      res.status(422).json({ message: "Username kullaniliyor" });
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
}

/*
  req.body de verilen username veritabanında yoksa

  status: 401
  {
    "message": "Geçers"iz kriter"
  }
*/
async function usernameVarmi(req, res, next) {
  try {
    const { password, username } = req.body;
    // adım 1: önce kişiyi veritabanından alırız.
    const user = await UserModel.goreBul({ username: username }).first();
    //adım 2: password'unu check ederiz.
    if (user && bcryptjs.compareSync(password, user.password)) {
      req.dbUser = user; //Session oluşturduk.
      next();
    } else {
      res.status(401).json({
        message: "Geçersiz kriter",
      });
    }
  } catch (error) {
    next(error);
  }
}

/*
  req.body de şifre yoksa veya 3 karakterden azsa

  status: 422
  {
    "message": "Şifre 3 karakterden fazla olmalı"
  }
*/
function sifreGecerlimi(req, res, next) {
  try {
    const { password } = req.body;
    if (!password || password.length < 4) {
      res.status(422).json({ message: "Şifre 3 karakterden fazla olmalı" });
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
}

// Diğer modüllerde kullanılabilmesi için fonksiyonları "exports" nesnesine eklemeyi unutmayın.

module.exports = { sinirli, usernameBostami, usernameVarmi, sifreGecerlimi };
