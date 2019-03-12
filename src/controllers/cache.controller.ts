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
    console.log(newCacheInstance)
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
  async findById(@param.path.number('id') id: number): Promise<Cache> {
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
    @param.path.number('id') id: number,
    @requestBody() cache: Cache,
  ): Promise<void> {
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
    @param.path.number('id') id: number,
    @requestBody() cache: Cache,
  ): Promise<void> {
    await this.cacheRepository.replaceById(id, cache);
  }

  async cacheData(cache?: Cache) {
    if (!cache) {
      throw new HttpErrors.PreconditionFailed("Error: invalid cache instance")
    }
    let collection = await this.collectionRespository.findById(cache.collectionID)
    let collectionToken;
    let settings;
    var response;
    var jsonResponse;
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
        if (e.endpointPath.includes('login')) {
          settings = {
            method: "POST",
            body: JSON.stringify(e.credentials)
          }
          if (!e.baseURL) {
            throw new HttpErrors.PreconditionFailed('Error: invalid endpoint present')
          }
          response = await fetch(e.baseURL.concat(e.endpointPath), settings)
          jsonResponse = await response.json()
          collectionToken = "Bearer " + jsonResponse.data.token
        }
        return;
      };
    } else {
      var toEncode = Buffer.from(`${collection.credentials['username']}:${collection.credentials['password']}`);
      var encoded = toEncode.toString('base64');
      collectionToken = "Basic " + encoded;
    }
    for (var e of endpoints) {
      if (!e) {
        throw new HttpErrors.PreconditionFailed('Error: invalid endpoint present')
      }
      if (!e.authenticationType) {
        throw new HttpErrors.PreconditionFailed('Error: invalid endpoint present')
      }
      if (!e.baseURL) {
        throw new HttpErrors.PreconditionFailed('Error: invalid endpoint present')
      }
      if (e.authenticationType.toLowerCase() === 'basic') {
        if (!e.credentials) {
          throw new HttpErrors.PreconditionFailed("Error: no credentials present")
        }
        var toEncode = Buffer.from(`${e.credentials['username']}:${e.credentials['password']}`);
        var encoded = toEncode.toString('base64');
        var basicToken = "Basic " + encoded;
        settings = {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": basicToken
          }
        }

        response = await fetch(e.baseURL.concat(e.endpointPath), settings)
        jsonResponse = await response.json()
        var newData = {}
        newData[e.endpointPath] = jsonResponse
        cache.data = { ...cache.data, ...newData }
        if (e.endpointList && e.endpointList.length !== 0) {
          for (var path of e.endpointList) {
            if (!e.baseURL) {
              throw new HttpErrors.PreconditionFailed('Error: invalid endpoint present')
            }
            response = await fetch(e.baseURL.concat(path), settings)
            jsonResponse = await response.json()
            cache.data[path] = jsonResponse
          }
        }
      } else {
        settings = {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": collectionToken
          }
        }
        response = await fetch(e.baseURL.concat(e.endpointPath), settings)
        jsonResponse = await response.json()
        cache.data[e.endpointPath] = jsonResponse
        if (e.endpointList && e.endpointList.length !== 0) {
          for (var path of e.endpointList) {
            if (!e.baseURL) {
              throw new HttpErrors.PreconditionFailed('Error: invalid endpoint present')
            }
            response = await fetch(e.baseURL.concat(path), settings)
            jsonResponse = await response.json()
            cache.data[path] = jsonResponse
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
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.cacheRepository.deleteById(id);
  }
}
