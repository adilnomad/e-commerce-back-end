
// E-comm project

const express = require('express');
const cache = require('memory-cache');
const { Client } = require('pg');
const config = require('./config.json');
const app = express();

/*  
    Establish connection to the database.
*/
let client = new Client({

    host: config.HOST ,
    user: config.USER ,
    password: config.PASSWORD ,
    database: config.DATABASE ,

});

client.connect()

/*
    Make server listen on the port specified in the config file.
    If app cannot locate port in config file, listen on port 8080
*/
var server = app.listen(config.PORT || 8080, () => {
    if (server.address().port == config.PORT)
        console.log('Listening on port ' + config.PORT);
    else
        console.log('Listening on default port');
});


// Route 1: /getItems?productName=<name>&page=<number>
app.get('/getItems', (request, response) => {
    
    let product = request.query.productName;
    product = '%' + product + '%';
    let offset = request.query.page;
    let params = [product, offset];

    const query = "SELECT * from Products p where p.product_name ilike $1 limit 10 offset $2";

    client
        .query(query, params)
        .then(res => {
            let items = res.rows;
            for (var i = 0; i < items.length; i++) {
                items[i]['image'] = JSON.parse(items[i]['image']);
                items[i]['image'] = items[i]['image'][0];
            }

            response.status(200);
            response.send(items);
        });
});


// Route 2: /pastOrders?token=<token>
app.get('/pastOrders', (request, response) => {
    
    let token = request.query.token;
    params = [token];
    let query = "select p.product_name , p.retail_price , p.image  from Products p inner join Orders o" +
        " on o.user_id = $1 and o.product_id = p.id ";   

    client
        .query(query, params)
        .then(res => {
            let userOrders = res.rows;
            response.status(200);
            response.send(userOrders);
        });  

});


































