import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getWhereSchemaFor,
  patch,
  put,
  del,
  requestBody,
  HttpErrors
} from '@loopback/rest';
import { Collection, Cache } from '../models';
import { CacheRepository, EndpointRepository, CollectionRepository } from '../repositories';
import { inject } from '@loopback/context';
import {
  AuthenticationBindings,
  UserProfile,
  authenticate,
} from '@loopback/authentication';

export class CollectionController {
  constructor(
    @repository(CacheRepository)
    public cacheRepository: CacheRepository,
    @repository(EndpointRepository)
    public endpointRepository: EndpointRepository,
    @repository(CollectionRepository)
    public collectionRepository: CollectionRepository,
    @inject(AuthenticationBindings.CURRENT_USER) private user: UserProfile,
  ) { }

  validate(collection?: Collection) {
    if (!collection) {
      throw new HttpErrors.BadRequest('Error: no collection given')
    }

    switch (collection.collectionID) {
      case null:
        throw new HttpErrors.BadRequest("Error: collectionID was null")
        break;
      case undefined:
        throw new HttpErrors.BadRequest("Error: collectionID was undefined")
      case '':
        throw new HttpErrors.BadRequest('Error: collectionID was empty')
      default:
        if (collection.collectionID.trim().length === 0) {
          throw new HttpErrors.BadRequest("Error: collectionID cannot be only whitespace")
        }
        break;
    }

    if (collection.refreshInterval <= 0) {
      throw new HttpErrors.BadRequest("Error: refreshInterval must be positive and nonzero")
    }

    switch (collection.authenticationType.toLowerCase()) {
      case 'basic': case 'bearer':
        break;
      default:
        throw new HttpErrors.BadRequest('Error: authentication tpye must be either Basic or Bearer')
    }

    switch (collection.cacheLocation.toLowerCase()) {
      case 'memory': case 'db':
        break;
      default:
        throw new HttpErrors.BadRequest("Error: cacheLocation must be either memory or db")
    }

    switch (collection.baseURL) {
      case null:
        throw new HttpErrors.BadRequest("Error: baseURL was null")
        break;
      case undefined:
        throw new HttpErrors.BadRequest("Error: baseURL was undefined")
      case '':
        throw new HttpErrors.BadRequest('Error: baseURL was empty')
      default:
        if (collection.baseURL.trim().length === 0) {
          throw new HttpErrors.BadRequest("Error: baseURL cannot be only whitespace")
        }
        break;
    }

    switch (collection.collectionName) {
      case null:
        throw new HttpErrors.BadRequest("Error: collectionName was null")
        break;
      case undefined:
        throw new HttpErrors.BadRequest("Error: collectionName was undefined")
        break;
      case '':
        throw new HttpErrors.BadRequest('Error: collectionName was empty')
        break;
      default:
        if (collection.baseURL.trim().length === 0) {
          throw new HttpErrors.BadRequest("Error: collectionName cannot be only whitespace")
        }
        break;
    }

    if (!collection.credentials['username']) {
      throw new HttpErrors.BadRequest('Error: credentials does not contain a username')
    }

    if (!collection.credentials['password']) {
      throw new HttpErrors.BadRequest('Error: credentials does not contain a password')
    }

    switch (collection.credentials['username']) {
      case null:
        throw new HttpErrors.BadRequest("Error: username was null")
        break;
      case undefined:
        throw new HttpErrors.BadRequest("Error: username was undefined")
        break;
      case '':
        throw new HttpErrors.BadRequest('Error: username was empty')
        break;
      default:
        if (collection.credentials['username'].trim().length === 0) {
          throw new HttpErrors.BadRequest("Error: username cannot be only whitespace")
        }
        break;
    }

    switch (collection.credentials['password']) {
      case null:
        throw new HttpErrors.BadRequest("Error: password was null")
        break;
      case undefined:
        throw new HttpErrors.BadRequest("Error: password was undefined")
        break;
      case '':
        throw new HttpErrors.BadRequest('Error: password was empty')
        break;
      default:
        if (collection.credentials['password'].trim().length === 0) {
          throw new HttpErrors.BadRequest("Error: password cannot be only whitespace")
        }
        break;
    }

  }

