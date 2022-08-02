//TODO: seeds script should come here, so we'll be able to put some data in our local env
var mongoose = require("mongoose");
var router = require("express").Router();
require("../models/User");
require("../models/Item");
require("../models/Comment");
var User = mongoose.model("User");
var Item = mongoose.model("Item");
var Comment = mongoose.model("Comment");
const { sendEvent } = require("../lib/event");
var auth = require("../routes/auth");

for (let index = 0; index < 100; index++) {
  router.post("/users", function (req, res, next) {
    var user = new User();

    user.username = req.body.user.username;
    user.email = req.body.user.email;
    user.setPassword(req.body.user.password);

    user
      .save()
      .then(function () {
        sendEvent("user_created", { username: req.body.user.username });
        return res.json({ user: user.toAuthJSON() });
      })
      .catch(next);
  });
}

for (let index = 0; index < 100; index++) {
  router.post("/", auth.required, function (req, res, next) {
    User.findById(req.payload.id)
      .then(function (user) {
        if (!user) {
          return res.sendStatus(401);
        }

        var item = new Item(req.body.item);

        item.seller = user;

        return item.save().then(function () {
          sendEvent("item_created", { item: req.body.item });
          return res.json({ item: item.toJSONFor(user) });
        });
      })
      .catch(next);
  });
}

for (let index = 0; index < 100; index++) {
  router.post("/:item/comments", auth.required, function (req, res, next) {
    User.findById(req.payload.id)
      .then(function (user) {
        if (!user) {
          return res.sendStatus(401);
        }

        var comment = new Comment(req.body.comment);
        comment.item = req.item;
        comment.seller = user;

        return comment.save().then(function () {
          req.item.comments = req.item.comments.concat([comment]);

          return req.item.save().then(function (item) {
            res.json({ comment: comment.toJSONFor(user) });
          });
        });
      })
      .catch(next);
  });
}
