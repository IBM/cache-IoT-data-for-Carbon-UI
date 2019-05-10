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
  HttpErrors,
} from '@loopback/rest';
import { Cache } from '../models';
import { CacheRepository, EndpointRepository, CollectionRepository } from '../repositories';
import { inject } from '@loopback/context';
import {
  AuthenticationBindings,
  UserProfile,
  authenticate,
} from '@loopback/authentication';
import * as request from 'request-promise-native';

export class CacheController {
  constructor(
    @repository(CacheRepository)
    public cacheRepository: CacheRepository,
    @repository(EndpointRepository)
    private endpointRepository: EndpointRepository,
    @repository(CollectionRepository)
    private collectionRespository: CollectionRepository,
    @inject(AuthenticationBindings.CURRENT_USER) private user: UserProfile,
  ) { }

  @authenticate('BasicStrategy')
  @post('/cache', {
    responses: {
      '200': {
        description: 'Cache model instance',
        content: { 'application/json': { schema: { 'x-ts-type': Cache } } },
      },
    },
  })
  async create(@requestBody() cache: Cache) {
    var newCacheInstance = await this.cacheData(cache)
    Object.assign(cache, newCacheInstance)
    return await this.cacheRepository.create(cache)
      .catch(async err => {
        await this.cacheRepository.updateById(cache.collectionID, cache)
        return cache;
      });
    //return await this.cacheRepository.create(cache);
  }

  @authenticate('BasicStrategy')
  @get('/cache/count', {
    responses: {
      '200': {
        description: 'Cache model count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(Cache)) where?: Where,
  ): Promise<Count> {
    return await this.cacheRepository.count(where);
  }

  @authenticate('BasicStrategy')
  @get('/cache', {
    responses: {
      '200': {
        description: 'Array of Cache model instances',
        content: {
          'application/json': {
            schema: { type: 'array', items: { 'x-ts-type': Cache } },
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(Cache)) filter?: Filter,
  ): Promise<Cache[]> {
    return await this.cacheRepository.find(filter);
  }

  @authenticate('BasicStrategy')
  @patch('/cache', {
    responses: {
      '200': {
        description: 'Cache PATCH success count',
        content: { 'application/json': { schema: CountSchema } },
      },
    },
  })
  async updateAll(
    @requestBody() cache: Cache,
    @param.query.object('where', getWhereSchemaFor(Cache)) where?: Where,
  ): Promise<Count> {
    return await this.cacheRepository.updateAll(cache, where);
  }

  @authenticate('BasicStrategy')
  @get('/cache/{id}', {
    responses: {
      '200': {
        description: 'Cache model instance',
        content: { 'application/json': { schema: { 'x-ts-type': Cache } } },
      },
    },
  })
  async findById(@param.path.string('id') id: string): Promise<Cache> {
    return await this.cacheRepository.findById(id);
  }

  @authenticate('BasicStrategy')
  @patch('/cache/{id}', {
    responses: {
      '204': {
        description: 'Cache PATCH success',
        content: { 'application/json': { schema: { 'x-ts-type': Cache } } }
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody() cache: Cache,
  ): Promise<void> {
    var endpoint = await this.endpointRepository.findById(cache.endpointID)
    var collection = await this.collectionRespository.findById(cache.collectionID)
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
    if (!endpoint) {
      throw new HttpErrors.BadRequest(`Error: no endpoint was found with ID ${id}`)
    }

    if (!endpoint.authenticationType) {
      useEndpointAuth = false
    }

    if (!endpoint.baseURL) {
      useEndpointBase = false
    }

    if (!endpoint.credentials) {
      useEndpointCreds = false
    } else if (!endpoint.credentials['username']) {
      useEndpointCreds = false
    } else if (!endpoint.credentials['password']) {
      useEndpointCreds = false
    }

    if (useEndpointAuth) {
      if (useEndpointCreds) {
        options['auth'] = {
          'user': endpoint.credentials['username'],
          'pass': endpoint.credentials['password']
        }
      } else {
        options['auth'] = {
          'user': collection.credentials['username'],
          'pass': endpoint.credentials['password']
        }
      }

      if (useEndpointBase) {
        url = endpoint.baseURL.concat(endpoint.endpointPath)
      } else {
        url = collection.baseURL.concat(endpoint.endpointPath)
      }

      cache.data = await this.makeRequest(
        options,
        url,
        cache.data,
        endpoint.endpointPath
      )
    } else {
      options['auth'] = {
        'user': collection.credentials['username'],
        'pass': collection.credentials['password']
      }
      if (useEndpointBase) {
        url = endpoint.baseURL.concat(endpoint.endpointPath)
      } else {
        url = collection.baseURL.concat(endpoint.endpointPath)
      }

      cache.data = await this.makeRequest(
        options,
        url,
        cache.data,
        endpoint.endpointPath
      )

    }
    await this.cacheRepository.updateById(id, cache)
  }

  @authenticate('BasicStrategy')
  @put('/cache/{id}', {
    responses: {
      '204': {
        description: 'Cache PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() cache: Cache,
  ): Promise<void> {
    await this.cacheRepository.replaceById(id, cache);
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
    let collection = await this.collectionRespository.findById(cache.collectionID)
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
  @del('/cache/{id}', {
    responses: {
      '204': {
        description: 'Cache DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.cacheRepository.deleteById(id);
  }
}
