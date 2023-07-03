// `checkUsernameFree`, `checkUsernameExists` ve `checkPasswordLength` gereklidir (require)
// `auth-middleware.js` deki middleware fonksiyonları. Bunlara burda ihtiyacınız var!
const router = require("express").Router();
const UserModel = require("../users/users-model");
const authMW = require("./auth-middleware");
const bcryptjs = require("bcryptjs");

/**
  1 [POST] /api/auth/register { "username": "sue", "password": "1234" }

  response:
  status: 201
  {
    "user_id": 2,
    "username": "sue"
  }

  response username alınmış:
  status: 422
  {
    "message": "Username kullaniliyor"
  }

  response şifre 3 ya da daha az karakterli:
  status: 422
  {
    "message": "Şifre 3 karakterden fazla olmalı"
  }
 */
router.post(
  "/register",
  authMW.sifreGecerlimi,
  authMW.usernameBostami,
  async (req, res, next) => {
    const user = req.body;
    user.password = bcryptjs.hashSync(user.password, 8); // 2 üzeri 8 defa hashleyecek.
    const newUser = await UserModel.ekle(user);
    if (newUser) {
      res.status(201).json(newUser);
    } else {
      next();
    }
  }
);

/**
  2 [POST] /api/auth/login { "username": "sue", "password": "1234" }

  response:
  status: 200
  {
    "message": "Hoşgeldin sue!"
  }

  response geçersiz kriter:
  status: 401
  {
    "message": "Geçersiz kriter!"
  }
 */

router.post(
  "/login",
  authMW.sifreGecerlimi,
  authMW.usernameVarmi,
  async (req, res, next) => {
    try {
      req.session.user_id = req.dbUser.user_id;
      res.status(200).json({ message: `Hoş geldin ${req.dbUser.username}` });
    } catch (error) {
      next(error);
    }
  }
);

/**
  3 [GET] /api/auth/logout

  response giriş yapmış kullanıcılar için:
  status: 200
  {
    "message": "Çıkış yapildi"
  }

  response giriş yapmamış kullanıcılar için:
  status: 200
  {
    "message": "Oturum bulunamadı!"
  }
 */
router.get("/logout", (req, res, next) => {
  try {
    if (req.session.user_id > 0) {
      req.session.destroy((err) => {
        if (err) {
          res
            .status(500)
            .json({ message: "session destroy edilirken hata oluştu" });
        } else {
          res.json({ message: "Çıkış yapildi" });
        }
      });
    } else {
      res.set("Set-Cookie", "cikolatacips=;");
      res.status(200).json({ message: "Oturum bulunamadı!" });
    }
  } catch (error) {
    next(error);
  }
});
// Diğer modüllerde kullanılabilmesi için routerı "exports" nesnesine eklemeyi unutmayın.

module.exports = router;