  @authenticate('BasicStrategy')
  @post('/collections', {
    responses: {
      '200': {
        description: 'Collection model instance',
        content: { 'application/json': { schema: { 'x-ts-type': Collection } } },
      },
    },
  })
  async create(@requestBody() collection: Collection): Promise<Collection> {
    this.validate(collection)
    await this.collectionRepository.create(collection);

    // How do we handle multiple post requests with the same collectionId? I see the validation does not do this.
    // Do we not worry about this case?
    setInterval(refreshIntervalCache.bind(this, collection), collection.refreshInterval)
    return;
  }

  async refreshIntervalCache(collection) {
    let cache = new Cache({ collectionID: collection.collectionID })
    let newCacheInstance = await this.cacheData(cache)
    Object.assign(cache, newCacheInstance)
    
    return await this.cacheRepository.create(cache)
      .catch(async err => {
        await this.cacheRepository.updateById(cache.collectionID, cache)
        return cache;
      });
  }

  async makeRequest(partialOptions, requestURL, cacheData, key) {
    var options = {
      url: requestURL,
      headers: partialOptions.headers,
      auth: partialOptions.auth
    }
    var response = await request.get(options, function (error, response, body) {
      if (response.statusCode < 400) {
        console.log(`Successfully received response from ${requestURL} with code ${response.statusCode}`)
      } else {
        console.log(`Error: received ${response.statusCode} response from ${requestURL}`)
      }
    })
    if (!response) {
      return cacheData
    }
    try {
      var jsonResponse = JSON.parse(response)
      if (!jsonResponse) {
        return cacheData
      }
      var newData = {}
      newData[key] = jsonResponse
      cacheData = { ...cacheData, ...newData }
    } catch (error) {
      console.log(`Error parsing response: ${response}`)
    }
    return cacheData
  }

  async cacheData(cache?: Cache) {
    if (!cache) {
      throw new HttpErrors.PreconditionFailed("Error: invalid cache instance")
    }
    let collection = await this.collectionRepository.findById(cache.collectionID)
    var useEndpointBase = true;
    var useEndpointAuth = true;
    var useEndpointCreds = true;
    var response;
    var options = {};
    var url = '';
    var collectionToken;
    if (!collection) {
      throw new HttpErrors.BadRequest(`Error: no collection was found with ID ${cache.collectionID}`)
    }
    let endpoints = await this.endpointRepository.find({ where: { collectionID: cache.collectionID } })
    if (!endpoints) {
      throw new HttpErrors.BadRequest(`Error: endpoints for collection ${cache.collectionID} could not be retrieved`)
    }

    if (collection.authenticationType.toLowerCase() === 'bearer') {
      for (var e of endpoints) {
        if (!e) {
          throw new HttpErrors.PreconditionFailed('Error: invalid endpoint present')
        }

        if (!e.baseURL) {
          useEndpointBase = false
        }

        if (!e.credentials) {
          useEndpointCreds = false
        } else if (!e.credentials['username']) {
          useEndpointCreds = false
        } else if (!e.credentials['password']) {
          useEndpointCreds = false
        }

        if (useEndpointBase) {
          url = e.baseURL.concat(e.endpointPath)
        } else {
          url = collection.baseURL.concat(e.endpointPath)
        }

        if (e.endpointPath.includes('login')) {
          if (useEndpointCreds) {
            options = {
              body: JSON.stringify(e.credentials),
              headers: {
                'Content-Type': 'application/json'
              }
            }
          } else {
            options = {
              body: JSON.stringify(collection.credentials),
              headers: {
                'Content-Type': 'application/json'
              }
            }
          }
          var response = await request.post(options)
          var jsonResponse = JSON.parse(response)
          collectionToken = "Bearer " + jsonResponse.data.token
        }
        return;
      };
    }

    for (var e of endpoints) {
      if (!e) {
        throw new HttpErrors.PreconditionFailed('Error: invalid endpoint present')
      }

      if (!e.authenticationType) {
        useEndpointAuth = false
      }

      if (!e.baseURL) {
        useEndpointBase = false
      }

      if (!e.credentials) {
        useEndpointCreds = false
      } else if (!e.credentials['username']) {
        useEndpointCreds = false
      } else if (!e.credentials['password']) {
        useEndpointCreds = false
      }

      if (useEndpointAuth) {
        if (e.authenticationType.toLowerCase() === 'basic') {
          if (useEndpointCreds) {
            options['auth'] = {
              'user': e.credentials['username'],
              'pass': e.credentials['password']
            }
          } else {
            options['auth'] = {
              'user': collection.credentials['username'],
              'pass': e.credentials['password']
            }
          }

          if (useEndpointBase) {
            url = e.baseURL.concat(e.endpointPath)
          } else {
            url = collection.baseURL.concat(e.endpointPath)
          }

          cache.data = await this.makeRequest(
            options,
            url,
            cache.data,
            e.endpointPath
          )

          if (e.endpointList && e.endpointList.length !== 0) {
            for (var path of e.endpointList) {
              if (useEndpointBase) {
                url = e.baseURL.concat(path)
              } else {
                url = collection.baseURL.concat(path)
              }

              cache.data = await this.makeRequest(
                options,
                url,
                cache.data,
                e.endpointPath
              )
            }
          }
        } else {
          options['auth'] = {
            'bearer': collectionToken
          }

          if (useEndpointBase) {
            url = e.baseURL.concat(e.endpointPath)
          } else {
            url = collection.baseURL.concat(e.endpointPath)
          }

          cache.data = await this.makeRequest(
            options,
            url,
            cache.data,
            e.endpointPath
          )

          if (e.endpointList && e.endpointList.length !== 0) {
            for (var path of e.endpointList) {
              if (useEndpointBase) {
                url = e.baseURL.concat(e.endpointPath)
              } else {
                url = collection.baseURL.concat(e.endpointPath)
              }

              cache.data = await this.makeRequest(
                options,
                url,
                cache.data,
                e.endpointPath
              )
            }
          }
        }
      } else {
        if (collection.authenticationType.toLowerCase() === 'bearer') {
          options['auth'] = {
            'bearer': collectionToken
          }
        } else {
          options['auth'] = {
            'user': collection.credentials['username'],
            'pass': collection.credentials['password']
          }
        }

        if (useEndpointBase) {
          url = e.baseURL.concat(e.endpointPath)
        } else {
          url = collection.baseURL.concat(e.endpointPath)
        }

        cache.data = await this.makeRequest(
          options,
          url,
          cache.data,
          e.endpointPath
        )

        if (e.endpointList && e.endpointList.length !== 0) {
          for (var path of e.endpointList) {
            if (useEndpointBase) {
              url = e.baseURL.concat(e.endpointPath)
            } else {
              url = collection.baseURL.concat(e.endpointPath)
            }

            cache.data = await this.makeRequest(
              options,
              url,
              cache.data,
              e.endpointPath
            )
          }
        }
      }
    }
    return cache
  }

