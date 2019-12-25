
// E-comm project

const express = require('express');
const cache = require('memory-cache');
const { Client } = require('pg');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const config = require('./config.json');
const { OAuth2Client } = require('google-auth-library');
const oath = new OAuth2Client(config.CLIENT_ID);


const app = express();
app.use(cookieParser())
app.use(bodyParser());
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


// Route 0: test ping
app.get('/' , (request, response)  => {  

    response.status(200);
    response.json("Successfull ping!");

});

// Route 1: /getItems?productName=<name>&page=<number>
app.get('/getItems', (request, response) => {
    
    let product = request.query.productName;
    product = '%' + product + '%';
    let offset = request.query.page;
    let params = [product, offset];

    const query = "select * from Products p where p.product_name ilike $1 limit 10 offset $2";

    console.log()

    client
        .query(query, params)
        .then(res => {
            let listOfProducts = res.rows;

            /*
                Context: database returns images in the form of an array of url strings

                For the purpose of this project, extracting the first url of the array
                to retrun.
            */
            for (var i = 0; i < listOfProducts.length; i++) {
                listOfProducts[i]['image'] = JSON.parse(listOfProducts[i]['image']);
                listOfProducts[i]['image'] = listOfProducts[i]['image'][0];
            }

            response.status(200);
            response.send(listOfProducts);
        });
});


// Route 2: /pastOrders
app.get('/pastOrders', (request, response) => {
        
    let token = request.headers.cookie;
    console.log(token);  // remove later
    params = [token];
    let query = "select p.product_name , p.retail_price , p.image  from Products p inner" +
        " join Orders o on o.user_id = $1 and o.product_id = p.id ";   
    
    client
        .query(query, params)
        .then(res => {
            let userOrders = res.rows;
            response.status(200);
            response.send(userOrders);
        });  
    
});

// Route 3: /logIn : from body: token=<unique>&name=<name>
app.post('/logIn', async (request, response) => {


    let userToken = request.body.token;
    console.log(userToken);
    console.log("");
    console.log("");
    let userName = request.body.name;
    console.log(userName);
    userToken = await verify(userToken);

    console.log("milestone two");
    params = [userToken, userName];
    let query = "insert into users(unique_id, name) values($1, $2) " +
        "on conflict do nothing";
    
    client
        .query(query, params)
        .then((err, res) => {
            if (!err) {
                response.status(404);
                response.send("illegal query");
                return;

            }
            response.status(200);
            response.send();
        });   

});

// Route 4: /placeOrder : from body: token=<unique>&name=<name>
app.post('/placeOrder',  (request, response) => {

    response.status(200);
    response.send("message");
    
    let userToken = request.body.token;
    let userProduct = request.body.product;
    params = [userToken, userProduct];
    let query = "insert into orders(user_id, product_id) values($1, $2) " +
        "on conflict do nothing";

    client
        .query(query, params)
        .then((err, res) => {
            if (!err) {
                response.status(404);
                response.send("Illegal query");
                return;
            }

            response.status(200);
            response.send();
        });   

});


 async function verify(token) {

      const ticket = await oath.verifyIdToken({
          idToken: token,
          audience: config.CLIENT_ID,  
        });

      const payload = ticket.getPayload();
      const userid = payload['sub'];
      console.log(userid);
      return userid;

}


























