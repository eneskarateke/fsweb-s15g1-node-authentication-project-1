// `checkUsernameFree`, `checkUsernameExists` ve `checkPasswordLength` gereklidir (require)
// `auth-middleware.js` deki middleware fonksiyonları. Bunlara burda ihtiyacınız var!
const router = require("express").Router();
const UserModel = require("../users/users-model");
const authMW = require("./auth-middleware");
const bcrypt = require("bcryptjs");

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
  authMW.usernameBostami,
  authMW.sifreGecerlimi,
  async (req, res, next) => {
    const user = req.body;
    user.password = bcrypt.hashSync(user.password, 8); // 2 üzeri 8 defa hashleyecek.
    const newUser = await UserModel.ekle(user);
    if (newUser) {
      res.status(201).json({ newUser });
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

router.post("/login", authMW.usernameVarmi, async (req, res, next) => {
  const { password, username } = req.body;
  // adım 1: önce kişiyi veritabanından alırız.
  const user = await UserModel.goreBul({ username: username }).first();
  //adım 2: password'unu check ederiz.
  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = user; //Session oluşturduk.
    res.status(200).json({ message: `Merhaba ${user.Name}!` });
  } else {
    next();
  }
});

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
router.get("/logout", async (req, res, next) => {
  if (req.session && req.session.user) {
    req.session.destroy((err) => {
      //server tarafında session'ı destroy eder.
      if (err) {
        res.status(500).json({ message: "Session error!..." });
      } else {
        res.set(
          "Set-Cookie",
          "PizzaOrder=; Path=/; Expires=Mon, 01 Jan 1970 11:33:31 GMT"
        ); //1.Client tarfında Cookie expire olsun diye geçmiş tarih verdim.
        res.status(200).json({ message: "Çıkış yapildi" }); //2. success mesajı döndük
      }
    });
  } else {
    res.status(400).json({
      message: "Oturum bulunamadı!",
    });
  }
});
// Diğer modüllerde kullanılabilmesi için routerı "exports" nesnesine eklemeyi unutmayın.

module.exports = router;