  @authenticate('BasicStrategy')
  @get('/collections/count', {
    responses: {
      '200': {
        description: 'Collection model count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(Collection)) where?: Where,
  ): Promise<Count> {
    return await this.collectionRepository.count(where);
  }

  @authenticate('BasicStrategy')
  @get('/collections', {
    responses: {
      '200': {
        description: 'Array of Collection model instances',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': Collection } },
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(Collection)) filter?: Filter,
  ): Promise<Collection[]> {
    return await this.collectionRepository.find(filter);
  }

  @authenticate('BasicStrategy')
  @patch('/collections', {
    responses: {
      '200': {
        description: 'Collection PATCH success count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async updateAll(
    @requestBody() collection: Collection,
    @param.query.object('where', getWhereSchemaFor(Collection)) where?: Where,
  ): Promise<Count> {
    return await this.collectionRepository.updateAll(collection, where);
  }

  @authenticate('BasicStrategy')
  @get('/collections/{id}', {
    responses: {
      '200': {
        description: 'Collection model instance',
        content: { 'application/json': { schema: { 'x-ts-type': Collection } } },
      },
    },
  })
  async findById(@param.path.string('id') id: string): Promise<Collection> {
    return await this.collectionRepository.findById(id);
  }

  @authenticate('BasicStrategy')
  @patch('/collections/{id}', {
    responses: {
      '204': {
        description: 'Collection PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody() collection: Collection,
  ): Promise<void> {
    await this.collectionRepository.updateById(id, collection);
  }

  @authenticate('BasicStrategy')
  @put('/collections/{id}', {
    responses: {
      '204': {
        description: 'Collection PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() collection: Collection,
  ): Promise<void> {
    await this.collectionRepository.replaceById(id, collection);
  }

  @authenticate('BasicStrategy')
  @del('/collections/{id}', {
    responses: {
      '204': {
        description: 'Collection DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.collectionRepository.deleteById(id);
  }
}
