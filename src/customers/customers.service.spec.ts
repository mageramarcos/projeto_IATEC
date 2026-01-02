import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CustomersService } from './customers.service';
import { Customer } from './schemas/customer.schema';

type MockedModel<TDocument> = jest.Mock &
  Pick<
    Model<TDocument>,
    'findOne' | 'findById' | 'find' | 'findByIdAndUpdate' | 'findByIdAndDelete'
  >;

// Helper to create a simple mock of the Mongoose Model (instantiable with used methods)
function createModelMock(): Model<Customer> {
  const fn = jest.fn() as MockedModel<Customer>;
  fn.findOne = jest.fn();
  fn.findById = jest.fn();
  fn.find = jest.fn();
  fn.findByIdAndUpdate = jest.fn();
  fn.findByIdAndDelete = jest.fn();
  return fn as unknown as Model<Customer>;
}

describe('CustomersService', () => {
  let service: CustomersService;
  let model: Model<Customer>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getModelToken(Customer.name),
          useValue: createModelMock(),
        },
      ],
    }).compile();

    service = moduleRef.get(CustomersService);
    model = moduleRef.get(getModelToken(Customer.name));
  });

  it('creates customer when email is new', async () => {
    (model.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const fakeDoc = {
      save: jest.fn().mockResolvedValue({ _id: 'id', email: 'a@a.com' }),
    };
    (model as unknown as jest.Mock).mockReturnValue(fakeDoc);

    const result = await service.create({
      name: 'Ana',
      email: 'a@a.com',
      country: 'BR',
    });

    expect(result).toEqual({ _id: 'id', email: 'a@a.com' });
    expect(fakeDoc.save).toHaveBeenCalled();
  });

  it('throws when creating with duplicate email', async () => {
    (model.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'exists' }),
    });

    await expect(
      service.create({ name: 'Ana', email: 'a@a.com', country: 'BR' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws on invalid id lookup', async () => {
    await expect(service.findOne('invalid')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws when customer not found', async () => {
    const validId = new Types.ObjectId().toHexString();
    (model.findById as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    await expect(service.findOne(validId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
