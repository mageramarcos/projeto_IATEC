import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './schemas/customer.schema';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private readonly customerModel: Model<Customer>,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const exists = await this.customerModel
      .findOne({ email: dto.email })
      .lean();
    if (exists) {
      throw new BadRequestException('Email already registered');
    }

    const created = new this.customerModel(dto);
    return created.save();
  }

  async findAll(): Promise<Customer[]> {
    return this.customerModel.find().sort({ createdAt: -1 }).lean();
  }

  async findOne(id: string): Promise<Customer> {
    this.ensureObjectId(id);
    const customer = await this.customerModel.findById(id).lean();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    this.ensureObjectId(id);
    const updated = await this.customerModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .lean();
    if (!updated) {
      throw new NotFoundException('Customer not found');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    this.ensureObjectId(id);
    const deleted = await this.customerModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException('Customer not found');
    }
  }

  private ensureObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    }
  }
}
