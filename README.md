# UI Data Server

## The Stack

The server was written in JavaScript / TypeScript / Node.JS using Loopback.io, an extensive Node.JS framework that allows for the easy creation of APIs. The server was connected to a Cloudant database using Loopback's built in Cloudant Connector. The Cloudant database can be hosted on IBM Cloud or locally using a Docker container that is pre-built and easily configured. For the purposes of this document, I'll be assuming the Cloudant database is run locally.

Much of the base code is generated using Loopback's generator functions. For example, to create a Loopback model with associated datasource, repository, and controller, we follow this simple order of commands which we can then modify as we please.

```
lb4 model
lb4 datasource
lb4 repository
lb4 controller
```
Each command generates an on-screen set of prompts that allow you to customize a set of JavaScript classes to create the framework for your API.

## Getting Started
To start using the server, if you want to use a local version of Cloudant, download the cloudant-developer container available on the Loopback website at this [link][https://loopback.io/doc/en/lb4/Deploying-to-IBM-Cloud.html]. From the Loopback docs, to run a Cloudant database locally at localhost:8080, run the following command:
```
docker run \
      --volume cloudant:/srv \
      --name cloudant-developer \
      --publish 8080:80 \
      --hostname cloudant.dev \
      ibmcom/cloudant-developer
```
This will have your local Cloudant image running at http://localhost:8080. The default login credentials are
```
username: admin
password: pass
```
For instructions on using Loopback to deploy to IBM Cloud, please see the link referenced above.

Once your Cloudant database is configured, we will need to create 4 databases on your local database. See the image below to see what your database should look like once your database is ready to be used.

Now that your database is fully configured, simply clone the Github repository to your local machine and run the following command at the root level of the project to install all necessary dependencies.
```
npm install
npm start
```
With this, the server should be running locally on port 3000. Loopback also automatically generates a simple API explorer at 127.0.0.1:3000/explorer.

## The API

The API contains a few simple classes: Users, Collections, Endpoints, and the Cache.

### Users
Users are a simple class that we use for authentication (it will matter more once the server is hosted on IBM Cloud). To register a new user is a simple POST request to the '/register/ endpoint. The request body should follow the format below:
```
{
  username: {insert email}
  password: {password}
}
```
Upon successful registration, you can pass your username and password in the 'Authorization' header of requests when calling the API.

### Collections
Collections represent the "higher" level information on a collection of APIs. Collections contain the following fields that are sent as JSON in the request body via POST requests:
```
{
collectionID: Number
collectionName: String
baseURL: String (this string corresponds to the base of the API you'd like to call e.g.
https://iotbi-customdashboard.mybluemix.net/cache/allData?api=)
authenticationType: String (must be either Basic or Bearer)
refreshInterval: Number (you can store how often you'd like to refresh the collection here)
credentials: Object (must contain a field for username and password, e.g. {username: Tony.Melo1@ibm.com, password: example})
cacheLocation: String (must be either memory or db)
}
```
To create a new collection, send a POST request from Postman or using curl from terminal to the url 127.0.0.1:3000/collections with a JSON object that matches the above format (fields can be sent in any order in the object). For information on a particular collection, simply send a GET request to 127.0.0.1:3000/collections/{id}, where {id} is the ID number of the collection you would like to know more about.

### Endpoints
Endpoints are how we store the actual APIs that we will be calling. Endpoints contain similar fields to the collection they belong to, however, certain fields will be inherited from the collection if omitted at the endpoint level. To create a new Endpoint, send a POST request to 127.0.0.1:3000/endpoints with the request body of the following format:
```
{
endpointID: Number
collectionID: Number (this should correspond to an existing collection you want the endpoint to belong to)
endpointPath: String (this corresponds to a string like /v1/estate/energy/usage that is appended to the collection's baseURL)
credentials: Object (NOT REQUIRED, will be inherited from the collection if omitted)
refreshInterval: Number (NOT REQUIRED, will be inherited from the collection if omitted)
authenticationType: String (NOT REQUIRED, will be inherited from the collection if omitted)
baseURL: String (NOT REQUIRED, will be inherited from the collection if omitted)
endpointList: String[] (NOT REQUIRED, if you so desire, you can pass an array of endpoint paths here instead of registering paths 1 by 1)

}
```

### Cache
This class is what is used as our data store for anything retrieved from our APIs. In order to refresh the data store, you can hit 127.0.0.1:3000/cache with a PUT request with a request body of the following format:
```
{
collectionID: Number (must correspond to an existing collection we'll be caching data for)
data: (NOT REQUIRED, simply leave it empty and the API with fill it with data, or you could pass data with the same schema)
}
```

