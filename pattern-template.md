# Short title

Cache IoT device data for quick Carbon Design System front-ends

# Long title

Use an API caching server for your IoT device data that allows to build quick, robust and efficient front-ends with Carbon Design System

# Author

* Tony Melo <tony.melo1@ibm.com>
* Ashutosh Nath Agarwal <ashutosh.nath.agarwal@ibm.com>

# URLs

### Github repo

* https://github.com/IBM/cache-IoT-data-for-Carbon-UI

# Summary

This code pattern is for developers looking to start building quick and efficient front-ends with a live view of their IoT device datausing an API caching server with IBM Carbon Design System. Learn how to build an API caching Node.js server using Loopback.io connected with IBM Cloudant database. 

# Technologies

+ [Node.js](https://nodejs.org) is an open source, cross-platform JavaScript run-time environment that executes server-side JavaScript code.
+ [Loopback.io](https://loopback.io/) LoopBack is a highly extensible, open-source Node.js framework based on Express that enables you to quickly create dynamic end-to-end REST APIs and connect to backend systems such as databases and SOAP or REST services.
+ [Docker](https://www.docker.com/) independent container platform that enables organizations to seamlessly build, share and run any application, anywhere—from hybrid cloud to the edge.
+ [Postman](https://www.getpostman.com/) is the only complete API development environment, and flexibly integrates with the software development cycle.

# Description

This code pattern demonstrates an API caching server that can reside between your Carbon Design System based front-end and the API's for your IoT device data, and can help with building quick and efficient interfaces using IBM Carbon UI. The pattern showcases a Node.js server built using Loopback.io that the front-end of an application would communicate with, and which interacts with an IBM Cloudant database that holds information about your IoT device so that your application has cached data even when intermittent communication failures occur with the IoT device.

When the reader has completed this code pattern, they will understand how to:

* Create a Node.js and Loopback.io backend server
* Create API's using Loopback.io
* Setup IBM Cloudant and interface with Loopback.io
* Run IBM cloudant database locally
* Setup a mock IOT device on Internet of Things Platform

# Flow

<p align="center">
  <img src="docs/doc-images/arch-flow.png">
</p>

1. User authenticates to API Server through Carbon Design System based front-end
2. Front-end makes request data to be visualized from REST API
3. API Server makes request to IoT device data API with stored credentials for that API
4. If...
   1. there is a good response, the API Server receives new data and caches, then sends it to the front-end
   2. there is a bad response, the API server retrieves previously cached and returns THAT to the front-end
5. On a given interval, the API server refreshes the data it has stored for the collections of APIs it has information on

# Components and services

*	[IBM Carbon Design System](https://www.carbondesignsystem.com) is IBM’s open-source design system for products and experiences. With the IBM Design Language as its foundation, the system consists of working code, design tools and resources, human interface guidelines, and a vibrant community of contributors.
*	[IBM Cloudant](https://www.ibm.com/cloud/cloudant) is a fully managed, scalable distributed database that gives you more time to focus on what matters – building your product.
* [IBM Internet of Things Platform](https://cloud.ibm.com/catalog/services/internet-of-things-platform) - Securely connect, control, and manage devices. Quickly build IoT applications that analyze data from the physical world.
