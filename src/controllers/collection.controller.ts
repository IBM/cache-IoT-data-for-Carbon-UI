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
import { Collection } from '../models';
import { CollectionRepository } from '../repositories';
import { inject } from '@loopback/context';
import {
  AuthenticationBindings,
  UserProfile,
  authenticate,
} from '@loopback/authentication';

export class CollectionController {
  constructor(
    @repository(CollectionRepository)
    public collectionRepository: CollectionRepository,
    @inject(AuthenticationBindings.CURRENT_USER) private user: UserProfile,
  ) { }

  validate(collection?: Collection) {
    if (!collection) {
      throw new HttpErrors.BadRequest('Error: no collection given')
    }

    if (collection.collectionID <= 0) {
      throw new HttpErrors.BadRequest("Error: collectionID must be positive and nonzero")
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
    return await this.collectionRepository.create(collection);
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
  async findById(@param.path.number('id') id: number): Promise<Collection> {
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
    @param.path.number('id') id: number,
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
    @param.path.number('id') id: number,
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
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.collectionRepository.deleteById(id);
  }
}
