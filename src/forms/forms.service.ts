import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Form } from './entities/form.entity';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';

@Injectable()
export class FormsService {
  constructor(
    @InjectModel(Form.name) private readonly formModel: Model<Form>,
  ) {}

  async create(createFormDto: CreateFormDto): Promise<Form> {
    console.log('Creating form with data:', createFormDto);
    
    // Ensure userId is provided
    if (!createFormDto.userId) {
      throw new Error('userId is required');
    }
    
    const createdForm = new this.formModel(createFormDto);
    console.log('Form model before save:', createdForm);
    
    const savedForm = await createdForm.save();
    console.log('Form saved successfully:', savedForm);
    
    // Populate user data and return
    return this.formModel.findById(savedForm._id).populate('userId').exec();
  }

  async findAll(): Promise<Form[]> {
    return this.formModel.find().populate('userId').exec();
  }

  async findOne(id: string): Promise<Form> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid form ID');
    }
    
    const form = await this.formModel.findById(id).populate('userId').exec();
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    return form;
  }

  async findByUserId(userId: string): Promise<Form[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID');
    }
    
    return this.formModel.find({ userId: userId }).populate('userId').exec();
  }

  async update(id: string, updateFormDto: UpdateFormDto): Promise<Form> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid form ID');
    }

    const updatedForm = await this.formModel
      .findByIdAndUpdate(id, updateFormDto, { new: true })
      .populate('userId')
      .exec();
    
    if (!updatedForm) {
      throw new NotFoundException('Form not found');
    }
    return updatedForm;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid form ID');
    }

    const result = await this.formModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Form not found');
    }
  }
} 