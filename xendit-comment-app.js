const express = require("express");
const request = require("request");
const uuidv4 = require("uuid/v4");
const dotenv = require("dotenv");

// Enable express app
const app = express();

// Enable express to parse json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize environment variables
dotenv.config();

// Initialize helper function to POST request to logger app
const logger = {
  "log": function(logData){
    logData["service"] = process.env.APP_NAME;
    var loggerApp = {
      uri: process.env.LOGGER_APP_URI,
      body: JSON.stringify(logData),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    }
    request(loggerApp, function(error, response){});
  }
};

// Initialize helper function to interact with DB adapter app
const dbAdapter = {
  "request": async function(uri, insertData){
    var dbAdapterApp = {
      uri: uri,
      body: JSON.stringify(insertData),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    }
    return await this.httpSynchronous(dbAdapterApp);
  },
  "httpSynchronous": async function(httpReq){
    return new Promise((resolve, reject) => {
      request(httpReq, function(error, response, body){
        if(error || response.statusCode != 200){
          reject(error);
        }
        else {
          resolve(JSON.parse(body));
        }
      });
    });
  }
};

app.post("/orgs/:orgId/comments", async (req, res) => {
  var reqId = uuidv4();
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Receive request with parameters", payload: req.body});
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Organization ID value: " + req.params.orgId});
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Construct request for database insert"});
  var insertRq = {
    "reqId": reqId,
    "database": process.env.COMMENTS_DATABASE_NAME,
    "collection": process.env.COMMENTS_COLLECTION_NAME,
    "payload": {
      "docId": reqId,
      "orgId": req.params.orgId,
      "comment": req.body.comment,
      "createdAt": new Date().toISOString(),
      "visible": true
    }
  };
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Request constructed", payload: insertRq});
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Send insert request to DB Adapter app"});
  try {
    const dbResponse = await dbAdapter.request(process.env.DBADAPTER_INSERT_URI, insertRq);
    logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Receive response from DBAdapter app", payload: dbResponse});
    var response = {
      "reqId": reqId,
      "service": process.env.APP_NAME,
      "status": dbResponse.status
    };
    logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Returning response", payload: response});
  } catch(error){
    logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Failed to insert data into database", payload: error});
    var response = {
      "reqId": reqId,
      "service": process.env.APP_NAME,
      "status": "Failed"
    };
    logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Returning failed response", payload: response});
  }
  res.json(response);
});

app.get("/orgs/:orgId/comments", async (req, res) => {
  var reqId = uuidv4();
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Receive get comments request"});
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Organization ID value: " + req.params.orgId});
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Construct request for database read"});
  var readRq = {
    "reqId": reqId,
    "database": process.env.COMMENTS_DATABASE_NAME,
    "collection": process.env.COMMENTS_COLLECTION_NAME,
    "payload": {
      "orgId": req.params.orgId,
      "visible": true
    }
  };
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Request constructed", payload: readRq});
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Send read request to DB Adapter app"});
  try {
    const dbResponse = await dbAdapter.request(process.env.DBADAPTER_READ_URI, readRq);
    logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Receive response from DBAdapter app", payload: dbResponse});
    var response = {
      "reqId": reqId,
      "service": process.env.APP_NAME,
      "status": dbResponse.status,
      "comments": dbResponse.payload.map(function(comments){
        return {
          "comment": (comments.comment) ? comments.comment : "",
          "createdAt": (comments.createdAt) ? comments.createdAt : "N/A"
        }
      })
    };
    logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Returning response", payload: response});
  } catch (error){
    logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Failed to insert data from database", payload: error});
    var response = {
      "reqId": reqId,
      "service": process.env.APP_NAME,
      "status": "Failed",
      "comments": []
    };
    logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Returning failed response", payload: response});
  }
  res.json(response);
});

app.delete("/orgs/:orgId/comments", async (req, res) => {
  var reqId = uuidv4();
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Receive delete comments request"});
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Organization ID value: " + req.params.orgId});
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Construct request for delete comments"});
  var deleteRq = {
    "reqId": reqId,
    "database": process.env.COMMENTS_DATABASE_NAME,
    "collection": process.env.COMMENTS_COLLECTION_NAME,
    "payload": {
      "orgId": req.params.orgId
    }
  };
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Request constructed", payload: deleteRq});
  logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Send delete request to DB Adapter app"});
  try {
    const dbResponse = await dbAdapter.request(process.env.DBADAPTER_DELETE_URI, deleteRq);
    logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Receive response from DBAdapter app", payload: dbResponse});
    var response = {
      "reqId": reqId,
      "service": process.env.APP_NAME,
      "status": dbResponse.status,
    };
    logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Returning response", payload: response});
  } catch (error){
    logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Failed to delete records from database", payload: error});
    var response = {
      "reqId": reqId,
      "service": process.env.APP_NAME,
      "status": "Failed"
    };
    logger.log({id: reqId, method: req.method + " " + req.originalUrl, message: "Returning failed response", payload: response});
  }
  res.json(response);
});

var server = app.listen(process.env.APP_PORT, function () {
    console.log("Comment app running on port", server.address().port);
});
