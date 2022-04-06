const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(__dirname + "/date.js");

const app = express();


// let items = ["First thing", "Second thing", "Third thing"];
// let workItems = [];

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// ======================DATABASE===========================

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

// Creating the Schema.
const itemSchema = new mongoose.Schema({
    name: String
});

// Compiling Schema into a Model.
const Item = mongoose.model("Item", itemSchema);

// Create new data item
const item1 = new Item({
    name: "Welcome to todoList app!"
});

// const defaultItems = [item1];
const defaultItems = [];

const listSchema = {
    name: String,
    items: [itemSchema]
};

const List = mongoose.model("List", listSchema);
const nameList = new Set();
List.find(function (err, items) {
    items.forEach(function (item) {
        nameList.add(item.name);
    })
});

// ========================================================

app.get("/", function (req, res) {
    console.log(1)
    List.findOne({ name: "Today" }, function (err, foundItem) {
        if (!foundItem) {
            const list = List({
                name: "Today",
                items: defaultItems
            });
            list.save();
            nameList.add("Today");
            res.render('list', { listTitle:  list.name, newListItems: list.items, listItem: nameList});
        }
        else {
            res.render('list', { listTitle:  foundItem.name, newListItems: foundItem.items, listItem: nameList});
        }
    })
    
    // In Express v4, a very basic setup using EJS would look like the following. (This assumes a views directory containing an list.ejs page.)
    // res.render('list', { listTitle:  "Today", newListItems: items}); // list is list.ejs file in the folder views
    
    // res.sendFile(__dirname + "/index.html");
});

app.post("/", function (req, res) {
    console.log(2)
    let itemName = req.body.newItem;
    let listName = req.body.list;
    let item = new Item({
        name: req.body.newItem
    });
    
    List.findOne({ name: listName }, function (err, foundList) {
        foundList.items.push(item);
        foundList.save();
        if (listName === "Today") {
            res.redirect("/");
        }
        else {
            res.redirect("/" + listName);    
        }
    })
});

app.post("/delete", function (req, res) {
    let checkItemID = req.body.checkbox;
    let listName = req.body.listName;

    List.findOneAndUpdate(
        { name: listName },
        {$pull: {items: {_id: checkItemID}}},
        function (err, foundItem) { 
            if (!err) {
                if (listName === "Today") {
                    res.redirect("/")
                }
                else {
                    res.redirect("/" + listName);
                }
                
            }
        }
    );

});

app.get("/:customListName", function (req, res) {
    console.log(4)
    let customListName = _.capitalize(_.camelCase(req.params.customListName));
    
    if (customListName === "Today") {
        res.redirect("/");
    }
    else {
        List.findOne({ name: customListName }, function (err, foundItem) {
            if (!foundItem) {
                // create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save(); 
                nameList.add(customListName)
                res.render("list", { listTitle: list.name, newListItems: list.items, listItem: nameList});
            }
            else {
                // show an existing list
                res.render("list", { listTitle: foundItem.name, newListItems: foundItem.items, listItem: nameList});
            }
        });    
    }
});

app.listen(8080, function () {
    console.log("Server is running on port 8080");
});